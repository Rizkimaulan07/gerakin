# Gerakin

**Setiap langkah berarti.**

Gerakin adalah aplikasi olahraga bergaya Strava untuk mencatat aktivitas, memantau rute, jarak, pace, dan progres, lalu berbagi dengan komunitas. Aplikasi web responsif ini memakai API Express dan PostgreSQL untuk menyimpan data aktivitas dan komunitas.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=0b0d0a)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)

## Fitur

- **Dashboard** — ringkasan jarak, durasi, pace, kalori, grafik mingguan, target, dan aktivitas terbaru.
- **Rekam aktivitas** — GPS asli lewat `navigator.geolocation.watchPosition`, timer, pause/lanjut, jarak manual, dan penyimpanan aktivitas beserta rute ke PostgreSQL.
- **Mode demo 10×** — simulasi rute di sekitar GBK dengan waktu berjalan 10× lebih cepat, berguna untuk mencoba aplikasi di dalam ruangan.
- **Delapan olahraga** — lari, sepeda, jalan kaki, hiking, renang, gym, futsal, dan yoga.
- **Peta rute** — Leaflet dengan basemap gelap Esri, pusat otomatis ke lokasi GPS, penanda posisi live, tombol kembali ke lokasi, garis rute, dan mode mengikuti posisi.
- **Riwayat aktivitas** — pencarian, filter olahraga, pencatatan manual, dan detail aktivitas dengan grafik pace.
- **Akun pengguna** — pendaftaran dan login email, sesi aman, serta logout.
- **Feed sosial** — kudos, komentar, cerita, saran teman, dan leaderboard.
- **Jelajah** — leaderboard, rute populer, dan klub di sekitar.
- **Tantangan & klub** — progres tantangan, badge, rencana latihan, komunitas, dan event.
- **Profil** — edit profil, statistik, rekor pribadi, badge, dan pengaturan tampilan.
- **Halaman sambutan** — pengantar fitur, form masuk/daftar, dan keterangan ketersediaan web/APK.
- **Tema gelap/terang** — gelap sebagai default, aksen lime `#b6f240`, dan layout responsif dari ponsel sampai desktop.

## Menjalankan

Prasyarat: Node.js 22+, npm, dan PostgreSQL.

```bash
npm install
Copy-Item .env.example .env
# Sesuaikan PGHOST, PGPORT, PGUSER, PGPASSWORD, dan PGDATABASE di .env
npm run dev
```

Buat database dan data awal secara otomatis saat `npm run dev` dijalankan. File `.env` berisi kredensial lokal dan tidak boleh dimasukkan ke git. Buka `http://localhost:5173`. Untuk mencoba di perangkat lain dalam jaringan yang sama:

```bash
npm run dev -- --host
```

Perintah lain:

```bash
npm run build    # type-check + build produksi ke dist/
npm run preview  # menjalankan hasil build secara lokal
npm run lint     # oxlint
```

## Cara mencoba perekaman

1. Buka menu **Rekam**.
2. Pilih olahraga.
3. Aktifkan **Mode demo 10×** jika ingin mencoba tanpa GPS, lalu tekan **Mulai**.
4. Setelah beberapa detik, tekan **Selesai** untuk menyimpan dan membuka detail aktivitas.

Untuk GPS asli, browser meminta izin lokasi. GPS browser umumnya hanya berjalan pada `localhost` atau HTTPS. Jika izin ditolak, aktivitas tetap bisa disimpan menggunakan isian **jarak manual**.

## Arsitektur

```text
src/
├── components/
│   ├── layout/          # App shell, sidebar, bottom nav, top bar
│   ├── ui/              # Komponen bergaya shadcn/ui di atas Radix
│   ├── activity-map.tsx # Peta Leaflet dan rendering rute
│   ├── charts.tsx       # Grafik Recharts
│   └── ...              # Kartu aktivitas, feed, dialog, avatar, dll.
├── data/mock.ts         # Data awal pengguna, aktivitas, rute, tantangan, klub
├── lib/                 # Format angka, Haversine, metadata olahraga, util
├── pages/               # Sembilan halaman aplikasi
├── store/               # Zustand + persistensi localStorage
├── types/               # Tipe bersama
├── App.tsx              # Routing (HashRouter) dan lazy loading halaman
└── index.css            # Token tema Tailwind 4, utilitas, animasi
```

**Stack utama**

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Komponen shadcn-style dengan Radix UI, `class-variance-authority`, dan `tailwind-merge`
- Zustand untuk state dan persistensi
- React Router (`HashRouter` agar aman untuk hosting statis dan WebView APK)
- Leaflet + React Leaflet dengan tile Esri Dark Gray
- Recharts untuk grafik, Sonner untuk notifikasi, Lucide untuk ikon
- Express API + PostgreSQL (`pg`) untuk aktivitas, profil, feed, tantangan, dan klub
- `.env` lokal untuk konfigurasi koneksi database

## Penyimpanan data

Data utama aplikasi disimpan di PostgreSQL dan diakses melalui API Express. Password akun di-hash dengan scrypt; browser menerima session cookie `HttpOnly`, bukan token yang disimpan di `localStorage`. Rekaman GPS mengirim titik rute sebagai JSONB pada aktivitas. Zustand memakai `localStorage` (`gerakin-store`) hanya untuk preferensi tema.

Untuk menyiapkan tabel dan data awal tanpa menghapus data yang ada, jalankan `npm run db:setup`. Perintah ini juga menambahkan kolom autentikasi dan tabel sesi bila belum ada. Buat akun dari halaman sambutan. Perintah `npm run db:reset` menghapus data tabel dan mengisinya kembali dengan data awal.

## Batasan MVP

- Pemulihan kata sandi dan verifikasi email belum tersedia.
- APK Android belum tersedia; aplikasi saat ini dijalankan melalui browser.
- Beberapa data demo seperti feed, follower, dan progres tantangan berawal dari data seed.
- Rekaman GPS berhenti ketika tab/browser ditutup dan belum berjalan di background.
- Rute tersimpan sebagai titik koordinat di `localStorage`, belum diunggah ke server.

## Langkah berikutnya

1. **Autentikasi** — login email/Google/Strava dan kontrol akses per pengguna.
2. **APK** — bungkus dengan Capacitor, tambahkan izin lokasi background, lalu build Android.
3. **GPS background** — gunakan plugin lokasi native untuk merekam saat layar mati.
4. **Media & sosial** — unggah foto aktivitas, notifikasi, pesan, dan feed real-time.
5. **PWA** — manifest, service worker, dan instalasi ke home screen.
6. **Kualitas** — unit test untuk kalkulasi jarak/pace, E2E test, dan optimasi bundle.

---

Dibuat untuk kamu yang ingin terus bergerak. **Setiap langkah berarti.**
