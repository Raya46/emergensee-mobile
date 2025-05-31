![Welcome](https://github.com/user-attachments/assets/55bcf9c4-3af9-43d5-8689-0a746c75dcaf)
![Splash](https://github.com/user-attachments/assets/f93cba11-6922-48a8-afb9-b54495b24cdc)


# EmergenSee Mobile

**EmergenSee Mobile** adalah aplikasi mobile interaktif yang memberikan indikasi awal objektif dan transparan terkait potensi kriteria gawat darurat sesuai standar **BPJS Kesehatan** bagi pasien di **Instalasi Gawat Darurat (IGD)**. 

---

## ✨ Fitur Utama

- **Input Tanda Vital**: Formulir ramah pengguna dengan validasi Zod.
- **Local-First & Offline Mode**: Penyimpanan lokal via AsyncStorage, sinkronisasi otomatis saat online.
- **Chatbot AI Personalisasi**: Prediksi klaim BPJS berdasarkan tanda vital menggunakan **Gemini** + **n8n Webhook**.
- **Skor Urgensi BPJS**: Algoritma skor prioritas darurat untuk user.
- **Autentikasi Aman**: Menggunakan `better-auth`.

---

## 🔧 Teknologi yang Digunakan

### ⚛️ React Native (dengan Expo)
React Native memungkinkan pengembangan aplikasi lintas platform (Android & iOS) dari satu basis kode, sangat efisien untuk tim kecil dan cepat dalam iterasi. Expo mendukung workflow terkelola, memudahkan testing, build.

### 🎨 TailwindCSS (melalui NativeWind)
NativeWind membawa kekuatan utility-first dari TailwindCSS ke React Native. Ini mempercepat proses styling, menjaga konsistensi UI, dan memudahkan kolaborasi antara desainer dan developer dengan pendekatan deklaratif dan bersih.

### 🔐 better-auth – Autentikasi Pengguna
Karena sederhana namun aman, mendukung manajemen sesi dan token secara efisien. Fleksibel dan ringan untuk aplikasi mobile.

### 🧩 Neon Postgres – Database Serverless
Neon adalah PostgreSQL modern yang mendukung arsitektur serverless. Cocok untuk menyimpan data terenkripsi, memiliki performa cepat, dan hemat biaya—ideal untuk startup dan aplikasi dengan beban dinamis. Integrasi dengan edge dan ekosistem JavaScript sangat baik.

### ✅ Zod – Validasi Data Tipe-Aman
Zod memberikan validasi skema yang kuat dan type-safe, sangat cocok untuk React Native dan TypeScript. Dengan Zod, memastikan bahwa input data seperti suhu dan tekanan darah tervalidasi sebelum diproses atau disimpan.

### 💾 AsyncStorage – Penyimpanan Lokal
AsyncStorage digunakan untuk pendekatan **local-first**, memungkinkan aplikasi tetap berjalan offline. 

### 🤖 Gemini – Model AI untuk Prediksi
Gemini digunakan sebagai AI chatbot untuk memberikan prediksi keberhasilan klaim BPJS berdasarkan input data. Dengan pendekatan zero-shot dan kemampuan reasoning, Gemini memberikan hasil personalisasi berkualitas tinggi.

### 🔄 n8n Webhook – Otomatisasi Chatbot
n8n menyediakan sistem alur kerja no-code/low-code yang fleksibel. Menggunakan webhook n8n untuk menjembatani data pengguna ke model AI, mengatur alur input/output, serta menyederhanakan integrasi dengan layanan pihak ketiga.


---

## 👨‍💻 Tim Pengembang (Tim Advadev)

- **Ausath Abidzil**
- **Aydie Rahma** 
- **Kayla Alisha R.** 
- **M. Raya Ar Rizki** 

---

## 🚀 Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/advadev/emergensee-mobile.git
   cd emergensee-mobile

