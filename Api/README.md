SNECHAT Backend (Google Gemini, gratis, lewat Vercel)
Server kecil ini jadi "penjaga gerbang" antara aplikasi Snechat dan Google Gemini API.
API key Gemini kamu disimpan aman di Vercel (Environment Variables) — tidak pernah terlihat di kode frontend (snechat.html).
Dipilih pakai Vercel karena benar-benar tidak minta kartu kredit sama sekali untuk paket gratisnya, beda dengan Render yang kadang minta walau katanya gratis.
1. Ambil API key Gemini (gratis, tanpa kartu kredit)
Buka https://aistudio.google.com/apikey, login pakai akun Google.
Klik Create API key, salin key-nya (diawali AIza...).
2. Upload folder ini ke GitHub
Buka github.com dari HP, login/daftar.
Bikin repository baru, misal snechat-backend.
Upload SEMUA isi folder snechat-backend ini, termasuk foldernya:
api/chat.js
api/image.js
package.json
(Struktur foldernya harus tetap ada folder api di dalam repo — kalau upload lewat web GitHub, buat file barunya dengan nama api/chat.js langsung saat "Create new file", GitHub otomatis bikinin foldernya.)
3. Deploy ke Vercel (gratis, tanpa kartu)
Buka https://vercel.com dari HP, tap Sign Up, pilih Continue with GitHub.
Setelah login, tap Add New... → Project.
Pilih repo snechat-backend tadi → tap Import.
Sebelum deploy, buka bagian Environment Variables, tambahkan:
Name: GEMINI_API_KEY
Value: (paste API key kamu)
Tap Deploy, tunggu ±1 menit.
Setelah selesai kamu dapat URL seperti https://snechat-backend-xxxx.vercel.app — salin URL ini.
4. Sambungkan ke snechat.html
Buka snechat.html, cari baris:
Js
Ganti dengan URL Vercel kamu, misal:
Js
Simpan. Sekarang chat dan generate gambar bakal jalan beneran, gratis, kapan saja.
Kenapa perlu backend?
Kalau API key ditaruh langsung di file HTML, siapa pun yang buka file itu bisa mencuri key-nya lewat "View Source". Backend ini memastikan key hanya ada di server Vercel, tidak pernah dikirim ke browser pengguna.
