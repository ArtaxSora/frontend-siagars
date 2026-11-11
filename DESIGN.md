# SiagaRS: pencarian yang jelas

Perbaikan UI/UX atas permintaan pengguna, November 2026.

## Batas desain

- Semua token warna pada `app/globals.css` dipertahankan persis. Teal adalah identitas yang dikunci pengguna; warna status dan simulasi tetap memiliki makna yang sama.
- Plus Jakarta Sans tetap digunakan agar identitas konsisten. Hierarki dibedakan melalui ukuran, bobot, dan jarak.
- Fokus halaman publik adalah mencari, memilih, dan membandingkan rumah sakit. Informasi pendukung ditempatkan di footer.
- ENERGY 2 / RHYTHM 2 / MOTION 1. Transisi singkat hanya untuk panel asisten dan respons kontrol; hormati reduced motion.

## Komposisi

Beranda menggunakan pembuka tanpa kotak, bersebelahan dengan formulir pencarian. Garis pemisah dan deretan layanan menghubungkan pengguna dengan langkah lokasi, bukan grid fitur pemasaran. Informasi kepercayaan dibaca setelah pencarian.

Ruang besar memisahkan pekerjaan berbeda; label dan input tetap rapat. Bayangan hanya menandai permukaan yang mengambang (menu dan asisten). Kartu hasil berisi data satu rumah sakit dan mengutamakan detail; layanan tambahan dapat dibuka sesuai kebutuhan.

## Navigasi

- Utama: Cari RS, Pilih RS, Bandingkan, Wawasan.
- Footer: Tentang data, Cek BPJS (simulasi), Koreksi data, Status sistem, serta tautan kecil Masuk operator.
- Lacak rujukan dihapus dari alur publik; URL lamanya mengarah ke Cari RS. Fungsionalitas operator tidak berubah.
- Asisten terbuka pada panel kanan tanpa mengganti URL; di ponsel memakai lebar penuh. Escape dan tombol tutup mengembalikan fokus, percakapan bertahan selama sesi halaman. Navigasi ke hasil menutup panel.

## Kejujuran informasi

Sumber, label simulasi dan garis putus-putus amber, kualitas data, unknown, dan peringatan darurat tetap dipertahankan. Tidak ada statistik, testimoni, atau klaim ketersediaan yang dibuat untuk menghias desain.
