require('dotenv').config();
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

app.post('/improve/:userId', async (req, res) => {
    const { userId } = req.params;
    const { text, isMasterMode } = req.body;
    const masterCode = "GREGMANMAN";
    const logoutCode = "GREGKELUAR";

    if (!text) return res.status(400).json({ reply: "Teks tidak boleh kosong." });

    if (text.toUpperCase() === logoutCode) {
        chatStore.master = []; 
        return res.json({ 
            reply: "Sesi Master diakhiri. Saya kembali menjadi Konsultan Publik.", 
            isMaster: false, 
            logout: true 
        });
    }

    if (text.toUpperCase() === masterCode) {
        chatStore.master = [{ 
            role: "system", 
            content: "Nama kamu Gregorius.AI. Asisten pribadi Greg. Akrab, hangat, panggil 'Greg'. Fokus ke AI/CS dan Fisika." 
        }];
        return res.json({ 
            reply: "Akses Master diterima. Halo Greg! Apa agenda kita hari ini?", 
            isMaster: true 
        });
    }

    try {
        let history;
        if (isMasterMode) {
            history = chatStore.master;
        } else {
            if (!chatStore.public[userId]) {
                chatStore.public[userId] = [{ 
                    role: "system", 
                    content: "Kamu Gregorius.AI, Konsultan Senior Pendidikan China. Profesional dan ringkas." 
                }];
            }
            history = chatStore.public[userId];
        }

        history.push({ role: "user", content: text });
        if (history.length > 15) history.splice(1, 2);

        const chat = await groq.chat.completions.create({
            messages: history,
            model: "llama-3.3-70b-versatile",
            temperature: isMasterMode ? 0.8 : 0.4,
        });

        const reply = chat.choices[0]?.message?.content || "Maaf, saya tidak bisa merespons.";
        history.push({ role: "assistant", content: reply });

        res.json({ reply: reply, isMaster: isMasterMode });
    } catch (err) {
        console.error("Groq Error:", err.message);
        res.status(500).json({ reply: "Server AI sedang lelah, coba lagi nanti." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});