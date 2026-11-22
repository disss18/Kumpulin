const UI = (() => {
  const NAV = [
    { id: 'beranda', label: 'Beranda', short: 'Beranda', icon: 'home', href: 'index.html' },
    { id: 'simpan', label: 'Simpan Info', short: 'Simpan', icon: 'clipboard', href: 'simpan-info.html' },
    { id: 'status', label: 'Status Laprak', short: 'Status', icon: 'checkCircle', href: 'status.html' }
  ];

  const STATUS = {
    belum: { label: 'Belum dikumpulkan', tone: 'warning', icon: 'clock' },
    terkumpul: { label: 'Terkumpul', tone: 'success', icon: 'check' },
    dinilai: { label: 'Dinilai', tone: 'info', icon: 'award' },
    revisi: { label: 'Perlu revisi', tone: 'danger', icon: 'edit' },
    ujian: { label: 'Ujian', tone: 'neutral', icon: 'calendar' }
  };

  const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  let toastTimer = null;

  function escape(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function course(id) {
    return KumpulinData.courses.find((item) => item.id === id) || { id: '', name: 'Praktikum belum dipilih', short: '–', platform: 'eling' };
  }

  function platform(id) {
    return KumpulinData.platforms[id] || KumpulinData.platforms.eling;
  }

  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((element) => {
      const size = Number(element.dataset.size) || 20;
      element.outerHTML = Icon.render(element.dataset.icon, size, element.dataset.iconClass || '');
    });
  }

  function statusBadge(status) {
    const meta = STATUS[status] || STATUS.belum;
    return `<span class="badge badge--${meta.tone}">${Icon.render(meta.icon, 14)}${meta.label}</span>`;
  }

  function statusLabel(status) {
    return (STATUS[status] || STATUS.belum).label;
  }

  function sourceBadge(source) {
    const meta = platform(source);
    return `<span class="tag">${Icon.render(meta.icon, 14)}${escape(meta.shortLabel)}</span>`;
  }

  function dateBlock(value, modifiers = '') {
    const classes = ['date-block'].concat(modifiers.split(' ').filter(Boolean).map((name) => `date-block--${name}`));
    if (!Format.isValid(value)) {
      return `<span class="${classes.join(' ')}" aria-hidden="true"><span class="date-block__day">–</span><span class="date-block__date">–</span><span class="date-block__month">&nbsp;</span></span>`;
    }
    const date = new Date(value);
    return `<span class="${classes.join(' ')}" aria-hidden="true"><span class="date-block__day">${Format.dayShort(date)}</span><span class="date-block__date">${date.getDate()}</span><span class="date-block__month">${Format.monthShort(date)}</span></span>`;
  }

  function deadlineCard(item, options = {}) {
    const isExam = item.kind === 'exam';
    const isLink = !isExam && !options.static;
    const tag = isLink ? 'a' : 'div';
    const classes = ['deadline-card'];
    if (!isLink) {
      classes.push('deadline-card--static');
    }
    if (options.compact) {
      classes.push('deadline-card--compact');
    }
    if (options.isNew) {
      classes.push('is-new');
    }
    const href = isLink ? ` href="detail-laprak.html?id=${encodeURIComponent(item.id)}"` : '';
    const validDate = Format.isValid(item.date);
    const metaText = isExam ? item.place || course(item.courseId).name : course(item.courseId).name;
    const dueText = validDate ? `${isExam ? 'Mulai' : 'Pukul'} ${Format.time(item.date)} WIB` : '';
    return `<${tag} class="${classes.join(' ')}"${href}>
      ${dateBlock(item.date, isExam ? 'exam' : '')}
      <span class="deadline-card__info">
        <span class="deadline-card__title">${escape(item.title)}</span>
        <span class="deadline-card__meta"><span>${escape(metaText)}</span>${statusBadge(isExam ? 'ujian' : item.status)}${sourceBadge(item.source)}</span>
      </span>
      <span class="deadline-card__due">
        <span class="deadline-card__due-relative tone-${Format.urgency(item.date)}">${Icon.render('clock', 16)}${escape(Format.relative(item.date))}</span>
        <span class="deadline-card__due-time">${dueText}</span>
      </span>
      <span class="deadline-card__chevron">${Icon.render('chevronRight', 20)}</span>
    </${tag}>`;
  }

  function renderSidebar(active) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      return;
    }
    const activeCourse = active === 'beranda' ? param('praktikum') : null;
    const used = new Set(Store.getTasks().map((task) => task.courseId).concat(Store.getExams().map((exam) => exam.courseId)));
    const courses = KumpulinData.courses.filter((item) => used.has(item.id));
    const user = KumpulinData.user;

    const navItems = NAV.map((item) => {
      const isActive = item.id === active && !activeCourse;
      return `<li>
        <a class="nav-item${item.id === active ? ' is-active' : ''}" href="${item.href}" aria-label="${item.label}" title="${item.label}"${isActive ? ' aria-current="page"' : ''}>
          ${Icon.render(item.icon, 20)}
          <span class="nav-item__label">${item.label}</span>
          <span class="nav-item__short" aria-hidden="true">${item.short}</span>
        </a>
      </li>`;
    }).join('');

    const courseItems = courses.map((item) => {
      const isActive = item.id === activeCourse;
      return `<li>
        <a class="course-item${isActive ? ' is-active' : ''}" href="index.html?praktikum=${item.id}"${isActive ? ' aria-current="page"' : ''}>
          <span>${escape(item.short)}</span>
          <span class="course-item__platform">${escape(platform(item.platform).shortLabel)}</span>
        </a>
      </li>`;
    }).join('');

    sidebar.innerHTML = `
      <a class="sidebar__brand" href="index.html">
        <span class="sidebar__logo">${Icon.render('layers', 18)}</span>
        <span class="sidebar__brand-name">Kumpulin</span>
      </a>
      <nav class="sidebar__nav" aria-label="Navigasi utama">
        <ul class="sidebar__list">${navItems}</ul>
      </nav>
      <div class="sidebar__courses">
        <p class="sidebar__label overline">Praktikum</p>
        <ul class="sidebar__list">${courseItems}</ul>
      </div>
      <div class="sidebar__user">
        <span class="avatar" aria-hidden="true">${escape(user.initial)}</span>
        <span class="sidebar__user-text">
          <strong>${escape(user.name)}</strong>
          <span>${escape(user.program)} · Semester ${user.semester}</span>
        </span>
      </div>`;
  }

  function ensureToastRegion() {
    let region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, options = {}) {
    const region = ensureToastRegion();
    clearTimeout(toastTimer);
    region.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'toast';
    item.innerHTML = `
      <span class="toast__icon">${Icon.render(options.icon || 'checkCircle', 20)}</span>
      <span class="toast__message">${escape(message)}</span>
      ${options.actionLabel ? `<button class="toast__action" type="button">${escape(options.actionLabel)}</button>` : ''}
      <button class="toast__close" type="button" aria-label="Tutup notifikasi">${Icon.render('x', 16)}</button>`;
    region.appendChild(item);
    void item.offsetWidth;
    item.classList.add('is-visible');

    function dismiss() {
      clearTimeout(toastTimer);
      item.classList.remove('is-visible');
      window.setTimeout(() => item.remove(), 260);
    }

    const action = item.querySelector('.toast__action');
    if (action) {
      action.addEventListener('click', () => {
        dismiss();
        if (options.onAction) {
          options.onAction();
        }
      });
    }
    item.querySelector('.toast__close').addEventListener('click', dismiss);
    toastTimer = window.setTimeout(dismiss, options.duration || (options.actionLabel ? 8000 : 4500));
    return dismiss;
  }

  function confirm(options) {
    const settings = Object.assign({
      title: '',
      body: '',
      bodyHtml: '',
      confirmLabel: 'Ya',
      cancelLabel: 'Batal',
      tone: 'primary',
      icon: '',
      iconTone: '',
      hint: '',
      onConfirm: null
    }, options);
    const icon = settings.icon || (settings.tone === 'danger' ? 'alert' : 'alertCircle');
    const iconTone = settings.iconTone || (settings.tone === 'danger' ? 'danger' : 'primary');

    return new Promise((resolve) => {
      const previous = document.activeElement;
      const uid = `dialog-${Math.random().toString(36).slice(2, 8)}`;
      const backdrop = document.createElement('div');
      backdrop.className = 'dialog-backdrop';
      backdrop.innerHTML = `
        <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="${uid}-title" aria-describedby="${uid}-body">
          <div class="dialog__head">
            <span class="dialog__icon dialog__icon--${iconTone}">${Icon.render(icon, 20)}</span>
            <h2 class="dialog__title" id="${uid}-title">${escape(settings.title)}</h2>
            <button class="icon-button" type="button" data-action="cancel" aria-label="Tutup dialog">${Icon.render('x', 20)}</button>
          </div>
          <div class="dialog__body" id="${uid}-body">${settings.bodyHtml || `<p>${escape(settings.body)}</p>`}</div>
          <div class="dialog__footer">
            ${settings.hint ? `<span class="dialog__hint">${escape(settings.hint)}</span>` : ''}
            <button class="btn btn--secondary" type="button" data-action="cancel" data-initial-focus>${escape(settings.cancelLabel)}</button>
            <button class="btn btn--${settings.tone === 'danger' ? 'danger' : 'primary'}" type="button" data-action="confirm">${escape(settings.confirmLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      document.body.classList.add('has-dialog');
      void backdrop.offsetWidth;
      backdrop.classList.add('is-visible');
      backdrop.querySelector('[data-initial-focus]').focus();

      let closed = false;

      function focusables() {
        return Array.from(backdrop.querySelectorAll('button, a[href], input, select, textarea')).filter((element) => !element.disabled);
      }

      function close(result) {
        if (closed) {
          return;
        }
        closed = true;
        if (result && typeof settings.onConfirm === 'function') {
          settings.onConfirm();
        }
        document.removeEventListener('keydown', onKeydown, true);
        backdrop.classList.remove('is-visible');
        document.body.classList.remove('has-dialog');
        window.setTimeout(() => backdrop.remove(), 220);
        if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
          previous.focus();
        }
        resolve(result);
      }

      function onKeydown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(false);
          return;
        }
        if (event.key !== 'Tab') {
          return;
        }
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }

      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) {
          close(false);
          return;
        }
        const button = event.target.closest('[data-action]');
        if (button) {
          close(button.dataset.action === 'confirm');
        }
      });
      document.addEventListener('keydown', onKeydown, true);
    });
  }

  function setLoading(button, loading, label) {
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.classList.add('is-loading');
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `${Icon.render('loader', 20)}<span>${escape(label || 'Memproses…')}</span>`;
      return;
    }
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
    button.classList.remove('is-loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }

  function taskUrl(task) {
    return task.url || platform(task.platform).url;
  }

  function openTask(task) {
    const url = taskUrl(task);
    if (!url) {
      return false;
    }
    window.open(url, '_blank', 'noopener');
    return true;
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    area.remove();
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function initPage(active) {
    renderSidebar(active);
    hydrateIcons();
    ensureToastRegion();
  }

  return {
    escape,
    param,
    course,
    platform,
    hydrateIcons,
    statusBadge,
    statusLabel,
    sourceBadge,
    dateBlock,
    deadlineCard,
    renderSidebar,
    toast,
    confirm,
    setLoading,
    taskUrl,
    openTask,
    copyText,
    initPage
  };
})();
