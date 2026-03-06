# SEGERA – Sistem Informasi Geospasial Terintegrasi Perikanan

Aplikasi Geotagging Usaha Kelautan & Perikanan  
Cabang Dinas Kelautan dan Perikanan Kab. Malang

## Deploy ke Vercel

### Cara 1: Via Vercel Dashboard (Paling Mudah)
1. Buat akun di https://vercel.com (gratis)
2. Klik "Add New Project"
3. Pilih "Upload" folder ini
4. Klik Deploy → selesai!

### Cara 2: Via GitHub + Vercel (Rekomendasi)
1. Upload folder ini ke GitHub repository
2. Login Vercel → "Import Git Repository"
3. Pilih repo → Deploy otomatis setiap ada update

### Cara 3: Via Vercel CLI
```bash
npm install -g vercel
cd segera-deploy
vercel --prod
```

## Struktur File
```
segera-deploy/
├── index.html     # Aplikasi utama (semua fitur)
├── vercel.json    # Konfigurasi Vercel
└── README.md      # Panduan ini
```

## Login Admin
- Username: admin
- Password: admin123

## Catatan
Data saat ini masih in-memory (hilang saat refresh).
Untuk data permanen, hubungi developer untuk integrasi Supabase/PostgreSQL.
