# Kumpulin

Portal terpusat untuk peserta praktikum: lihat tenggat, simpan info dari grup asprak, cek berkas, lalu diarahkan ke tempat pengumpulan (eLing atau Google Classroom).

Ini prototipe UI fungsional. Belum ada backend atau database. Data contoh ada di `assets/js/core/data.js`, dan perubahan (status, info baru, centang daftar cek, pengingat) disimpan di `localStorage` browser.

Seluruh project hanya berisi HTML, CSS, dan JavaScript. Tidak perlu Node.js, npm, atau install apa pun.

## Cara menjalankan

Buka `index.html` langsung di browser (Chrome, Edge, Firefox, atau Safari): klik dua kali file-nya, atau dari terminal jalankan `start index.html`.

Kalau sedang mengedit kode di VS Code, bisa juga pakai extension Live Server: klik kanan `index.html`, pilih Open with Live Server. Halaman otomatis ter-refresh setiap file disimpan.

Kalau Node.js sudah terpasang, bisa juga jalankan `npx serve .` dari folder ini lalu buka `http://localhost:3000`.

Data antarhalaman (id laprak, praktikum yang dipilih, notifikasi setelah menyimpan) dikirim lewat bagian `#` di alamat, misalnya `index.html#praktikum=aps`. Bagian ini tidak ikut terbuang ketika server seperti `npx serve` mengalihkan `index.html` ke `/`, jadi alurnya sama di semua cara menjalankan di atas.

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

## Alur yang bisa dicoba

1. Beranda: filter sumber (eLing, Classroom, Grup WA), cari tugas, atau klik praktikum di sidebar. Beranda tetap sama, tapi ringkasan, statistik, tenggat, dan jadwal ujian hanya untuk praktikum itu. Klik menu Beranda untuk kembali ke semua praktikum.
2. Simpan Info: klik "Isi contoh pesan" (bisa diklik berulang untuk contoh tenggat, aturan, dan ujian), lalu "Simpan info".
3. Buka salah satu tenggat, salin nama file, lalu "Cek & Kumpulkan".
4. Kumpulkan tanpa mencentang semua untuk melihat dialog peringatan.
5. Status Laprak: batalkan tanda terkumpul, lihat komentar revisi, lihat nilai, nyalakan atau matikan pengingat.
6. "Atur ulang data demo" di halaman Status mengembalikan semua data ke awal.

## Catatan

- Tanggal "hari ini" disimulasikan ke `simulatedNow` di `data.js` (2 November 2026, 09.00) supaya data contoh selalu masuk akal. Ganti nilainya kalau perlu.
- Setiap laprak di `data.js` punya `url`: link langsung ke halaman tugasnya di Classroom atau eLing. Tombol Kumpulkan dan "Buka tugas" membuka link ini di tab baru. Link contoh di data demo tidak benar-benar ada, jadi ganti dengan link tugas asli.
- Laprak baru dari Simpan Info bisa diberi link lewat isian "Link pengumpulan". Kalau pesan asprak berisi link, link itu terisi otomatis. Kalau link kosong, tombol Kumpulkan membuka halaman utama platformnya.
- Alamat halaman utama eLing dan Google Classroom ada di bagian `platforms` pada `data.js`.
- Kalau halaman Detail atau Cek dibuka tanpa `#id=` atau dengan id yang tidak ada, yang ditampilkan adalah laprak dengan tenggat terdekat.
