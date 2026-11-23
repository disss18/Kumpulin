(() => {
  UI.initPage('beranda');

  const requestedId = UI.param('id') || '';
  const task = Store.getTask(requestedId) || Store.getDefaultTask();

  if (!task) {
    document.getElementById('check-view').hidden = true;
    document.getElementById('missing-view').hidden = false;
    document.title = 'Laprak tidak ditemukan · Kumpulin';
    return;
  }

  if (task.id !== requestedId) {
    window.history.replaceState(null, '', UI.pageUrl('cek-kumpulkan', { id: task.id }));
  }

  const course = UI.course(task.courseId);
  const platform = UI.platform(task.platform);
  const fileName = Format.fileName(task);
  const items = (task.checklist || []).map((text) => Format.fillTemplate(text, task));
  const alreadySubmitted = task.status === 'terkumpul' || task.status === 'dinilai';
  const detailUrl = UI.pageUrl('detail-laprak', { id: task.id });
  let checked = Store.getChecklist(task.id, items.length);

  const els = {
    breadcrumb: document.getElementById('breadcrumb'),
    subtitle: document.getElementById('check-subtitle'),
    stepPlatform: document.getElementById('step-platform'),
    count: document.getElementById('check-count'),
    progress: document.getElementById('check-progress'),
    progressBar: document.getElementById('check-progress-bar'),
    notice: document.getElementById('check-notice'),
    list: document.getElementById('checklist'),
    submitHeading: document.getElementById('submit-heading'),
    submitText: document.getElementById('submit-text'),
    submitTarget: document.getElementById('submit-target'),
    fileName: document.getElementById('file-name'),
    copy: document.getElementById('copy-button'),
    submit: document.getElementById('submit-button'),
    back: document.getElementById('back-button')
  };

  function remaining() {
    return checked.map((value, index) => (value ? null : index)).filter((index) => index !== null);
  }

  function renderHeader() {
    document.title = `Cek ${task.title} · Kumpulin`;
    els.breadcrumb.innerHTML = `
      <li><a href="index.html">Beranda</a></li>
      <li aria-hidden="true">${Icon.render('chevronRight', 14)}</li>
      <li><a href="${detailUrl}">${UI.escape(task.title)}</a></li>
      <li aria-hidden="true">${Icon.render('chevronRight', 14)}</li>
      <li><span aria-current="page">Cek &amp; Kumpulkan</span></li>`;
    els.subtitle.textContent = `${task.title} · ${course.name}. Tenggat ${Format.longDate(task.due)}, ${Format.time(task.due)} WIB.`;
    els.stepPlatform.textContent = `Kumpulkan di ${platform.shortLabel}`;
    els.submitHeading.textContent = `Kumpulkan di ${platform.label}`;
    els.submitText.textContent = alreadySubmitted
      ? `Laprak ini sudah ditandai terkumpul. Kamu tetap bisa membuka halaman tugasnya di ${platform.label} untuk mengecek unggahan.`
      : `Kumpulin akan membuka halaman tugas ini di ${platform.label} pada tab baru, lalu menandai laprak ini terkumpul.`;
    els.submitTarget.innerHTML = `${Icon.render('external', 14)}<span>${UI.escape(Format.shortUrl(UI.taskUrl(task)))}</span>`;
    els.fileName.textContent = fileName;
    els.submit.innerHTML = `${Icon.render('external', 20)}<span>${alreadySubmitted ? `Buka ${UI.escape(platform.shortLabel)} lagi` : `Kumpulkan di ${UI.escape(platform.shortLabel)}`}</span>`;
    els.back.href = detailUrl;
  }

  function renderList() {
    if (!items.length) {
      els.list.innerHTML = '<li class="text-small text-secondary">Tidak ada daftar cek untuk laprak ini.</li>';
      return;
    }
    els.list.innerHTML = items.map((text, index) => `<li>
      <label class="check-item" for="check-${index}">
        <input type="checkbox" id="check-${index}" data-index="${index}"${checked[index] ? ' checked' : ''}>
        <span class="check-item__box">${Icon.render('check', 14)}</span>
        <span class="check-item__label">${UI.escape(text)}</span>
        <span class="tag check-item__tag">Belum dicek</span>
      </label>
    </li>`).join('');
  }

  function renderProgress() {
    const done = checked.filter(Boolean).length;
    const percent = items.length ? Math.round((done / items.length) * 100) : 100;
    els.count.innerHTML = `<strong>${done} dari ${items.length}</strong> sudah dicek`;
    els.progress.setAttribute('aria-valuemax', String(items.length));
    els.progress.setAttribute('aria-valuenow', String(done));
    els.progressBar.style.width = `${percent}%`;
  }

  function renderNotice() {
    if (alreadySubmitted) {
      els.notice.innerHTML = `<div class="banner banner--info">${Icon.render('checkCircle', 20)}<div><strong>Sudah ditandai terkumpul</strong><span>${task.submittedAt ? `Pada ${Format.dateTime(task.submittedAt)} WIB.` : ''} Daftar cek ini hanya untuk pengingat.</span></div></div>`;
    }
  }

  function showWarnings(indexes) {
    indexes.forEach((index) => {
      const input = document.getElementById(`check-${index}`);
      if (input) {
        input.closest('.check-item').classList.add('is-warning');
      }
    });
    els.notice.innerHTML = `<div class="banner">${Icon.render('alert', 20)}<div><strong>Masih ada ${indexes.length} hal yang belum dicek</strong><span>Centang setelah kamu memastikan berkasnya sesuai aturan.</span></div></div>`;
    const first = document.getElementById(`check-${indexes[0]}`);
    if (first) {
      first.focus();
    }
  }

  function clearWarningsIfDone() {
    if (!remaining().length && !alreadySubmitted) {
      els.notice.innerHTML = `<div class="banner banner--info">${Icon.render('checkCircle', 20)}<div><strong>Semua sudah dicek</strong><span>Berkasmu siap dikumpulkan.</span></div></div>`;
    }
  }

  function submit() {
    UI.openTask(task);
    UI.setLoading(els.submit, true, 'Menandai terkumpul…');
    Store.updateTask(task.id, {
      status: 'terkumpul',
      previousStatus: task.status,
      submittedAt: Format.toIso(Format.now())
    });
    window.setTimeout(() => {
      window.location.href = UI.pageUrl('status', { terkumpul: task.id });
    }, 700);
  }

  els.list.addEventListener('change', (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) {
      return;
    }
    const index = Number(input.dataset.index);
    checked[index] = input.checked;
    Store.setChecklistItem(task.id, index, input.checked);
    if (input.checked) {
      input.closest('.check-item').classList.remove('is-warning');
    }
    renderProgress();
    clearWarningsIfDone();
  });

  els.copy.addEventListener('click', () => {
    UI.copyText(fileName).then((copied) => {
      UI.toast(copied ? 'Nama file tersalin.' : 'Gagal menyalin otomatis. Salin secara manual ya.', { icon: copied ? 'checkCircle' : 'alertCircle' });
    });
  });

  els.submit.addEventListener('click', () => {
    if (alreadySubmitted) {
      UI.openTask(task);
      UI.toast(`Halaman tugas di ${platform.label} dibuka di tab baru.`, { icon: 'external' });
      return;
    }
    const left = remaining();
    if (!left.length) {
      submit();
      return;
    }
    UI.confirm({
      title: `Masih ada ${left.length} hal yang belum dicek`,
      bodyHtml: `<p>Kalau tetap dikumpulkan, laprak bisa ditolak karena hal ini belum dipastikan:</p><ul>${left.map((index) => `<li>${UI.escape(items[index])}</li>`).join('')}</ul>`,
      confirmLabel: 'Tetap kumpulkan',
      cancelLabel: 'Periksa lagi',
      hint: 'Esc untuk kembali',
      onConfirm: submit
    }).then((confirmed) => {
      if (!confirmed) {
        showWarnings(left);
      }
    });
  });

  checked = checked.slice(0, items.length);
  renderHeader();
  renderList();
  renderProgress();
  renderNotice();
})();
