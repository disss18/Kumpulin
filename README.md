# Kumpulin

satu pintu informasi praktikum bagi mahasiswa yang menggabungkan tugas laporan praktikum (laprak) dari eLing dan Google Classroom dengan pengumuman asisten praktikum di grup WhatsApp (aturan laprak serta jadwal UTP/UAP), berbasis web responsif.

## Cara menjalankan

Buka `index.html` langsung di browser (Chrome, Edge, Firefox, atau Safari): klik dua kali file-nya, atau dari terminal jalankan `start index.html`.

Kalau sedang mengedit kode di VS Code, bisa juga pakai extension Live Server: klik kanan `index.html`, pilih Open with Live Server. Halaman otomatis ter-refresh setiap file disimpan.

## Struktur folder

```
kumpulin-web/
├── index.html              Beranda: ringkasan, tenggat terdekat, jadwal ujian
├── simpan-info.html        Tempel pesan grup, dibaca otomatis jadi tenggat/aturan/ujian
├── detail-laprak.html      Aturan, nama file, dan pengingat satu laprak
├── cek-kumpulkan.html      Daftar cek sebelum diarahkan ke platform
├── status.html             Status semua laprak dan pengaturan pengingat
└── assets/
    ├── css/
    │   ├── tokens.css      Warna, tipografi, spasi, radius, bayangan
    │   ├── base.css        Reset dan gaya dasar elemen
    │   ├── layout.css      Sidebar, grid halaman, responsif
    │   ├── components.css  Tombol, badge, kartu, form, tabel, toast, dialog
    │   └── pages.css       Gaya khusus tiap halaman
    └── js/
        ├── core/
        │   ├── data.js     Data contoh (mahasiswa, praktikum, laprak, ujian)
        │   ├── store.js    Simpan dan baca state di localStorage
        │   ├── format.js   Format tanggal, jam, nama file, pengingat
        │   ├── icons.js    Ikon SVG
        │   ├── parser.js   Pembaca pesan grup asprak
        │   └── ui.js       Sidebar, badge, toast, dialog konfirmasi
        └── pages/
            ├── beranda.js
            ├── simpan-info.js
            ├── detail-laprak.js
            ├── cek-kumpulkan.js
            └── status.js
```
