(() => {
  UI.initPage('beranda');

  const requestedCourse = UI.param('praktikum');

  const state = {
    source: 'semua',
    query: '',
    course: KumpulinData.courses.some((item) => item.id === requestedCourse) ? requestedCourse : null
  };

  const saved = {
    type: UI.param('tersimpan'),
    id: UI.param('id')
  };

  const els = {
    greeting: document.getElementById('greeting'),
    summary: document.getElementById('summary'),
    saveLink: document.getElementById('save-link'),
    groupLink: document.getElementById('group-link'),
    stats: document.getElementById('stats'),
    filter: document.getElementById('source-filter'),
    search: document.getElementById('search'),
    deadlineHeading: document.getElementById('deadline-heading'),
    examHeading: document.getElementById('exam-heading'),
    list: document.getElementById('deadline-list'),
    exams: document.getElementById('exam-list')
  };

  function byDate(key) {
    return (a, b) => new Date(a[key]) - new Date(b[key]);
  }

  function isOpen(task) {
    return task.status === 'belum' || task.status === 'revisi';
  }

  function currentCourse() {
    return state.course ? UI.course(state.course) : null;
  }

  function inScope(item) {
    return !state.course || item.courseId === state.course;
  }

  function scopedTasks() {
    return Store.getTasks().filter(inScope);
  }

  function scopedExams() {
    return Store.getExams()
      .filter((exam) => inScope(exam) && Format.daysUntil(exam.at) >= 0)
      .sort(byDate('at'));
  }

  function pageHref() {
    return UI.pageUrl('index', { praktikum: state.course });
  }

  function saveHref() {
    return UI.pageUrl('simpan-info', { praktikum: state.course });
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

  function renderHeader() {
    const course = currentCourse();
    const label = course ? ` ${course.short}` : '';
    const week = scopedTasks().filter((task) => isOpen(task) && Format.daysUntil(task.due) <= 7).sort(byDate('due'));
    const exams = scopedExams().filter((exam) => Format.daysUntil(exam.at) <= 7);

    document.title = course ? `${course.short} · Beranda · Kumpulin` : 'Beranda · Kumpulin';
    els.greeting.textContent = `${greetingText()}, ${KumpulinData.user.firstName}`;
    els.deadlineHeading.textContent = course ? `Tenggat ${course.short} terdekat` : 'Tenggat terdekat';
    els.examHeading.textContent = course ? `Jadwal ujian ${course.short}` : 'Jadwal ujian';
    els.saveLink.href = saveHref();
    els.groupLink.href = saveHref();

    if (!week.length) {
      els.summary.textContent = `Tidak ada tenggat${label} dalam 7 hari ke depan. Santai dulu, tapi tetap cek grup ya.`;
      return;
    }
    const nearest = week[0];
    const examText = exams.length ? ` dan ${exams.length} ujian` : '';
    els.summary.textContent = `Ada ${week.length} tenggat${label}${examText} dalam 7 hari ke depan. Paling dekat: ${nearest.title}, ${Format.relative(nearest.due).toLowerCase()} pukul ${Format.time(nearest.due)}.`;
  }

  function statCard(card) {
    return `<article class="stat-card">
      <p class="stat-card__label">${Icon.render(card.icon, 18, `tone-${card.tone}`)}${UI.escape(card.label)}</p>
      <p class="stat-card__value">${UI.escape(card.value)}${card.unit ? `<span class="stat-card__unit">${UI.escape(card.unit)}</span>` : ''}</p>
      <p class="stat-card__note">${UI.escape(card.note)}</p>
    </article>`;
  }

  function renderStats() {
    const course = currentCourse();
    const tasks = scopedTasks();
    const week = tasks.filter((task) => isOpen(task) && Format.daysUntil(task.due) <= 7).sort(byDate('due'));
    const revisi = tasks.filter((task) => task.status === 'revisi');
    const done = tasks.filter((task) => task.status === 'terkumpul' || task.status === 'dinilai');
    const exam = scopedExams()[0];
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
        note: course ? `Dari ${tasks.length} laprak ${course.short}` : `Dari ${tasks.length} laprak semester ini`
      }
    ];
    els.stats.setAttribute('aria-label', course ? `Ringkasan praktikum ${course.short}` : 'Ringkasan minggu ini');
    els.stats.innerHTML = cards.map(statCard).join('');
  }

  function listItems() {
    const tasks = scopedTasks().filter(isOpen).map((task) => ({
      kind: 'task',
      id: task.id,
      title: task.title,
      courseId: task.courseId,
      date: task.due,
      status: task.status,
      source: task.source
    }));
    const exams = scopedExams().filter((exam) => Format.daysUntil(exam.at) <= 7).map((exam) => ({
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
    if (state.query) {
      const info = UI.course(item.courseId);
      const haystack = `${item.title} ${info.name} ${info.short}`.toLowerCase();
      return haystack.includes(state.query);
    }
    return true;
  }

  function hasFilter() {
    return state.source !== 'semua' || Boolean(state.query);
  }

  function emptyState() {
    const course = currentCourse();
    if (hasFilter()) {
      return `<li class="empty-state">
        ${Icon.render('search', 32)}
        <strong>Tidak ada tenggat yang cocok</strong>
        <span class="text-small">Coba ganti filter sumber atau kata kunci pencarian.</span>
        <button class="btn btn--secondary btn--small" type="button" data-action="reset-filter">Hapus filter</button>
      </li>`;
    }
    return `<li class="empty-state">
      ${Icon.render('checkCircle', 32)}
      <strong>${course ? `Semua laprak ${UI.escape(course.short)} sudah beres` : 'Semua laprak sudah beres'}</strong>
      <span class="text-small">Belum ada tenggat baru. Kalau asprak kirim info di grup, simpan lewat Simpan Info.</span>
      <a class="btn btn--secondary btn--small" href="${saveHref()}">Simpan info baru</a>
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
    const course = currentCourse();
    const exams = scopedExams();
    if (!exams.length) {
      els.exams.innerHTML = `<li class="text-small text-secondary">${course ? `Belum ada jadwal ujian ${UI.escape(course.short)}.` : 'Belum ada jadwal ujian.'}</li>`;
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
        window.location.href = UI.pageUrl('detail-laprak', { id: task.id });
      }
    } : {};
    UI.toast(messages[saved.type] || 'Info tersimpan.', options);
    window.history.replaceState(null, '', pageHref());
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
  renderList();
  renderExams();
  announceSaved();
})();
