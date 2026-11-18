# ALPHA-05 DWOP · 3D walkthrough (Tahap 1)

Presentasi DWOP ALPHA-05 sebagai walkthrough 3D: kamera menyusuri lokasi dan sumur dari rig sampai ESP; setiap slide PPTX v4 adalah satu stasiun kamera dan satu kartu HUD. Slide 14-18 tampil sebagai panel 2D terang. PPTX tetap menjadi cadangan.

Stack: Vite, React, TypeScript, @react-three/fiber, @react-three/drei, zustand, framer-motion. Build statis, font Montserrat dibundel, tanpa CDN.

## Menjalankan

```bash
cd presentation
npm install
npm run dev            # pengembangan, http://localhost:5173
npm run build          # build statis ke dist/
npm run preview        # sajikan dist/ di http://localhost:4173
npm run build:single   # SATU file html offline: dist-single/index.html (buka dengan klik dua kali)
npm test               # tes trajectory (TD 8,561 ft TVD, shoe TVD, inklinasi)
npm run check:numbers  # cek angka layar vs PPTX -> docs/number-check.md (butuh preview berjalan + playwright)
```

Untuk laptop presentasi tanpa internet: salin `dist-single/index.html` dan buka di Chrome/Edge.

## Link

- GitHub Pages (setelah branch ini di-merge ke `main`): `https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/dwop/`
- Digital twin lama tetap di root situs dan tidak diubah.
- `npm run build:pages` menyalin build ke `/dwop` di root repo; workflow `Build site` melakukannya otomatis di `main`.

## Tombol

| Tombol | Fungsi |
|---|---|
| Enter (juga panah kanan, spasi, PageDown) | Berikutnya: pembicara berikutnya di slide yang sama, lalu slide berikutnya |
| Panah kiri (juga PageUp) | Sebelumnya |
| B | Slide backup. Dari slide 3, 6, 8, 10 langsung ke 4, 7, 9, 11; dari slide lain muncul menu 1-4 |
| Esc | Kembali ke alur utama / tutup panel |
| P | Mode presenter: role aktif, timer per role, poin wajib, angka hafal, kalimat serah-terima. Tombol "Buka di jendela kedua" untuk layar extended |
| T / Shift+R | Mulai-jeda / reset timer (timer mulai otomatis pada Enter pertama) |
| S | Langkah pembicara on/off (off = Enter langsung ke slide berikutnya) |
| D | Detail laporan di slide 2, 3, 5, 6, 8, 10, 12, 13, 14, 15, 16, 17. Tombol angka 1-9 memilih tab, Enter/panah maju-mundur (di tab HSE per langkah), kamera 3D mengikuti tab. Esc kembali |
| I | Perbesar gambar slide (2, 12, 13) |
| V | Ganti tampilan 3D / 2D |
| F | Layar penuh |
| H | Bantuan |

Clicker presentasi (PageDown / PageUp) juga bekerja.

## Struktur

| Berkas | Isi |
|---|---|
| `src/data/content.ts` | Teks 18 slide, disalin dari PPTX v4 (`source/slides_text.md`). Satu-satunya sumber teks HUD |
| `src/data/sections.ts` | Detail laporan per slide: casing, semen, lumpur, well control, bahaya offset, urutan operasi, liner, completion (dengan rujukan tabel) |
| `src/data/hse.ts` | Register HSE 18 langkah: skor laporan Tabel 2.2/2.3, bahaya, dampak, kontrol EL/SB/EG/AD/PPE |
| `src/data/presenter.ts` | Poin wajib, angka hafal, serah-terima, routing Q&A (dari panduan presenter) |
| `src/data/trajectory.ts` | Mesin trajectory J-type (port dari `app/src/trajectory.js`) |
| `src/data/well.ts` | Geometri: hole section, casing, liner, completion, formasi anonim Fm-A..Fm-G |
| `src/scene/` | Scene R3F: rig, lokasi, BOP/diverter/tree, sumur cutaway, kamera, label |
| `src/ui/` | HUD, panel 2D, backup, presenter, bar navigasi, skema 2D fallback |
| `scripts/check-numbers.mjs` | Verifikasi angka di layar terhadap PPTX |
| `docs/number-check-detail.md` | Angka panel detail terhadap laporan |
| `docs/KEPUTUSAN.md` | Keputusan yang butuh persetujuan PM |
| `docs/number-check.md` | Tabel slide, angka, cocok/tidak |

## Animasi (Tahap 2)

Semua animasi berjalan sendiri dan tidak menahan navigasi:

- Tab Cement: semen naik dari shoe ke atas annulus, lead dan tail berbeda warna.
- Tab Well control: diverter/BOP diturunkan ke wellhead (nipple up).
- Slide 13 langkah 1 dan tab liner: liner 7-in diturunkan ke dasar sumur.
- Slide 13 langkah 4 dan tab Completion: ESP dan tubing di-run dari permukaan sampai 6,025 ft MD.
- Marker window ppg (PPTX Tabel 3.1) di sisi sumur pada slide 6, 8, 10, 12.

## Skala

Kedalaman (MD/TVD dan bagian vertikal) memakai skala sebenarnya; penggaris TVD di kiri sumur memberi tanda pada TVD shoe dan TD dari slide. Diameter lubang dan tubular dibesarkan agar terbaca, dan peralatan permukaan adalah model skematik. Bar bawah menulis "Depth to true scale · diameters exaggerated".

## Arah gaya

Swiss / Minimalism (dari daftar gaya ui-ux-pro-max): grid tegas, warna datar, judul Montserrat ExtraBold huruf besar, satu aksen oranye untuk penekanan dan navy untuk struktur. Dipilih karena paling terbaca dari belakang ruangan lewat proyektor dan sejalan dengan deck NavyOrange v4. Panel Go / No-Go dan Q&A terang; tidak ada slide berisi angka dengan latar navy pekat.

## Fallback

Jika WebGL tidak tersedia, context WebGL hilang, atau scene error, aplikasi otomatis pindah ke tampilan 2D: kartu yang sama ditambah skema sumur SVG dari mesin trajectory yang sama. `?mode=2d` memaksa tampilan 2D.
