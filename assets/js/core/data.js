const KumpulinData = {
  simulatedNow: '2026-11-02T09:00:00',

  user: {
    name: 'Raka Pratama',
    firstName: 'Raka',
    initial: 'R',
    program: 'Informatika',
    semester: 3,
    nim: '255150201111042',
    email: 'raka.pratama@student.ub.ac.id'
  },

  platforms: {
    eling: { label: 'eLing', shortLabel: 'eLing', icon: 'book', url: 'https://eling.ub.ac.id' },
    classroom: { label: 'Google Classroom', shortLabel: 'Classroom', icon: 'cap', url: 'https://classroom.google.com' },
    grup: { label: 'Grup WhatsApp', shortLabel: 'Grup WA', icon: 'message', url: '' }
  },

  courses: [
    { id: 'asd', name: 'Algoritma dan Struktur Data', short: 'ASD', platform: 'eling', url: 'https://eling.ub.ac.id/course/view.php?id=2741', keywords: ['asd', 'struktur data', 'algoritma'] },
    { id: 'aps', name: 'Analisis dan Perancangan Sistem', short: 'APS', platform: 'classroom', url: 'https://classroom.google.com/c/NzE0MjU1ODYzMTk1', keywords: ['aps', 'analisis dan perancangan', 'perancangan sistem'] },
    { id: 'jarkom', name: 'Jaringan Komputer', short: 'Jarkom', platform: 'eling', url: 'https://eling.ub.ac.id/course/view.php?id=2756', keywords: ['jarkom', 'jaringan komputer'] },
    { id: 'basdat', name: 'Basis Data', short: 'Basdat', platform: 'classroom', url: 'https://classroom.google.com/c/NzE2MDQ4OTI3MzEy', keywords: ['basdat', 'basis data'] },
    { id: 'sisop', name: 'Sistem Operasi', short: 'Sisop', platform: 'eling', url: 'https://eling.ub.ac.id/course/view.php?id=2762', keywords: ['sisop', 'sistem operasi'] },
    { id: 'pemweb', name: 'Pemrograman Web', short: 'Pemweb', platform: 'classroom', url: 'https://classroom.google.com/c/NzE3NTIxMzA0ODk2', keywords: ['pemweb', 'pemrograman web'] }
  ],

  tasks: [
    {
      id: 'asd-m5',
      courseId: 'asd',
      title: 'Laprak Modul 5: Linked List',
      platform: 'eling',
      source: 'eling',
      due: '2026-11-03T23:59:00',
      url: 'https://eling.ub.ac.id/mod/assign/view.php?id=48215',
      status: 'belum',
      fileName: 'ASD_M5_{nim}_{firstName}.pdf',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF, maksimal 5 MB' },
        { kind: 'name', label: 'Nama file', value: 'ASD_M5_NIM_Nama.pdf' },
        { kind: 'content', label: 'Isi laporan', value: 'Kode program, screenshot output, dan analisis tiap soal' },
        { kind: 'late', label: 'Keterlambatan', value: 'Tidak diterima setelah tenggat', important: true }
      ],
      checklist: [
        'File sudah dalam format PDF dan di bawah 5 MB',
        'Nama file sesuai: {file}',
        'Screenshot output tiap soal sudah lengkap',
        'Analisis tiap soal sudah ditulis'
      ]
    },
    {
      id: 'aps-m5',
      courseId: 'aps',
      title: 'LK Modul 5: Activity Diagram',
      platform: 'classroom',
      source: 'grup',
      due: '2026-11-04T23:59:00',
      url: 'https://classroom.google.com/c/NzE0MjU1ODYzMTk1/a/NzI0MzE2NTgxMjA0/details',
      status: 'belum',
      fileName: 'APS_M5_{nim}_{firstName}.pdf',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF, satu file untuk semua soal' },
        { kind: 'name', label: 'Nama file', value: 'APS_M5_NIM_Nama.pdf' },
        { kind: 'diagram', label: 'Activity Diagram', value: 'Wajib dibuat dengan draw.io, tulisan tangan tidak dinilai', important: true },
        { kind: 'submit', label: 'Tempat pengumpulan', value: 'Google Classroom, bukan lewat chat grup' }
      ],
      checklist: [
        'File sudah dalam format PDF',
        'Nama file sesuai: {file}',
        'Activity Diagram dibuat dengan draw.io',
        'Semua soal LK sudah dijawab'
      ],
      sourceNote: {
        author: 'Asprak APS – Dimas',
        sentAt: '30/10 19.42',
        text: 'Info LK Modul 5 ya teman-teman. Dikumpulkan di Classroom paling lambat Rabu, 4 November pukul 23.59. Format PDF, nama file APS_M5_NIM_Nama. Activity Diagram wajib pakai draw.io, yang tulisan tangan tidak dinilai.'
      }
    },
    {
      id: 'jarkom-m4',
      courseId: 'jarkom',
      title: 'Laprak Modul 4: OSPF',
      platform: 'eling',
      source: 'eling',
      due: '2026-11-06T23:59:00',
      url: 'https://eling.ub.ac.id/mod/assign/view.php?id=48327',
      status: 'belum',
      fileName: 'JARKOM_M4_{nim}_{firstName}.pdf',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF untuk laporan' },
        { kind: 'name', label: 'Nama file', value: 'JARKOM_M4_NIM_Nama.pdf' },
        { kind: 'content', label: 'Isi laporan', value: 'Topologi, konfigurasi tiap router, dan hasil ping antar-jaringan' },
        { kind: 'attachment', label: 'Lampiran', value: 'File .pkt dikumpulkan dalam ZIP terpisah' }
      ],
      checklist: [
        'Laporan sudah dalam format PDF',
        'Nama file sesuai: {file}',
        'Hasil ping antar-jaringan sudah ada',
        'File .pkt sudah di-ZIP terpisah'
      ]
    },
    {
      id: 'aps-m4',
      courseId: 'aps',
      title: 'LK Modul 4: Use Case Diagram',
      platform: 'classroom',
      source: 'classroom',
      due: '2026-11-05T12:00:00',
      url: 'https://classroom.google.com/c/NzE0MjU1ODYzMTk1/a/NzE5ODg0MjA2NTQx/details',
      status: 'revisi',
      submittedAt: '2026-10-27T21:10:00',
      fileName: 'APS_M4_{nim}_{firstName}_Revisi.pdf',
      comment: 'Relasi include dan extend masih tertukar di use case Bayar. Perbaiki lalu kumpulkan ulang sebelum Kamis pukul 12.00.',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF' },
        { kind: 'name', label: 'Nama file', value: 'APS_M4_NIM_Nama_Revisi.pdf' },
        { kind: 'note', label: 'Catatan revisi', value: 'Perbaiki relasi include dan extend', important: true }
      ],
      checklist: [
        'Relasi include dan extend sudah diperbaiki',
        'Nama file sesuai: {file}',
        'File sudah dalam format PDF'
      ]
    },
    {
      id: 'jarkom-m3',
      courseId: 'jarkom',
      title: 'Laprak Modul 3: Static Routing',
      platform: 'eling',
      source: 'eling',
      due: '2026-10-30T23:59:00',
      url: 'https://eling.ub.ac.id/mod/assign/view.php?id=47902',
      status: 'terkumpul',
      submittedAt: '2026-10-29T20:15:00',
      fileName: 'JARKOM_M3_{nim}_{firstName}.pdf',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF' },
        { kind: 'content', label: 'Isi laporan', value: 'Tabel routing dan hasil traceroute' }
      ],
      checklist: [
        'Laporan sudah dalam format PDF',
        'Nama file sesuai: {file}',
        'Tabel routing sudah lengkap'
      ]
    },
    {
      id: 'asd-m4',
      courseId: 'asd',
      title: 'Laprak Modul 4: Stack & Queue',
      platform: 'eling',
      source: 'eling',
      due: '2026-10-27T23:59:00',
      url: 'https://eling.ub.ac.id/mod/assign/view.php?id=47766',
      status: 'dinilai',
      submittedAt: '2026-10-26T19:02:00',
      score: 88,
      comment: 'Analisis kompleksitas sudah tepat. Tambahkan contoh kasus antrean kosong di soal 3.',
      fileName: 'ASD_M4_{nim}_{firstName}.pdf',
      rules: [
        { kind: 'format', label: 'Format file', value: 'PDF, maksimal 5 MB' },
        { kind: 'content', label: 'Isi laporan', value: 'Kode program dan analisis kompleksitas' }
      ],
      checklist: [
        'File sudah dalam format PDF',
        'Nama file sesuai: {file}',
        'Analisis kompleksitas sudah ditulis'
      ]
    }
  ],

  exams: [
    {
      id: 'utp-jarkom',
      courseId: 'jarkom',
      title: 'UTP Praktikum Jarkom',
      at: '2026-11-05T08:00:00',
      place: 'Lab Jaringan, Gedung F',
      source: 'grup',
      note: 'Bawa kartu praktikum'
    },
    {
      id: 'uap-asd',
      courseId: 'asd',
      title: 'UAP Praktikum ASD',
      at: '2026-12-07T13:00:00',
      place: 'Lab Komputer 2, Gedung G',
      source: 'eling',
      note: ''
    }
  ]
};
