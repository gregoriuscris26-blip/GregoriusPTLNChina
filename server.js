require('dotenv').config();

let globalMasterMemory = [];

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
    res.send("🚀 GREGORIUS.AI SERVER IS ONLINE!");
});

app.post("/improve/user_greg", async (req, res) => {
    const rawText = req.body.text || "";
    const text = rawText.trim();
    // Kita buat pengecekan MasterMode lebih fleksibel
    const isMasterMode = req.body.isMasterMode === true || req.body.isMasterMode === "true";

    console.log(`Log Masuk - Pesan: "${text}" | MasterMode: ${isMasterMode}`);

    // 1. LOGIKA BELAJAR MASTER
    if (isMasterMode && text.toUpperCase().startsWith("GM:")) {
        const ajaranBaru = text.substring(3).trim();
        if (ajaranBaru) {
            globalMasterMemory.push(ajaranBaru);
            return res.json({
                reply: `[SISTEM MASTER] Instruksi "${ajaranBaru}" berhasil dikunci.`,
                isMaster: true
            });
        }
    }

    // 2. LIHAT MEMORI
    if (isMasterMode && text.toUpperCase() === "GML//ALL") {
        const daftar = globalMasterMemory.length > 0
            ? globalMasterMemory.map((a, i) => `${i + 1}. ${a}`).join("\n")
            : "Memori kosong.";
        return res.json({ reply: `[DATABASE]\n${daftar}`, isMaster: true });
    }

    // 3. PROSES KE GROQ AI (MODEL TERBARU)
    try {
        let currentSystemPrompt = "Kamu adalah Gregorius.AI, asisten konsultasi beasiswa China.";
        if (globalMasterMemory.length > 0) {
            currentSystemPrompt += "\n\nATURAN MUTLAK MASTER:\n" + globalMasterMemory.join("\n");
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: currentSystemPrompt },
                { role: "user", content: text }
            ],
            // UPDATE MODEL DI SINI AGAR TIDAK ERROR 400 LAGI
            model: "llama-3.3-70b-versatile", 
        });

        res.json({
            reply: completion.choices[0]?.message?.content || "Maaf, AI tidak merespon.",
            isMaster: isMasterMode
        });
    } catch (error) {
        console.error("GROQ_ERROR:", error.message);
        res.status(500).json({ reply: "Terjadi kesalahan pada model AI." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});