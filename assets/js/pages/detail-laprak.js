(() => {
  UI.initPage('beranda');

  const RULE_ICONS = {
    format: 'file',
    name: 'file',
    content: 'clipboard',
    late: 'clock',
    diagram: 'layers',
    submit: 'external',
    attachment: 'layers',
    note: 'info'
  };

  const URGENCY_BADGE = { danger: 'danger', warning: 'warning', neutral: 'neutral' };

  const requestedId = UI.param('id') || '';
  const task = Store.getTask(requestedId) || Store.getDefaultTask();

  if (!task) {
    document.getElementById('detail-view').hidden = true;
    document.getElementById('missing-view').hidden = false;
    document.title = 'Laprak tidak ditemukan · Kumpulin';
    return;
  }

  if (task.id !== requestedId) {
    window.history.replaceState(null, '', UI.pageUrl('detail-laprak', { id: task.id }));
  }

  const course = UI.course(task.courseId);
  const platform = UI.platform(task.platform);
  const fileName = Format.fileName(task);
  const isOpen = task.status === 'belum' || task.status === 'revisi';

  const els = {
    breadcrumb: document.getElementById('breadcrumb'),
    title: document.getElementById('task-title'),
    meta: document.getElementById('task-meta'),
    due: document.getElementById('due-card'),
    rulesCount: document.getElementById('rules-count'),
    rules: document.getElementById('rule-list'),
    sourceNote: document.getElementById('source-note'),
    fileName: document.getElementById('file-name'),
    copy: document.getElementById('copy-button'),
    action: document.getElementById('action-card'),
    reminders: document.getElementById('reminder-list')
  };

  function renderHeader() {
    document.title = `${task.title} · Kumpulin`;
    els.breadcrumb.innerHTML = `
      <li><a href="index.html">Beranda</a></li>
      <li aria-hidden="true">${Icon.render('chevronRight', 14)}</li>
      <li><a href="${UI.pageUrl('index', { praktikum: course.id })}">${UI.escape(course.short)}</a></li>
      <li aria-hidden="true">${Icon.render('chevronRight', 14)}</li>
      <li><span aria-current="page">${UI.escape(task.title)}</span></li>`;
    els.title.textContent = task.title;
    els.meta.innerHTML = `<span>${UI.escape(course.name)}</span>${UI.statusBadge(task.status)}${UI.sourceBadge(task.source)}`;
  }

  function renderDue() {
    const tone = isOpen ? Format.urgency(task.due) : 'neutral';
    els.due.innerHTML = `
      <span class="icon-box icon-box--large ${tone === 'neutral' ? 'icon-box--neutral' : 'icon-box--warning'}">${Icon.render('clock', 20)}</span>
      <div class="due-card__text">
        <p class="overline text-secondary">${task.status === 'revisi' ? 'Batas revisi' : 'Tenggat'}</p>
        <p class="due-card__date">${Format.longDate(task.due)} · ${Format.time(task.due)} WIB</p>
        <p class="text-small text-secondary">Dikumpulkan lewat ${UI.escape(platform.label)}</p>
      </div>
      ${isOpen ? `<span class="badge badge--${URGENCY_BADGE[tone]}">${Icon.render('clock', 14)}${UI.escape(Format.relative(task.due))}</span>` : UI.statusBadge(task.status)}`;
  }

  function renderRules() {
    const rules = task.rules || [];
    els.rulesCount.textContent = `${rules.length} aturan`;
    if (!rules.length) {
      els.rules.innerHTML = '<li class="text-small text-secondary">Belum ada aturan khusus dari asprak.</li>';
    } else {
      els.rules.innerHTML = rules.map((rule) => `<li class="rule-item${rule.important ? ' is-important' : ''}">
        <span class="rule-item__icon">${Icon.render(RULE_ICONS[rule.kind] || 'info', 18)}</span>
        <div class="rule-item__text">
          <span class="rule-item__label">${UI.escape(rule.label)}${rule.important ? `<span class="badge badge--warning">${Icon.render('alert', 12)}Penting</span>` : ''}</span>
          <span class="rule-item__value">${UI.escape(rule.value)}</span>
        </div>
      </li>`).join('');
    }

    if (!task.sourceNote) {
      els.sourceNote.hidden = true;
      return;
    }
    const note = task.sourceNote;
    els.sourceNote.innerHTML = `
      <button class="link-button source-toggle" type="button" aria-expanded="false" aria-controls="source-quote">
        ${Icon.render('message', 16)}
        <span>Lihat pesan asli dari grup</span>
        ${Icon.render('chevronDown', 16)}
      </button>
      <blockquote class="source-note" id="source-quote" hidden>
        <p class="source-note__meta">${UI.escape(note.author)} · ${UI.escape(note.sentAt)}</p>
        <p>${UI.escape(note.text)}</p>
      </blockquote>`;
    const toggle = els.sourceNote.querySelector('.source-toggle');
    const quote = els.sourceNote.querySelector('#source-quote');
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.querySelector('span').textContent = expanded ? 'Lihat pesan asli dari grup' : 'Sembunyikan pesan asli';
      quote.hidden = expanded;
    });
  }

  function renderFile() {
    els.fileName.textContent = fileName;
    els.copy.addEventListener('click', () => {
      UI.copyText(fileName).then((copied) => {
        if (!copied) {
          UI.toast('Gagal menyalin otomatis. Salin nama file secara manual ya.', { icon: 'alertCircle' });
          return;
        }
        els.copy.innerHTML = `${Icon.render('check', 16)}<span>Tersalin</span>`;
        UI.toast('Nama file tersalin. Tinggal tempel saat menyimpan laporan.');
        window.setTimeout(() => {
          els.copy.innerHTML = `${Icon.render('copy', 16)}<span>Salin</span>`;
        }, 2000);
      });
    });
  }

  function progressHtml() {
    const list = task.checklist || [];
    const checked = Store.getChecklist(task.id, list.length).filter(Boolean).length;
    const percent = list.length ? Math.round((checked / list.length) * 100) : 0;
    return `
      <div class="check-summary">
        <span><strong>${checked} dari ${list.length}</strong> sudah dicek</span>
        <span class="text-caption text-secondary">${percent}%</span>
      </div>
      <div class="progress" role="progressbar" aria-label="Progres cek berkas" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${checked}">
        <div class="progress__bar" style="width: ${percent}%"></div>
      </div>`;
  }

  function renderAction() {
    const checkUrl = UI.pageUrl('cek-kumpulkan', { id: task.id });

    if (isOpen) {
      const revision = task.status === 'revisi' && task.comment
        ? `<div class="banner">${Icon.render('alert', 20)}<div><strong>Komentar asprak</strong><span>${UI.escape(task.comment)}</span></div></div>`
        : '';
      els.action.innerHTML = `
        <div class="card__title-row">
          <span class="icon-box">${Icon.render('checkCircle', 20)}</span>
          <h2 class="card__title" id="action-heading">${task.status === 'revisi' ? 'Siap kumpulkan revisi?' : 'Siap mengumpulkan?'}</h2>
        </div>
        ${revision}
        <p class="text-small text-secondary">Cek dulu berkasmu supaya tidak ada aturan yang terlewat.</p>
        ${progressHtml()}
        <a class="btn btn--primary btn--block" href="${checkUrl}">
          ${Icon.render('checkCircle', 20)}
          ${task.status === 'revisi' ? 'Cek &amp; kumpulkan revisi' : 'Cek &amp; Kumpulkan'}
        </a>
        <button class="link-button" type="button" data-action="open-direct">
          Buka tugas di ${UI.escape(platform.label)} tanpa cek
          ${Icon.render('external', 16)}
        </button>`;
    } else if (task.status === 'dinilai') {
      els.action.innerHTML = `
        <div class="card__title-row">
          <span class="icon-box">${Icon.render('award', 20)}</span>
          <h2 class="card__title" id="action-heading">Sudah dinilai</h2>
        </div>
        <p class="score">${UI.escape(task.score)}<span>/100</span></p>
        ${task.comment ? `<p class="text-small text-secondary">${UI.escape(task.comment)}</p>` : ''}
        <a class="btn btn--secondary btn--block" href="status.html">Lihat semua status</a>
        <button class="link-button" type="button" data-action="open-direct">
          Buka tugas di ${UI.escape(platform.label)}
          ${Icon.render('external', 16)}
        </button>`;
    } else {
      els.action.innerHTML = `
        <div class="card__title-row">
          <span class="icon-box">${Icon.render('check', 20)}</span>
          <h2 class="card__title" id="action-heading">Sudah terkumpul</h2>
        </div>
        <p class="text-small text-secondary">Ditandai terkumpul ${task.submittedAt ? `pada ${Format.dateTime(task.submittedAt)} WIB` : ''}. Tunggu penilaian dari asprak.</p>
        <a class="btn btn--secondary btn--block" href="status.html">Lihat semua status</a>
        <button class="link-button" type="button" data-action="open-direct">
          Buka tugas di ${UI.escape(platform.label)}
          ${Icon.render('external', 16)}
        </button>`;
    }

    els.action.insertAdjacentHTML('beforeend', `<p class="link-target">${Icon.render('external', 14)}<span>${UI.escape(Format.shortUrl(UI.taskUrl(task)))}</span></p>`);

    els.action.querySelector('[data-action="open-direct"]').addEventListener('click', () => {
      if (UI.openTask(task)) {
        UI.toast(`Halaman tugas di ${platform.label} dibuka di tab baru.`, { icon: 'external' });
      }
    });
  }

  function renderReminders() {
    if (!isOpen) {
      els.reminders.innerHTML = '<li class="text-small text-secondary">Pengingat berhenti karena laprak ini sudah terkumpul.</li>';
      return;
    }
    const enabled = Store.getReminders().deadline;
    const now = Format.now();
    els.reminders.innerHTML = Format.reminderTimes(task.due, 'task').map((reminder) => {
      let state = '<span class="badge badge--success reminder-state">Aktif</span>';
      if (!enabled) {
        state = '<span class="badge badge--neutral reminder-state">Nonaktif</span>';
      } else if (reminder.at < now) {
        state = '<span class="badge badge--neutral reminder-state">Lewat</span>';
      }
      return `<li class="list-row">
        <span class="icon-box icon-box--neutral">${Icon.render('bell', 18)}</span>
        <span class="list-row__text">
          <span class="list-row__title">${UI.escape(reminder.label)}</span>
          <span class="text-caption text-secondary">${Format.dateTime(reminder.at)} WIB</span>
        </span>
        ${state}
      </li>`;
    }).join('');
  }

  renderHeader();
  renderDue();
  renderRules();
  renderFile();
  renderAction();
  renderReminders();
})();
