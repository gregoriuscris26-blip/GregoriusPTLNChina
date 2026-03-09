require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Pastikan kamu sudah memasukkan GROQ_API_KEY di tab Variables Railway
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let chatStore = { master: [], public: {} };

app.post('/improve/:userId', async (req, res) => {
    const { userId } = req.params;
    const { text, isMasterMode } = req.body;
    const masterCode = "GREGMANMAN";
    const logoutCode = "GREGKELUAR";

    // 1. LOGIKA LOGOUT
    if (text.toUpperCase() === logoutCode) {
        chatStore.master = []; 
        return res.json({ 
            reply: "Sesi Master diakhiri. Saya kembali menjadi Konsultan Publik Gregorius.AI. Ada yang bisa saya bantu terkait beasiswa China?", 
            isMaster: false, 
            logout: true 
        });
    }

    // 2. LOGIKA LOGIN MASTER
    if (text.toUpperCase() === masterCode) {
        chatStore.master = [{ 
            role: "system", 
            content: "Nama kamu adalah Gregorius.AI. Kamu adalah asisten pribadi Gregorius (Master). Kamu sangat akrab, hangat, dan panggil dia 'Greg'. Kamu tahu dia siswa berprestasi dari SMA Ricci 1 yang tertarik pada AI/CS. Bicara ringkas dan padat untuk obrolan santai. Berikan penjelasan mendalam hanya jika membahas hal teknis seperti coding, AI, atau fisika." 
        }];
        return res.json({ 
            reply: "Akses Master diterima. Halo Greg! Saya Gregorius.AI. Senang bisa mengobrol lagi denganmu secara personal. Apa agenda kita hari ini?", 
            isMaster: true 
        });
    }

    try {
        let history;
        let temp;
        if (isMasterMode) {
            history = chatStore.master;
            temp = 0.8; 
        } else {
            if (!chatStore.public[userId]) {
                chatStore.public[userId] = [{ 
                    role: "system", 
                    content: "Nama kamu adalah Gregorius.AI. Kamu adalah Konsultan Senior Pendidikan China dan Pakar Personal Statement. Tugasmu: Memberikan strategi masuk universitas top di China (Tsinghua, Peking, dll) dan tips beasiswa CSC/CIS. PENTING: Selalu perkenalkan namamu di awal. Bicara profesional dan ringkas. HANYA berikan jawaban panjang lebar jika user meminta dibuatkan atau dikoreksi Personal Statement-nya." 
                }];
            }
            history = chatStore.public[userId];
            temp = 0.4;
        }

        history.push({ role: "user", content: text });
        if (history.length > 20) history.splice(1, 2);

        const chat = await groq.chat.completions.create({
            messages: history,
            model: "llama-3.3-70b-versatile",
            temperature: temp,
        });

        const reply = chat.choices[0]?.message?.content || "";
        history.push({ role: "assistant", content: reply });

        res.json({ reply: reply, isMaster: isMasterMode });
    } catch (err) {
        console.error("Groq Error:", err.message);
        res.status(500).json({ reply: "Maaf Greg, server AI saya sedang sedikit lelah." });
    }
});

// Endpoint simpel untuk tes apakah server sudah hidup
app.get('/', (req, res) => {
    res.send("🚀 GREGORIUS.AI SERVER IS ONLINE!");
});

// BAGIAN KRUSIAL: Penyesuaian Port dan Host untuk Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log("========================================");
    console.log(`🚀 GREGORIUS.AI SERVER IS RUNNING`);
    console.log(`📍 Port: ${PORT} | Mode: Cloud/Local`);
    console.log("========================================");
});