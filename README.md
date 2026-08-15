# SNECHAT Backend (Google Gemini — Gratis)

Server kecil yang jadi "penjaga gerbang" antara aplikasi Snechat dan Google Gemini API.
API key Gemini kamu disimpan aman di server ini — **tidak pernah** terlihat di kode frontend (snechat.html), jadi tidak bisa dicuri orang lain.

Gemini dipilih karena punya kuota gratis harian tanpa perlu kartu kredit — beda dari OpenAI yang sekarang nyaris tidak ada jalur gratis lagi.

## 1. Ambil API key Gemini (gratis, tanpa kartu kredit)

1. Buka https://aistudio.google.com/apikey, login pakai akun Google kamu.
2. Klik **Create API key**, pilih/bikin project, lalu salin key-nya (formatnya diawali `AIza...`).
3. Simpan baik-baik — jangan dibagikan ke siapa pun atau ditaruh di kode publik.

Kuota gratis saat ini kurang lebih:
- `gemini-2.5-flash-lite` (dipakai buat SNECHAT 0.1): ~15 request/menit, ~1.000 request/hari
- `gemini-2.5-flash` (dipakai buat SNECHAT 0.10): ~10 request/menit, ~250 request/hari
- `gemini-2.5-flash-image` (generate gambar): ikut kuota gratis Flash

Kalau kena limit, tinggal tunggu sebentar (kuota reset per menit/hari) — tidak perlu bayar apa pun.

> ⚠️ Google kadang mengganti nama model gratisnya. Kalau suatu saat backend berhenti jalan dan errornya soal "model not found", cek daftar model terbaru di https://ai.google.dev/gemini-api/docs/models lalu update `MODEL_FAST` / `MODEL_DEEP` / `MODEL_IMAGE` di environment variable (langkah 3 di bawah).

## 2. Jalankan di komputer sendiri dulu (opsional, buat tes)

```bash
cd snechat-backend
npm install
cp .env.example .env
# buka .env, isi GEMINI_API_KEY dengan key kamu
npm start
```

Server jalan di `http://localhost:3000`. Kalau mau tes dari snechat.html di komputer yang sama, set `BACKEND_URL` di snechat.html ke `http://localhost:3000`.

## 3. Deploy supaya bisa diakses dari HP (Render.com — gratis)

1. Upload folder `snechat-backend` ini ke repository GitHub baru.
2. Buka https://render.com → daftar/login → **New +** → **Web Service**.
3. Hubungkan ke repo GitHub tadi.
4. Isi pengaturan:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Di bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY` = key kamu dari langkah 1
   - (opsional) `MODEL_FAST`, `MODEL_DEEP`, `MODEL_IMAGE` kalau mau override model default
6. Klik **Create Web Service**, tunggu build selesai.
7. Setelah selesai, kamu akan dapat URL seperti `https://snechat-backend-xxxx.onrender.com`.

> Catatan: paket gratis Render akan "tidur" kalau tidak dipakai beberapa menit, jadi request pertama setelah lama nganggur bisa terasa lambat (~30 detik). Ini normal untuk paket gratis.

## 4. Sambungkan ke snechat.html

Buka `snechat.html`, cari baris di paling atas script:

```js
const BACKEND_URL = "https://GANTI-DENGAN-URL-BACKEND-KAMU.onrender.com";
```

Ganti dengan URL dari langkah 3. Simpan, lalu buka ulang snechat.html — sekarang chat dan generate gambar akan benar-benar tersambung ke Gemini lewat backend kamu sendiri, gratis, kapan saja, di mana saja.

## Kenapa perlu backend, tidak bisa taruh API key langsung di HTML?

Kalau API key ditaruh langsung di file HTML, siapa pun yang membuka file itu (lewat "View Source" atau DevTools) bisa mencuri key kamu dan memakainya sesuka hati — kuota gratis kamu bisa habis dipakai orang lain. Backend ini memastikan key hanya ada di server, tidak pernah dikirim ke browser pengguna.
