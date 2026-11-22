(() => {
  UI.initPage('simpan');

  const SAMPLES = [
    'Halo teman-teman APS! LK Modul 6: Sequence Diagram dikumpulkan di Classroom paling lambat Senin, 9 November 2026 pukul 23.59. Format file PDF dengan nama APS_M6_NIM_Nama. Sequence Diagram wajib dibuat dengan draw.io. Yang telat tidak diterima ya. Link pengumpulan: https://classroom.google.com/c/NzE0MjU1ODYzMTk1/a/NzMwNTE4MjkzNjQ3/details',
    'Info tambahan Laprak Jarkom Modul 4 ya. File .pkt wajib dilampirkan dalam ZIP terpisah. Screenshot hasil ping harus ada untuk setiap router.',
    'Pengumuman UTP Praktikum Basis Data hari Jumat, 13 November 2026 jam 10.00 di Lab Komputer 1, Gedung G. Wajib bawa kartu praktikum dan datang 15 menit sebelum mulai.'
  ];

  const TYPE_LABEL = { tenggat: 'Tenggat', aturan: 'Aturan', ujian: 'Ujian' };
  const RULES_LABEL = { tenggat: 'Aturan penting', aturan: 'Aturan baru', ujian: 'Catatan ujian' };
  const CONTROL_ID = { message: 'message', course: 'course', due: 'due', target: 'target', title: 'title', link: 'link', rules: 'rule-input' };
  const AUTOFILL_KEYS = ['course', 'due', 'target', 'title', 'place', 'file', 'link', 'rules'];

  const form = document.getElementById('info-form');
  const els = {
    message: document.getElementById('message'),
    parseButton: document.getElementById('parse-button'),
    sampleButton: document.getElementById('sample-button'),
    parseResult: document.getElementById('parse-result'),
    course: document.getElementById('course'),
    due: document.getElementById('due'),
    dueLabel: document.getElementById('due-label'),
    target: document.getElementById('target'),
    title: document.getElementById('title'),
    place: document.getElementById('place'),
    fileName: document.getElementById('file-name'),
    link: document.getElementById('link'),
    ruleList: document.getElementById('rule-list'),
    ruleInput: document.getElementById('rule-input'),
    ruleAdd: document.getElementById('rule-add-button'),
    rulesLabel: document.getElementById('rules-label'),
    save: document.getElementById('save-button'),
    preview: document.getElementById('preview'),
    previewType: document.getElementById('preview-type'),
    previewCaption: document.getElementById('preview-caption')
  };

  let rules = [];
  let sampleIndex = 0;
  let detectedPlatform = '';

  function field(key) {
    return document.getElementById(`field-${key}`);
  }

  function currentType() {
    return form.querySelector('input[name="type"]:checked').value;
  }

  function setType(type) {
    const input = form.querySelector(`input[name="type"][value="${type}"]`);
    if (input) {
      input.checked = true;
    }
    applyType();
  }

  function populateCourses() {
    const options = KumpulinData.courses.map((course) => `<option value="${course.id}">${UI.escape(course.name)}</option>`).join('');
    els.course.insertAdjacentHTML('beforeend', options);
  }

  function openTasks(courseId) {
    return Store.getTasks().filter((task) => task.courseId === courseId && (task.status === 'belum' || task.status === 'revisi'));
  }

  function populateTargets(moduleNumber) {
    const previous = els.target.value;
    if (!els.course.value) {
      els.target.innerHTML = '<option value="">Pilih praktikum dulu</option>';
      return;
    }
    const tasks = openTasks(els.course.value);
    if (!tasks.length) {
      els.target.innerHTML = '<option value="">Tidak ada laprak aktif</option>';
      return;
    }
    els.target.innerHTML = tasks.map((task) => `<option value="${UI.escape(task.id)}">${UI.escape(task.title)}</option>`).join('');
    const byModule = moduleNumber ? tasks.find((task) => new RegExp(`modul\\s*${moduleNumber}\\b`, 'i').test(task.title)) : null;
    if (byModule) {
      els.target.value = byModule.id;
    } else if (tasks.some((task) => task.id === previous)) {
      els.target.value = previous;
    }
  }

  function setError(key, message) {
    const control = document.getElementById(CONTROL_ID[key]);
    field(key).classList.add('is-invalid');
    control.setAttribute('aria-invalid', 'true');
    document.getElementById(`${key}-error`).innerHTML = `${Icon.render('alertCircle', 16)}<span>${UI.escape(message)}</span>`;
  }

  function clearError(key) {
    const control = document.getElementById(CONTROL_ID[key]);
    field(key).classList.remove('is-invalid');
    control.removeAttribute('aria-invalid');
    document.getElementById(`${key}-error`).innerHTML = '';
  }

  function clearErrors() {
    Object.keys(CONTROL_ID).forEach(clearError);
  }

  function markAutofilled(key) {
    field(key).classList.add('is-autofilled');
  }

  function clearAutofilled(key) {
    field(key).classList.remove('is-autofilled');
  }

  function applyType() {
    const type = currentType();
    field('due').hidden = type === 'aturan';
    field('title').hidden = type === 'aturan';
    field('target').hidden = type !== 'aturan';
    field('place').hidden = type !== 'ujian';
    field('file').hidden = type !== 'tenggat';
    field('link').hidden = type !== 'tenggat';
    els.dueLabel.textContent = type === 'ujian' ? 'Jadwal ujian' : 'Tenggat';
    els.rulesLabel.textContent = RULES_LABEL[type];
    els.title.placeholder = type === 'ujian' ? 'Contoh: UTP Praktikum Basis Data' : 'Contoh: LK Modul 6: Sequence Diagram';
    els.ruleInput.placeholder = type === 'ujian' ? 'Tulis catatan lalu tekan Enter' : 'Tulis aturan lalu tekan Enter';
    if (type === 'aturan') {
      populateTargets();
    }
    ['due', 'title', 'target', 'link', 'rules'].forEach(clearError);
    renderRules();
    updatePreview();
  }

  function renderRules() {
    if (!rules.length) {
      els.ruleList.innerHTML = `<li class="chip-empty">${currentType() === 'ujian' ? 'Belum ada catatan.' : 'Belum ada aturan.'}</li>`;
      return;
    }
    els.ruleList.innerHTML = rules.map((rule, index) => `<li class="chip">
      <span class="chip__text">${UI.escape(rule)}</span>
      <button class="chip__remove" type="button" data-index="${index}" aria-label="Hapus: ${UI.escape(rule)}">${Icon.render('x', 14)}</button>
    </li>`).join('');
  }

  function addRule() {
    const value = els.ruleInput.value.trim();
    if (!value) {
      els.ruleInput.focus();
      return;
    }
    if (!rules.includes(value)) {
      rules.push(value);
    }
    els.ruleInput.value = '';
    clearError('rules');
    renderRules();
    updatePreview();
    els.ruleInput.focus();
  }

  function removeRule(index) {
    rules.splice(index, 1);
    clearAutofilled('rules');
    renderRules();
    updatePreview();
    const next = els.ruleList.querySelectorAll('.chip__remove')[Math.min(index, rules.length - 1)];
    (next || els.ruleInput).focus();
  }

  function toTemplate(value) {
    if (!value) {
      return '';
    }
    let name = value.trim().replace(/\s+/g, '_');
    name = name.replace(/(^|_)NIM(?=_|\.|$)/gi, '$1{nim}').replace(/(^|_)Nama(?=_|\.|$)/gi, '$1{firstName}');
    if (!/\.[A-Za-z0-9]+$/.test(name)) {
      name += '.pdf';
    }
    return name;
  }

  function previewFileName() {
    const template = toTemplate(els.fileName.value);
    return template ? Format.fileName({ fileName: template }) : '';
  }

  function rulesHtml() {
    if (!rules.length) {
      return 'Belum ada';
    }
    return `<ul>${rules.map((rule) => `<li>${UI.escape(rule)}</li>`).join('')}</ul>`;
  }

  function dueValue() {
    return els.due.value ? new Date(els.due.value) : null;
  }

  function updatePreview() {
    const type = currentType();
    const courseId = els.course.value;
    const info = UI.course(courseId);
    els.previewType.textContent = TYPE_LABEL[type];

    if (type === 'aturan') {
      els.previewCaption.textContent = 'Aturan ini akan ditambahkan ke detail laprak yang dipilih.';
      const task = els.target.value ? Store.getTask(els.target.value) : null;
      const card = task
        ? UI.deadlineCard({ kind: 'task', id: task.id, title: task.title, courseId: task.courseId, date: task.due, status: task.status, source: task.source }, { static: true, compact: true })
        : '<p class="text-small text-secondary">Pilih praktikum dan laprak tujuan dulu.</p>';
      els.preview.innerHTML = `${card}<dl class="preview-list"><div><dt>Aturan baru</dt><dd>${rulesHtml()}</dd></div></dl>`;
      return;
    }

    const date = dueValue();
    const title = els.title.value.trim();
    const item = type === 'ujian'
      ? { kind: 'exam', id: 'preview', title: title || 'Judul ujian belum diisi', courseId, date, source: 'grup', place: els.place.value.trim() }
      : { kind: 'task', id: 'preview', title: title || 'Judul belum diisi', courseId, date, status: 'belum', source: 'grup' };

    const rows = [
      `<div><dt>${type === 'ujian' ? 'Jadwal' : 'Tenggat'}</dt><dd>${date ? `${Format.longDate(date)}, ${Format.time(date)} WIB` : 'Belum diisi'}</dd></div>`,
      `<div><dt>Praktikum</dt><dd>${UI.escape(courseId ? info.name : 'Belum dipilih')}</dd></div>`
    ];
    if (type === 'tenggat') {
      rows.push(`<div><dt>Nama file</dt><dd class="text-mono">${UI.escape(previewFileName() || 'Belum diisi')}</dd></div>`);
      rows.push(`<div><dt>Tombol Kumpulkan membuka</dt><dd class="text-mono">${UI.escape(previewLink())}</dd></div>`);
    }
    rows.push(`<div><dt>${type === 'ujian' ? 'Catatan' : 'Aturan'}</dt><dd>${rulesHtml()}</dd></div>`);

    els.previewCaption.textContent = 'Begini info ini akan tampil di Beranda.';
    els.preview.innerHTML = `${UI.deadlineCard(item, { static: true, compact: true })}<dl class="preview-list">${rows.join('')}</dl>`;
  }

  function renderParseResult(type, found, missing) {
    const label = TYPE_LABEL[type].toLowerCase();
    const title = missing.length ? `Terbaca sebagai info ${label}, tapi belum lengkap` : `Terbaca sebagai info ${label}`;
    const lines = [];
    if (found.length) {
      lines.push(`Terisi otomatis: ${found.join(', ')}.`);
    }
    lines.push(missing.length ? `Belum terbaca: ${missing.join(', ')}. Isi manual di bawah.` : 'Cek lagi sebelum disimpan.');
    els.parseResult.innerHTML = `<div class="banner${missing.length ? '' : ' banner--info'}">
      ${Icon.render(missing.length ? 'alert' : 'checkCircle', 20)}
      <div><strong>${UI.escape(title)}</strong><span>${UI.escape(lines.join(' '))}</span></div>
    </div>`;
  }

  function applyResult(result) {
    AUTOFILL_KEYS.forEach(clearAutofilled);
    els.due.value = '';
    els.title.value = '';
    els.place.value = '';
    els.fileName.value = '';
    els.link.value = '';
    detectedPlatform = result.platform;

    const found = [];
    const missing = [];
    const formCheck = form.querySelector(`input[name="type"][value="${result.type}"]`);
    formCheck.checked = true;

    els.course.value = result.courseId;
    if (result.courseId) {
      markAutofilled('course');
      found.push('praktikum');
    } else {
      missing.push('praktikum');
    }

    if (result.type === 'aturan') {
      populateTargets(result.module);
      if (els.target.value) {
        markAutofilled('target');
        found.push('laprak tujuan');
      } else {
        missing.push('laprak tujuan');
      }
    } else {
      if (result.due) {
        els.due.value = Format.toInputValue(result.due);
        markAutofilled('due');
        found.push(result.type === 'ujian' ? 'jadwal' : 'tanggal');
      } else {
        missing.push(result.type === 'ujian' ? 'jadwal' : 'tanggal');
      }
      if (result.title) {
        els.title.value = result.title;
        markAutofilled('title');
        found.push('judul');
      } else {
        missing.push('judul');
      }
    }

    if (result.place) {
      els.place.value = result.place;
      markAutofilled('place');
      found.push('tempat');
    }
    if (result.fileName) {
      els.fileName.value = result.fileName;
      markAutofilled('file');
      found.push('nama file');
    }
    if (result.url) {
      els.link.value = result.url;
      markAutofilled('link');
      found.push('link pengumpulan');
    }

    rules = result.rules.slice();
    if (rules.length) {
      markAutofilled('rules');
      found.push(`${rules.length} ${result.type === 'ujian' ? 'catatan' : 'aturan'}`);
    } else if (result.type === 'aturan') {
      missing.push('aturan');
    }

    applyType();
    clearErrors();
    renderParseResult(result.type, found, missing);
  }

  function runParse() {
    const text = els.message.value.trim();
    if (!text) {
      setError('message', 'Tempel pesan dulu sebelum dibaca.');
      els.message.focus();
      return;
    }
    clearError('message');
    applyResult(MessageParser.parse(text));
  }

  function validate(type) {
    clearErrors();
    const errors = [];
    if (!els.course.value) {
      errors.push(['course', 'Pilih praktikum dulu.']);
    }
    if (type !== 'aturan' && !els.due.value) {
      errors.push(['due', type === 'ujian' ? 'Jadwal belum terisi. Pilih tanggal dan jam ujian.' : 'Tanggal belum terisi. Pilih tanggal dari pesan asprak.']);
    }
    if (type === 'aturan' && els.course.value && !els.target.value) {
      errors.push(['target', 'Belum ada laprak aktif di praktikum ini. Simpan sebagai tenggat dulu.']);
    }
    if (type !== 'aturan' && !els.title.value.trim()) {
      errors.push(['title', type === 'ujian' ? 'Judul belum terisi. Contoh: UTP Praktikum Basis Data.' : 'Judul belum terisi. Contoh: LK Modul 6: Sequence Diagram.']);
    }
    if (type === 'tenggat' && els.link.value.trim() && !isLink(els.link.value.trim())) {
      errors.push(['link', 'Link belum benar. Salin link lengkap yang diawali https://, misalnya https://classroom.google.com/c/...']);
    }
    if (type === 'aturan' && !rules.length) {
      errors.push(['rules', 'Tambahkan minimal satu aturan.']);
    }
    errors.forEach(([key, message]) => setError(key, message));
    if (errors.length) {
      document.getElementById(CONTROL_ID[errors[0][0]]).focus();
    }
    return !errors.length;
  }

  function isLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function platformFromLink(value) {
    if (/classroom\.google\.com/i.test(value)) {
      return 'classroom';
    }
    if (/eling/i.test(value)) {
      return 'eling';
    }
    return '';
  }

  function previewLink() {
    const link = els.link.value.trim();
    if (link && isLink(link)) {
      return Format.shortUrl(link);
    }
    const platform = UI.platform(detectedPlatform || platformFromLink(link) || UI.course(els.course.value).platform);
    return `Halaman utama ${platform.label}`;
  }

  function sourceNote(info) {
    const text = els.message.value.trim();
    if (!text) {
      return null;
    }
    return { author: `Grup ${info.short}`, sentAt: `disimpan ${Format.dateTime(Format.now())}`, text };
  }

  function saveInfo(type) {
    const courseId = els.course.value;
    const info = UI.course(courseId);
    const ruleObjects = rules.map(MessageParser.classifyRule);
    const note = sourceNote(info);

    if (type === 'aturan') {
      const task = Store.getTask(els.target.value);
      const patch = {
        rules: task.rules.concat(ruleObjects),
        checklist: task.checklist.concat(ruleObjects.map((rule) => rule.value))
      };
      if (!task.sourceNote && note) {
        patch.sourceNote = note;
      }
      Store.updateTask(task.id, patch);
      return task.id;
    }

    if (type === 'ujian') {
      const exam = Store.addExam({
        courseId,
        title: els.title.value.trim(),
        at: Format.toIso(new Date(els.due.value)),
        place: els.place.value.trim(),
        source: 'grup',
        note: rules.join(' · ')
      });
      return exam.id;
    }

    const title = els.title.value.trim();
    const moduleMatch = title.match(/modul\s*(\d{1,2})/i);
    const fallbackName = `${info.short.toUpperCase()}${moduleMatch ? `_M${moduleMatch[1]}` : ''}_{nim}_{firstName}.pdf`;
    const link = els.link.value.trim();
    const task = {
      courseId,
      title,
      platform: platformFromLink(link) || detectedPlatform || info.platform,
      source: 'grup',
      due: Format.toIso(new Date(els.due.value)),
      status: 'belum',
      fileName: toTemplate(els.fileName.value) || fallbackName,
      rules: ruleObjects,
      checklist: ['Nama file sesuai: {file}'].concat(ruleObjects.map((rule) => rule.value))
    };
    if (link) {
      task.url = link;
    }
    if (note) {
      task.sourceNote = note;
    }
    return Store.addTask(task).id;
  }

  els.parseButton.addEventListener('click', runParse);

  els.sampleButton.addEventListener('click', () => {
    els.message.value = SAMPLES[sampleIndex % SAMPLES.length];
    sampleIndex += 1;
    runParse();
  });

  els.message.addEventListener('paste', () => {
    window.setTimeout(() => {
      if (els.message.value.trim()) {
        runParse();
      }
    }, 0);
  });

  els.message.addEventListener('input', () => clearError('message'));

  form.querySelectorAll('input[name="type"]').forEach((input) => {
    input.addEventListener('change', applyType);
  });

  els.course.addEventListener('change', () => {
    clearError('course');
    clearAutofilled('course');
    if (currentType() === 'aturan') {
      populateTargets();
      clearError('target');
    }
    updatePreview();
  });

  els.target.addEventListener('change', () => {
    clearError('target');
    clearAutofilled('target');
    updatePreview();
  });

  [['due', els.due], ['title', els.title], ['link', els.link]].forEach(([key, input]) => {
    input.addEventListener('input', () => {
      clearError(key);
      clearAutofilled(key);
      updatePreview();
    });
  });

  [['place', els.place], ['file', els.fileName]].forEach(([key, input]) => {
    input.addEventListener('input', () => {
      clearAutofilled(key);
      updatePreview();
    });
  });

  els.ruleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addRule();
    }
  });

  els.ruleAdd.addEventListener('click', addRule);

  els.ruleList.addEventListener('click', (event) => {
    const button = event.target.closest('.chip__remove');
    if (button) {
      removeRule(Number(button.dataset.index));
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const type = currentType();
    if (!validate(type)) {
      return;
    }
    UI.setLoading(els.save, true, 'Menyimpan…');
    const id = saveInfo(type);
    window.setTimeout(() => {
      window.location.href = `index.html?tersimpan=${type}&id=${encodeURIComponent(id)}`;
    }, 450);
  });

  populateCourses();
  setType('tenggat');
})();
