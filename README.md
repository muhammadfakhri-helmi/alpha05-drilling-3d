# Alpha-05 — Mockup Urutan Pemboran 3D

[![Buka mockup](https://img.shields.io/badge/buka-mockup%203D-1F2326)](https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/)

Mockup interaktif Three.js yang menggambarkan urutan operasi pemboran dari rig sampai komplesi,
berdasarkan data rencana (plan) sebuah sumur pengembangan. Nama sumur dan seluruh identitas
proyek asli (operator, lokasi, koordinat, biaya) telah disamarkan/dihilangkan.

**Live demo:** `https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/`

<img src="qr.svg" width="180" alt="QR code menuju mockup">

## Isi

- `index.html` — mockup 3D lengkap (Three.js, self-contained, satu file)
- `qr.svg` — QR code menuju halaman GitHub Pages repo ini

## Fitur

- 12 tahap operasi: rig setup, conductor, empat section lubang (26", 17-1/2", 12-1/4", 8-1/2")
  berikut casing dan cementing tiap section, wireline logging, liner 7", dan komplesi
  (perforasi, tubing + ESP, X-mas tree).
- Tiga sudut kamera: Rig (permukaan), Ikuti bit (cutaway bawah tanah), Seluruh sumur (trajectory
  penuh dengan penampang formasi).
- Panel data per section: BHA, program lumpur dan mud window, hidrolika, spesifikasi casing
  dengan safety factor, program semen, peralatan well control, dan hazard/mitigasi.
- Linimasa yang bisa di-scrub, kecepatan putar 0.5x–4x, dan log kedalaman (MD/TVD/inklinasi)
  yang bergerak mengikuti bit.
- Formasi disamarkan sebagai Fm-A sampai Fm-G.

## Menjalankan

**Lokal:** buka `index.html` langsung di browser (perlu koneksi internet karena Three.js dan
font dimuat dari CDN).

**GitHub Pages:**
1. Buka **Settings → Pages** pada repo ini.
2. Di bagian **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
3. Setelah 1–2 menit, halaman aktif di `https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/`.

## Catatan

Diameter lubang dan casing diperbesar 5× dari skala aslinya supaya terlihat jelas dalam satu
tampilan. Data yang ditampilkan adalah data rencana (plan), bukan data aktual hasil pemboran.
