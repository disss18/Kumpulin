(() => {
  UI.initPage('status');

  const FILTERS = [
    { id: 'semua', label: 'Semua' },
    { id: 'belum', label: 'Belum' },
    { id: 'terkumpul', label: 'Terkumpul' },
    { id: 'dinilai', label: 'Dinilai' },
    { id: 'revisi', label: 'Revisi' }
  ];

  const ORDER = { belum: 0, revisi: 1, terkumpul: 2, dinilai: 3 };

  const SETTINGS = [
    { key: 'deadline', title: 'Pengingat tenggat', description: 'H-1 pukul 19.00 dan 3 jam sebelum tenggat' },
    { key: 'exam', title: 'Pengingat ujian', description: 'H-1 pukul 19.00 sebelum ujian dimulai' },
    { key: 'email', title: 'Kirim juga ke email', description: KumpulinData.user.email }
  ];

  const requested = UI.param('status');
  const state = {
    filter: FILTERS.some((item) => item.id === requested) ? requested : 'semua',
    highlight: UI.param('terkumpul')
  };

  const els = {
    filter: document.getElementById('status-filter'),
    body: document.getElementById('status-body'),
    settings: document.getElementById('reminder-settings'),
    next: document.getElementById('next-reminders'),
    reset: document.getElementById('reset-demo')
  };

  function sortTasks(tasks) {
    return tasks.sort((a, b) => {
      const rank = ORDER[a.status] - ORDER[b.status];
      if (rank !== 0) {
        return rank;
      }
      const open = a.status === 'belum' || a.status === 'revisi';
      return open ? new Date(a.due) - new Date(b.due) : new Date(b.due) - new Date(a.due);
    });
  }

  function renderFilter() {
    const tasks = Store.getTasks();
    els.filter.innerHTML = FILTERS.map((item) => {
      const count = item.id === 'semua' ? tasks.length : tasks.filter((task) => task.status === item.id).length;
      const selected = item.id === state.filter;
      return `<button class="segmented__option${selected ? ' is-selected' : ''}" type="button" data-filter="${item.id}" aria-pressed="${selected}">
        ${Icon.render('check', 16)}
        ${item.label}
        <span class="segmented__count">${count}</span>
      </button>`;
    }).join('');
  }

  function actionButton(task) {
    const id = UI.escape(task.id);
    if (task.status === 'terkumpul') {
      return `<button class="btn btn--secondary btn--small" type="button" data-action="undo" data-id="${id}">${Icon.render('undo', 16)}Batalkan tanda</button>`;
    }
    if (task.status === 'revisi') {
      return `<button class="btn btn--secondary btn--small" type="button" data-action="comment" data-id="${id}">${Icon.render('message', 16)}Lihat komentar</button>`;
    }
    if (task.status === 'dinilai') {
      return `<button class="btn btn--secondary btn--small" type="button" data-action="score" data-id="${id}">${Icon.render('award', 16)}Lihat nilai</button>`;
    }
    return `<a class="btn btn--secondary btn--small" href="${UI.pageUrl('detail-laprak', { id: task.id })}">Buka detail${Icon.render('chevronRight', 16)}</a>`;
  }

  function renderTable() {
    const tasks = sortTasks(Store.getTasks()).filter((task) => state.filter === 'semua' || task.status === state.filter);
    if (!tasks.length) {
      els.body.innerHTML = `<tr><td colspan="4"><div class="empty-state">${Icon.render('checkCircle', 28)}<strong>Tidak ada laprak di status ini</strong><span class="text-small">Pilih filter lain untuk melihat laprak lainnya.</span></div></td></tr>`;
      return;
    }
    els.body.innerHTML = tasks.map((task) => {
      const course = UI.course(task.courseId);
      return `<tr data-id="${UI.escape(task.id)}"${task.id === state.highlight ? ' class="is-highlighted"' : ''}>
        <td data-label="Laprak">
          <a class="status-table__title" href="${UI.pageUrl('detail-laprak', { id: task.id })}">${UI.escape(task.title)}</a>
          <span class="text-caption text-secondary">${UI.escape(course.name)}</span>
        </td>
        <td data-label="Tenggat">
          <span class="cell-stack">
            <span class="status-table__date">${Format.shortDate(task.due)}</span>
            <span class="text-caption text-secondary">${Format.time(task.due)} WIB</span>
          </span>
        </td>
        <td data-label="Status">${UI.statusBadge(task.status)}</td>
        <td data-label="Aksi">${actionButton(task)}</td>
      </tr>`;
    }).join('');
  }

  function render() {
    renderFilter();
    renderTable();
    renderNext();
  }

  function focusRow(id) {
    const link = els.body.querySelector(`tr[data-id="${id}"] .status-table__title`);
    if (link) {
      link.focus();
      return;
    }
    const selected = els.filter.querySelector('.is-selected');
    if (selected) {
      selected.focus();
    }
  }

  function setStatus(id, patch) {
    Store.updateTask(id, patch);
    render();
  }

  function undoSubmission(task) {
    const previous = task.previousStatus && task.previousStatus !== 'terkumpul' ? task.previousStatus : 'belum';
    UI.confirm({
      title: `Batalkan tanda terkumpul untuk ${task.title}?`,
      bodyHtml: `<p>Laprak akan kembali berstatus <strong>${UI.statusLabel(previous)}</strong> dan muncul lagi di daftar tenggat Beranda.</p><p>File yang sudah kamu unggah di ${UI.escape(UI.platform(task.platform).label)} tidak ikut terhapus.</p>`,
      confirmLabel: 'Ya, batalkan tanda',
      cancelLabel: 'Batal',
      tone: 'danger',
      hint: 'Esc untuk batal'
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setStatus(task.id, { status: previous, previousStatus: 'terkumpul', submittedAt: null });
      focusRow(task.id);
      UI.toast('Tanda terkumpul dibatalkan.', {
        actionLabel: 'Urungkan',
        icon: 'undo',
        onAction: () => {
          setStatus(task.id, { status: 'terkumpul', previousStatus: previous, submittedAt: task.submittedAt || Format.toIso(Format.now()) });
          focusRow(task.id);
          UI.toast('Laprak kembali ditandai terkumpul.');
        }
      });
    });
  }

  function showComment(task) {
    UI.confirm({
      title: `Komentar asprak untuk ${task.title}`,
      bodyHtml: `<p>${UI.escape(task.comment || 'Belum ada komentar.')}</p><p>Batas revisi: ${Format.longDate(task.due)}, ${Format.time(task.due)} WIB.</p>`,
      confirmLabel: 'Cek & kumpulkan revisi',
      cancelLabel: 'Tutup',
      icon: 'message',
      iconTone: 'info'
    }).then((confirmed) => {
      if (confirmed) {
        window.location.href = UI.pageUrl('cek-kumpulkan', { id: task.id });
      }
    });
  }

  function showScore(task) {
    const platform = UI.platform(task.platform);
    UI.confirm({
      title: `Nilai ${task.title}`,
      bodyHtml: `<p class="score">${UI.escape(task.score)}<span>/100</span></p>${task.comment ? `<p>${UI.escape(task.comment)}</p>` : ''}`,
      confirmLabel: `Buka tugas di ${platform.label}`,
      cancelLabel: 'Tutup',
      icon: 'award',
      iconTone: 'info',
      onConfirm: () => UI.openTask(task)
    });
  }

  function renderSettings() {
    const reminders = Store.getReminders();
    els.settings.innerHTML = SETTINGS.map((setting) => {
      const on = Boolean(reminders[setting.key]);
      return `<div class="setting-row">
        <div class="setting-row__text">
          <span class="list-row__title" id="setting-${setting.key}">${UI.escape(setting.title)}</span>
          <span class="text-caption text-secondary" id="setting-${setting.key}-desc">${UI.escape(setting.description)}</span>
        </div>
        <span class="setting-row__state text-secondary" aria-hidden="true">${on ? 'Aktif' : 'Nonaktif'}</span>
        <button class="switch" type="button" role="switch" aria-checked="${on}" aria-labelledby="setting-${setting.key}" aria-describedby="setting-${setting.key}-desc" data-key="${setting.key}"></button>
      </div>`;
    }).join('');
  }

  function renderNext() {
    const reminders = Store.getReminders();
    const now = Format.now();
    const list = [];
    if (reminders.deadline) {
      Store.getTasks().filter((task) => task.status === 'belum' || task.status === 'revisi').forEach((task) => {
        Format.reminderTimes(task.due, 'task').forEach((item) => list.push({ at: item.at, label: item.label, title: task.title }));
      });
    }
    if (reminders.exam) {
      Store.getExams().forEach((exam) => {
        Format.reminderTimes(exam.at, 'exam').forEach((item) => list.push({ at: item.at, label: item.label, title: exam.title }));
      });
    }
    const upcoming = list.filter((item) => item.at > now).sort((a, b) => a.at - b.at).slice(0, 3);
    if (!upcoming.length) {
      els.next.innerHTML = '<li class="text-small text-secondary">Tidak ada pengingat aktif. Nyalakan pengingat di atas.</li>';
      return;
    }
    const channel = reminders.email ? `<span class="inline-meta">${Icon.render('mail', 14)}Juga dikirim ke email</span>` : '';
    els.next.innerHTML = upcoming.map((item) => `<li class="list-row">
      <span class="icon-box icon-box--neutral">${Icon.render('bell', 18)}</span>
      <span class="list-row__text">
        <span class="list-row__title">${Format.dateTime(item.at)} WIB</span>
        <span class="text-caption text-secondary">${UI.escape(item.label)} · ${UI.escape(item.title)}</span>
        ${channel}
      </span>
    </li>`).join('');
  }

  function announceSubmission() {
    if (!state.highlight) {
      return;
    }
    const task = Store.getTask(state.highlight);
    window.history.replaceState(null, '', UI.pageUrl('status'));
    if (!task || task.status !== 'terkumpul') {
      return;
    }
    UI.toast(`${task.title} ditandai terkumpul.`, {
      actionLabel: 'Urungkan',
      onAction: () => {
        const previous = task.previousStatus && task.previousStatus !== 'terkumpul' ? task.previousStatus : 'belum';
        setStatus(task.id, { status: previous, submittedAt: null });
        focusRow(task.id);
        UI.toast('Tanda terkumpul dibatalkan.', { icon: 'undo' });
      }
    });
  }

  els.filter.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) {
      return;
    }
    state.filter = button.dataset.filter;
    renderFilter();
    renderTable();
    els.filter.querySelector(`[data-filter="${state.filter}"]`).focus();
  });

  els.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }
    const task = Store.getTask(button.dataset.id);
    if (!task) {
      return;
    }
    if (button.dataset.action === 'undo') {
      undoSubmission(task);
    } else if (button.dataset.action === 'comment') {
      showComment(task);
    } else if (button.dataset.action === 'score') {
      showScore(task);
    }
  });

  els.settings.addEventListener('click', (event) => {
    const toggle = event.target.closest('.switch');
    if (!toggle) {
      return;
    }
    const key = toggle.dataset.key;
    const on = toggle.getAttribute('aria-checked') !== 'true';
    Store.setReminder(key, on);
    toggle.setAttribute('aria-checked', String(on));
    toggle.previousElementSibling.textContent = on ? 'Aktif' : 'Nonaktif';
    renderNext();
    const setting = SETTINGS.find((item) => item.key === key);
    UI.toast(`${setting.title} ${on ? 'dinyalakan' : 'dimatikan'}.`, { icon: 'bell' });
  });

  els.reset.addEventListener('click', () => {
    UI.confirm({
      title: 'Atur ulang data demo?',
      body: 'Semua status, info yang kamu simpan, centang daftar cek, dan pengaturan pengingat akan kembali seperti awal.',
      confirmLabel: 'Ya, atur ulang',
      cancelLabel: 'Batal',
      tone: 'danger'
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      Store.reset();
      state.filter = 'semua';
      state.highlight = null;
      UI.renderSidebar('status');
      renderSettings();
      render();
      UI.toast('Data demo sudah kembali seperti awal.', { icon: 'refresh' });
    });
  });

  renderSettings();
  render();
  announceSubmission();
})();
