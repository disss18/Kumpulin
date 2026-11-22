(() => {
  UI.initPage('beranda');

  const state = {
    source: 'semua',
    query: '',
    course: UI.param('praktikum')
  };

  const saved = {
    type: UI.param('tersimpan'),
    id: UI.param('id')
  };

  const els = {
    greeting: document.getElementById('greeting'),
    summary: document.getElementById('summary'),
    stats: document.getElementById('stats'),
    filter: document.getElementById('source-filter'),
    search: document.getElementById('search'),
    activeFilter: document.getElementById('active-filter'),
    list: document.getElementById('deadline-list'),
    exams: document.getElementById('exam-list')
  };

  function byDate(key) {
    return (a, b) => new Date(a[key]) - new Date(b[key]);
  }

  function isOpen(task) {
    return task.status === 'belum' || task.status === 'revisi';
  }

  function greetingText() {
    const hour = Format.now().getHours();
    if (hour < 11) {
      return 'Selamat pagi';
    }
    if (hour < 15) {
      return 'Selamat siang';
    }
    if (hour < 18) {
      return 'Selamat sore';
    }
    return 'Selamat malam';
  }

  function upcomingExams() {
    return Store.getExams().filter((exam) => Format.daysUntil(exam.at) >= 0).sort(byDate('at'));
  }

  function listItems() {
    const tasks = Store.getTasks().filter(isOpen).map((task) => ({
      kind: 'task',
      id: task.id,
      title: task.title,
      courseId: task.courseId,
      date: task.due,
      status: task.status,
      source: task.source
    }));
    const exams = upcomingExams().filter((exam) => Format.daysUntil(exam.at) <= 7).map((exam) => ({
      kind: 'exam',
      id: exam.id,
      title: exam.title,
      courseId: exam.courseId,
      date: exam.at,
      source: exam.source,
      place: exam.place
    }));
    return tasks.concat(exams).sort(byDate('date'));
  }

  function matches(item) {
    if (state.source !== 'semua' && item.source !== state.source) {
      return false;
    }
    if (state.course && item.courseId !== state.course) {
      return false;
    }
    if (state.query) {
      const info = UI.course(item.courseId);
      const haystack = `${item.title} ${info.name} ${info.short}`.toLowerCase();
      return haystack.includes(state.query);
    }
    return true;
  }

  function hasFilter() {
    return state.source !== 'semua' || Boolean(state.query) || Boolean(state.course);
  }

  function renderHeader() {
    const user = KumpulinData.user;
    els.greeting.textContent = `${greetingText()}, ${user.firstName}`;
    const week = Store.getTasks().filter((task) => isOpen(task) && Format.daysUntil(task.due) <= 7).sort(byDate('due'));
    const exams = upcomingExams().filter((exam) => Format.daysUntil(exam.at) <= 7);
    if (!week.length) {
      els.summary.textContent = 'Tidak ada tenggat dalam 7 hari ke depan. Santai dulu, tapi tetap cek grup ya.';
      return;
    }
    const nearest = week[0];
    const examText = exams.length ? ` dan ${exams.length} ujian` : '';
    els.summary.textContent = `Ada ${week.length} tenggat${examText} dalam 7 hari ke depan. Paling dekat: ${nearest.title}, ${Format.relative(nearest.due).toLowerCase()} pukul ${Format.time(nearest.due)}.`;
  }

  function statCard(card) {
    return `<article class="stat-card">
      <p class="stat-card__label">${Icon.render(card.icon, 18, `tone-${card.tone}`)}${UI.escape(card.label)}</p>
      <p class="stat-card__value">${UI.escape(card.value)}${card.unit ? `<span class="stat-card__unit">${UI.escape(card.unit)}</span>` : ''}</p>
      <p class="stat-card__note">${UI.escape(card.note)}</p>
    </article>`;
  }

  function renderStats() {
    const tasks = Store.getTasks();
    const week = tasks.filter((task) => isOpen(task) && Format.daysUntil(task.due) <= 7).sort(byDate('due'));
    const revisi = tasks.filter((task) => task.status === 'revisi');
    const done = tasks.filter((task) => task.status === 'terkumpul' || task.status === 'dinilai');
    const exam = upcomingExams()[0];
    const examDays = exam ? Format.daysUntil(exam.at) : null;

    const cards = [
      {
        label: 'Tenggat minggu ini',
        icon: 'clock',
        tone: 'warning',
        value: week.length,
        unit: 'tugas',
        note: week.length ? `Terdekat ${Format.relative(week[0].due).toLowerCase()}, ${Format.time(week[0].due)}` : 'Belum ada tenggat'
      },
      {
        label: 'Ujian terdekat',
        icon: 'calendar',
        tone: 'neutral',
        value: exam ? (examDays === 0 ? 'Hari ini' : examDays) : '–',
        unit: exam && examDays > 0 ? 'hari lagi' : '',
        note: exam ? exam.title : 'Belum ada jadwal'
      },
      {
        label: 'Perlu revisi',
        icon: 'edit',
        tone: 'danger',
        value: revisi.length,
        unit: 'tugas',
        note: revisi.length ? revisi[0].title : 'Tidak ada revisi'
      },
      {
        label: 'Sudah terkumpul',
        icon: 'checkCircle',
        tone: 'info',
        value: done.length,
        unit: 'laprak',
        note: `Dari ${tasks.length} laprak semester ini`
      }
    ];
    els.stats.innerHTML = cards.map(statCard).join('');
  }

  function renderActiveFilter() {
    if (!state.course) {
      els.activeFilter.hidden = true;
      els.activeFilter.innerHTML = '';
      return;
    }
    const info = UI.course(state.course);
    els.activeFilter.hidden = false;
    els.activeFilter.innerHTML = `<span class="chip">
      <span class="chip__text">Praktikum: ${UI.escape(info.name)}</span>
      <button class="chip__remove" type="button" aria-label="Hapus filter praktikum ${UI.escape(info.short)}">${Icon.render('x', 14)}</button>
    </span>`;
    els.activeFilter.querySelector('.chip__remove').addEventListener('click', () => {
      state.course = null;
      window.history.replaceState(null, '', 'index.html');
      UI.renderSidebar('beranda');
      renderActiveFilter();
      renderList();
      els.search.focus();
    });
  }

  function emptyState() {
    if (hasFilter()) {
      return `<li class="empty-state">
        ${Icon.render('search', 32)}
        <strong>Tidak ada tenggat yang cocok</strong>
        <span class="text-small">Coba ganti filter sumber atau kata kunci pencarian.</span>
        <button class="btn btn--secondary btn--small" type="button" data-action="reset-filter">Hapus semua filter</button>
      </li>`;
    }
    return `<li class="empty-state">
      ${Icon.render('checkCircle', 32)}
      <strong>Semua laprak sudah beres</strong>
      <span class="text-small">Belum ada tenggat baru. Kalau asprak kirim info di grup, simpan lewat Simpan Info.</span>
      <a class="btn btn--secondary btn--small" href="simpan-info.html">Simpan info baru</a>
    </li>`;
  }

  function renderList() {
    const items = listItems().filter(matches);
    if (!items.length) {
      els.list.innerHTML = emptyState();
      return;
    }
    els.list.innerHTML = items.map((item) => `<li>${UI.deadlineCard(item, { isNew: item.id === saved.id })}</li>`).join('');
  }

  function renderExams() {
    const exams = upcomingExams();
    if (!exams.length) {
      els.exams.innerHTML = '<li class="text-small text-secondary">Belum ada jadwal ujian.</li>';
      return;
    }
    els.exams.innerHTML = exams.map((exam) => `<li class="list-row${exam.id === saved.id ? ' is-new' : ''}">
      ${UI.dateBlock(exam.at, 'exam small')}
      <span class="list-row__text">
        <span class="list-row__title">${UI.escape(exam.title)}</span>
        <span class="inline-meta">${Icon.render('clock', 14)}${Format.dateTime(exam.at)} WIB · ${UI.escape(Format.relative(exam.at))}</span>
        ${exam.place ? `<span class="inline-meta">${Icon.render('mapPin', 14)}${UI.escape(exam.place)}</span>` : ''}
        ${exam.note ? `<span class="inline-meta">${Icon.render('info', 14)}${UI.escape(exam.note)}</span>` : ''}
      </span>
    </li>`).join('');
  }

  function setSource(source) {
    state.source = source;
    els.filter.querySelectorAll('[data-source]').forEach((button) => {
      const selected = button.dataset.source === source;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderList();
  }

  function resetFilters() {
    state.query = '';
    els.search.value = '';
    if (state.course) {
      state.course = null;
      window.history.replaceState(null, '', 'index.html');
      UI.renderSidebar('beranda');
      renderActiveFilter();
    }
    setSource('semua');
    els.search.focus();
  }

  function announceSaved() {
    if (!saved.type) {
      return;
    }
    const messages = {
      tenggat: 'Tenggat baru tersimpan dan sudah masuk daftar.',
      aturan: 'Aturan baru sudah ditambahkan ke laprak.',
      ujian: 'Jadwal ujian tersimpan.'
    };
    const task = saved.type !== 'ujian' && saved.id ? Store.getTask(saved.id) : null;
    const options = task ? {
      actionLabel: 'Lihat detail',
      onAction: () => {
        window.location.href = `detail-laprak.html?id=${encodeURIComponent(task.id)}`;
      }
    } : {};
    UI.toast(messages[saved.type] || 'Info tersimpan.', options);
    window.history.replaceState(null, '', state.course ? `index.html?praktikum=${encodeURIComponent(state.course)}` : 'index.html');
  }

  els.filter.addEventListener('click', (event) => {
    const button = event.target.closest('[data-source]');
    if (button) {
      setSource(button.dataset.source);
    }
  });

  els.search.addEventListener('input', () => {
    state.query = els.search.value.trim().toLowerCase();
    renderList();
  });

  els.list.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="reset-filter"]')) {
      resetFilters();
    }
  });

  renderHeader();
  renderStats();
  renderActiveFilter();
  renderList();
  renderExams();
  announceSaved();
})();
