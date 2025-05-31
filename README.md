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

- **React Native** (dengan **Expo**)  
- **TailwindCSS** (melalui NativeWind)  
- **better-auth** – Autentikasi pengguna  
- **Neon Postgres** – Database serverless  
- **Zod** – Validasi data tipe-aman  
- **AsyncStorage** – Penyimpanan lokal  
- **Gemini** – Model AI untuk prediksi  
- **n8n Webhook** – Otomatisasi chatbot  

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

