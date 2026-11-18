# Keputusan yang butuh persetujuan Project Manager (Tahap 1)

| # | Hal | Yang dibuat sekarang | Pilihan lain |
|---|---|---|---|
| 1 | Enter di slide multi-pembicara (6, 8, 10, 13, 14) | Enter berpindah ke pembicara berikutnya dulu (blok aktif disorot oranye, timer role ikut pindah), baru ke slide berikutnya. Tombol S mematikannya | Enter selalu langsung ke slide berikutnya (timer role diatur manual) |
| 2 | Nama formasi "Tuban" | Kartu HUD memakai teks PPTX apa adanya ("Tuban carbonate", "Top of Tuban", slide 2, 10, 12). Scene 3D memakai Fm-A..Fm-G | Ganti "Tuban" di HUD menjadi nama anonim (berbeda dari PPTX) |
| 3 | Logo di PPTX (cover dan tiap slide) | Tidak ditampilkan, mengikuti aturan tanpa nama operator/kontraktor/vendor | Tampilkan logo seperti PPTX |
| 4 | Kedalaman ESP di scene | Mengikuti PPTX: intake 6,013 ft, EOT 6,025 ft MD. Data repo lama (8,750-8,840 ft) tidak dipakai | - |
| 5 | Nilai repo yang dipakai hanya untuk menggambar (tanpa angka di layar) | Liner top 9,108 ft MD (label "Liner top (TOL)" tanpa angka), shoe conductor 120 ft, interval perforasi 9,330-9,570 ft MD, build rate 2°/100 ft, top formasi | Hapus elemen ini atau beri "[perlu data]" |
| 6 | Skala | Kedalaman skala sebenarnya; diameter dibesarkan; peralatan permukaan skematik. Indikator: penggaris TVD (tanda di 1,956 / 4,564 / 8,261 / 8,561 ft TVD) dan teks di bar bawah. Faktor pembesaran tidak ditulis agar tidak menambah angka | Tulis faktor pembesaran di layar |
| 7 | Gambaran "seperti pelaksanaan nyata" | Slide 6, 8, 10, 12 menampilkan section sedang dibor: drill string + BHA di dasar section, lumpur di lubang, casing section itu tampil transparan sebagai rencana. Kru, crane bongkar muat, truk, mud system, genset, kabin di lokasi. Workover rig muncul mulai langkah 2 slide 13 | Tampilkan casing section sudah terpasang (kondisi akhir) |
| 8 | Footer cover dan Q&A | Hanya nama role, tanpa nomor halaman (PPTX juga tanpa nomor) | Tambahkan nomor |
| 9 | Strip bawah Go / No-Go | Panel terang (biru pucat), bukan navy seperti PPTX, sesuai aturan panel terang | Navy seperti PPTX |
| 10 | Timer | Mulai otomatis pada Enter pertama. Q&A punya timer 10 menit terpisah, tidak masuk 5 menit PM. Slide backup dihitung ke role pembicaranya (Logistic / Drilling) | Timer manual saja (T) |
| 11 | Mode presenter | P membuka panel di layar yang sama (penonton ikut melihat bila layar di-mirror). Untuk layar extended, pakai "Buka di jendela kedua" | - |
| 12 | Link baru | GitHub Pages di path baru `/dwop/` (aktif setelah merge ke `main`); situs lama di root tidak diubah | Repo/branch Pages terpisah |
| 13 | Slide 5 risk matrix | Posisi lingkaran dibaca dari gambar slide: L2-S4 = 10, L2-S5 = 3, L1-S4 = 5 | - |
| 14 | Fallback 2D | Slide 1, 3, 5 memakai foto rig dari cover PPTX; slide sumur memakai skema SVG | - |

## Detail HSE (tombol D) dan QR

| # | Hal | Yang dibuat |
|---|---|---|
| 15 | Skor sebelum/sesudah kontrol dan otoritas | Mengikuti laporan (Tabel 2.2 dan 2.3) dan PPTX slide 5: residual 5 / 10 / 3 |
| 16 | Bahaya, dampak, dan tindakan kontrol EL/SB/EG/AD/PPE | Dari RA/JSA program (RA-ALPHA05-DRL-001 yang dirujuk Bab 2.2.2). Sumber yang ditampilkan: laporan Bab 2 |
| 17 | Angka yang tidak ada di laporan | Kontrol AD langkah 12 menyebut uji BOP 300 psi low / sampai 4,500 psi high / annular 70 %. Angka ini hanya ada di RA/JSA. Perlu keputusan: tetap atau dihapus |
| 18 | QR code | Mengarah ke halaman ponsel `PUBLIC_BASE?view=detail&topic=hse[&step=n]` (alamat GitHub Pages /dwop/). Baru bisa dibuka setelah branch di-merge dan Pages aktif |
| 19 | Nama perusahaan dan logo di RA/JSA | Tidak ditampilkan |

## Belum diverifikasi

- 60 fps di laptop presentasi sebenarnya. Uji di sini memakai renderer perangkat lunak (tanpa GPU); scene memakai render on-demand (hanya menggambar saat kamera bergerak), instancing, dan tanpa texture besar. Mohon dicoba di laptop dan proyektor yang akan dipakai.
- Gladi penuh 20 menit oleh enam role.

## Tahap 2 (menunggu persetujuan)

Animasi diverter/BOP, cementing, liner, ESP, dan marker window ppg per section.
