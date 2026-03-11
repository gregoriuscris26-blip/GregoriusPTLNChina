require('dotenv').config();
// Taruh di bagian atas setelah deklarasi app
let globalMasterMemory = [];
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

// Setingan CORS agar bisa diakses dari GitHub Pages
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let chatStore = { master: [], public: {} };

// Route Utama untuk Cek Nyawa Server
app.get('/', (req, res) => {
    res.send("🚀 GREGORIUS.AI SERVER IS ONLINE!");
});

app.post("/improve/user_greg", async (req, res) => {
    // Kita bersihkan teks dari spasi di depan/belakang
    const rawText = req.body.text || "";
    const text = rawText.trim();
    const isMasterMode = req.body.isMasterMode === true || req.body.isMasterMode === "true";

    // DEBUG: Cek di log Railway apakah isMasterMode benar masuk sebagai true
    console.log(`Pesan masuk: "${text}" | MasterMode: ${isMasterMode}`);

    // 1. LOGIKA BELAJAR (KHUSUS MASTER)
    // Sekarang lebih fleksibel: GM: atau gm: atau Gm: semua masuk
    if (isMasterMode && text.toUpperCase().startsWith("GM:")) {
        const ajaranBaru = text.substring(3).trim(); 
        if (ajaranBaru) {
            globalMasterMemory.push(ajaranBaru);
            console.log("MEMORI DIUPDATE:", globalMasterMemory);
            return res.json({ 
                reply: `[SISTEM MASTER] Instruksi "${ajaranBaru}" telah diterima dan dikunci ke Koreksi Global.`,
                isMaster: true 
            });
        }
    }

    // 2. FITUR LIHAT MEMORI
    if (isMasterMode && text.toUpperCase() === "GML//ALL") {
        const daftar = globalMasterMemory.length > 0 
            ? globalMasterMemory.map((a, i) => `${i+1}. ${a}`).join("\n")
            : "Memori masih kosong, Master.";
        return res.json({ reply: `[DATABASE MASTER]\n${daftar}`, isMaster: true });
    }

    // 3. PROSES KE GROQ AI
    try {
        let currentSystemPrompt = "Kamu adalah Gregory.AI, asisten konsultasi beasiswa China.";
        
        // Suntikkan memori global ke prompt
        if (globalMasterMemory.length > 0) {
            currentSystemPrompt += "\n\nATURAN MUTLAK MASTER:\n" + globalMasterMemory.join("\n");
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: currentSystemPrompt },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192",
        });

        res.json({ 
            reply: completion.choices[0]?.message?.content || "Blank...",
            isMaster: isMasterMode 
        });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ reply: "Server Error" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});