const Format = (() => {
  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAY_MS = 86400000;
  const HOUR_MS = 3600000;

  function toDate(value) {
    return value instanceof Date ? new Date(value.getTime()) : new Date(value);
  }

  function isValid(value) {
    if (!value) {
      return false;
    }
    return !Number.isNaN(toDate(value).getTime());
  }

  function now() {
    return new Date(KumpulinData.simulatedNow);
  }

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function time(value) {
    const date = toDate(value);
    return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
  }

  function shortDate(value) {
    const date = toDate(value);
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }

  function longDate(value) {
    const date = toDate(value);
    return `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }

  function dateTime(value) {
    return `${shortDate(value)}, ${time(value)}`;
  }

  function dayShort(value) {
    return DAYS[toDate(value).getDay()].toUpperCase();
  }

  function monthShort(value) {
    return MONTHS[toDate(value).getMonth()];
  }

  function startOfDay(value) {
    const date = toDate(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function daysUntil(value) {
    return Math.round((startOfDay(value) - startOfDay(now())) / DAY_MS);
  }

  function relative(value) {
    if (!isValid(value)) {
      return 'Tanggal belum diisi';
    }
    const days = daysUntil(value);
    if (days === 0) {
      return 'Hari ini';
    }
    if (days === 1) {
      return 'Besok';
    }
    if (days > 1) {
      return `${days} hari lagi`;
    }
    return `Lewat ${Math.abs(days)} hari`;
  }

  function urgency(value) {
    if (!isValid(value)) {
      return 'neutral';
    }
    const days = daysUntil(value);
    if (days <= 1) {
      return 'danger';
    }
    if (days <= 3) {
      return 'warning';
    }
    return 'neutral';
  }

  function toInputValue(value) {
    const date = toDate(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function toIso(value) {
    return `${toInputValue(value)}:00`;
  }

  function fileName(task) {
    const user = KumpulinData.user;
    return String(task.fileName || '')
      .replace(/\{nim\}/g, user.nim)
      .replace(/\{firstName\}/g, user.firstName);
  }

  function fillTemplate(text, task) {
    return String(text).replace(/\{file\}/g, fileName(task));
  }

  function shortUrl(value) {
    try {
      const url = new URL(value);
      const text = `${url.host}${url.pathname}${url.search}`;
      return text.length > 48 ? `${text.slice(0, 47)}…` : text;
    } catch (error) {
      return String(value || '');
    }
  }

  function reminderTimes(value, kind) {
    const due = toDate(value);
    const dayBefore = toDate(value);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(19, 0, 0, 0);
    const list = [{ at: dayBefore, label: 'H-1 pukul 19.00' }];
    if (kind !== 'exam') {
      list.push({ at: new Date(due.getTime() - 3 * HOUR_MS), label: '3 jam sebelum tenggat' });
    }
    return list;
  }

  return {
    MONTHS_LONG,
    DAYS_LONG,
    isValid,
    now,
    time,
    shortDate,
    longDate,
    dateTime,
    dayShort,
    monthShort,
    daysUntil,
    relative,
    urgency,
    toInputValue,
    toIso,
    fileName,
    fillTemplate,
    shortUrl,
    reminderTimes
  };
})();
