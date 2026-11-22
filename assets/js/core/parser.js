const MessageParser = (() => {
  const MONTHS = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, agt: 7, ags: 7,
    september: 8, sept: 8, sep: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    desember: 11, des: 11
  };

  const DAYS = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, "jum'at": 5, sabtu: 6 };

  const MONTH_DATE = /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|sept|jan|feb|mar|apr|jun|jul|agu|agt|ags|sep|okt|nov|des)\b\.?(?:\s+(\d{4}))?/i;
  const NUMERIC_DATE = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/;
  const DAY_NAME = /\b(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\b/i;
  const TIME_WORD = /(?:pukul|pkl\.?|jam)\s*(\d{1,2})(?:[.:](\d{2}))?/i;
  const TIME_ZONE = /\b(\d{1,2})[.:](\d{2})\s*(?:wib|wita|wit)\b/i;
  const RULE_WORDS = /(wajib|harus|format|nama file|tidak (?:dinilai|diterima)|jangan|maksimal|minimal|maks\b|draw\.io|telat|terlambat|lampir|bawa)/i;
  const EXAM_WORDS = /\b(utp|uap|ujian|kuis|quiz)\b/i;
  const LINK = /https?:\/\/[^\s<>"']+/i;

  function addDays(date, amount) {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + amount);
    return next;
  }

  function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  function hasDateHint(text) {
    return MONTH_DATE.test(text) || NUMERIC_DATE.test(text) || /\b(besok|lusa)\b/i.test(text) || DAY_NAME.test(text);
  }

  function detectType(text) {
    if (EXAM_WORDS.test(text)) {
      return 'ujian';
    }
    if (hasDateHint(text)) {
      return 'tenggat';
    }
    if (RULE_WORDS.test(text)) {
      return 'aturan';
    }
    return 'tenggat';
  }

  function detectCourse(text) {
    const found = KumpulinData.courses.find((course) => course.keywords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text)));
    return found ? found.id : '';
  }

  function detectPlatform(text) {
    if (/classroom/i.test(text)) {
      return 'classroom';
    }
    if (/\be-?ling\b/i.test(text)) {
      return 'eling';
    }
    return '';
  }

  function detectUrl(text) {
    const match = text.match(LINK);
    return match ? match[0].replace(/[.,;:!?)]+$/, '') : '';
  }

  function detectDate(text, type) {
    const base = Format.now();
    const named = text.match(MONTH_DATE);
    const numeric = text.match(NUMERIC_DATE);
    let date = null;
    let hasYear = false;

    if (named) {
      hasYear = Boolean(named[3]);
      date = new Date(hasYear ? Number(named[3]) : base.getFullYear(), MONTHS[named[2].toLowerCase()], Number(named[1]));
    } else if (numeric && Number(numeric[2]) >= 1 && Number(numeric[2]) <= 12) {
      hasYear = Boolean(numeric[3]);
      const rawYear = hasYear ? Number(numeric[3]) : base.getFullYear();
      date = new Date(rawYear < 100 ? 2000 + rawYear : rawYear, Number(numeric[2]) - 1, Number(numeric[1]));
    } else if (/\bbesok\b/i.test(text)) {
      date = addDays(base, 1);
    } else if (/\blusa\b/i.test(text)) {
      date = addDays(base, 2);
    } else if (/\b(hari ini|nanti malam)\b/i.test(text)) {
      date = addDays(base, 0);
    } else {
      const day = text.match(DAY_NAME);
      if (day) {
        const difference = (DAYS[day[1].toLowerCase()] - base.getDay() + 7) % 7 || 7;
        date = addDays(base, difference);
      }
    }

    if (!date || Number.isNaN(date.getTime())) {
      return null;
    }
    if (!hasYear && date < addDays(base, -60)) {
      date.setFullYear(date.getFullYear() + 1);
    }

    const time = text.match(TIME_WORD) || text.match(TIME_ZONE);
    let hours = type === 'ujian' ? 8 : 23;
    let minutes = type === 'ujian' ? 0 : 59;
    if (time && Number(time[1]) < 24) {
      hours = Number(time[1]);
      minutes = time[2] ? Math.min(Number(time[2]), 59) : 0;
    }
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function detectModule(text) {
    const match = text.match(/modul\s*(\d{1,2})/i);
    return match ? Number(match[1]) : null;
  }

  function detectTitle(text, type, courseId) {
    if (type === 'ujian') {
      const kind = text.match(/\b(utp|uap|kuis|quiz)\b/i);
      const label = kind ? kind[1].toUpperCase() : 'Ujian';
      const course = KumpulinData.courses.find((item) => item.id === courseId);
      return course ? `${label} Praktikum ${course.name}` : `${label} Praktikum`;
    }
    const moduleNumber = detectModule(text);
    if (!moduleNumber) {
      return '';
    }
    let kind = 'Laprak';
    if (/\b(lk|lembar kerja)\b/i.test(text)) {
      kind = 'LK';
    } else if (/\b(tp|tugas pendahuluan)\b/i.test(text)) {
      kind = 'TP';
    }
    const topic = text.match(/modul\s*\d{1,2}\s*[:–-]\s*([A-Za-z][A-Za-z0-9 &]*?)(?=\s+(?:dikumpul\w*|deadline|paling|di|ya|wajib|harus|sampai)\b|[.,!\n]|$)/i);
    return `${kind} Modul ${moduleNumber}${topic ? `: ${topic[1].trim()}` : ''}`;
  }

  function detectFileName(text) {
    const match = text.match(/\b([A-Z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+)(\.(?:pdf|docx|zip))?/);
    if (!match) {
      return '';
    }
    const extension = match[2] || (/\b(docx|word)\b/i.test(text) ? '.docx' : '.pdf');
    return `${match[1]}${extension}`;
  }

  function detectPlace(text) {
    const match = text.match(/\b((?:lab(?:oratorium)?|ruang)\s+[^,.\n]+(?:,\s*gedung\s+[A-Za-z0-9]+)?)/i) || text.match(/\b(gedung\s+[A-Za-z0-9]+)/i);
    return match ? capitalize(match[1].trim()) : '';
  }

  function cleanSentence(sentence) {
    let text = sentence.trim().replace(/[.!?]+$/, '').replace(/\s+(ya+|yah|guys|teman-teman)$/i, '').trim();
    if (text.length > 120) {
      text = `${text.slice(0, 117).trim()}…`;
    }
    return capitalize(text);
  }

  function detectRules(text) {
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    const rules = [];
    sentences.forEach((sentence) => {
      if (!RULE_WORDS.test(sentence)) {
        return;
      }
      const cleaned = cleanSentence(sentence);
      if (cleaned && !rules.includes(cleaned)) {
        rules.push(cleaned);
      }
    });
    return rules.slice(0, 5);
  }

  function classifyRule(text) {
    const important = /(wajib|harus|jangan|tidak (?:dinilai|diterima))/i.test(text);
    if (/(telat|terlambat|tidak diterima)/i.test(text)) {
      return { kind: 'late', label: 'Keterlambatan', value: text, important: true };
    }
    if (/(format|pdf|docx|nama file|nama\s+[A-Z]+_)/i.test(text)) {
      return { kind: 'format', label: 'Format file', value: text, important };
    }
    if (/(draw\.io|diagram)/i.test(text)) {
      return { kind: 'diagram', label: 'Diagram', value: text, important };
    }
    if (/(lampir|zip|\.pkt)/i.test(text)) {
      return { kind: 'attachment', label: 'Lampiran', value: text, important };
    }
    if (/(bawa|datang|kartu)/i.test(text)) {
      return { kind: 'note', label: 'Catatan', value: text, important };
    }
    return { kind: 'note', label: 'Aturan', value: text, important };
  }

  function parse(raw) {
    const text = String(raw || '').trim();
    const type = detectType(text);
    const courseId = detectCourse(text);
    return {
      type,
      courseId,
      platform: detectPlatform(text),
      due: type === 'aturan' ? null : detectDate(text, type),
      module: detectModule(text),
      title: detectTitle(text, type, courseId),
      fileName: type === 'tenggat' ? detectFileName(text) : '',
      url: type === 'tenggat' ? detectUrl(text) : '',
      place: type === 'ujian' ? detectPlace(text) : '',
      rules: detectRules(text)
    };
  }

  return { parse, classifyRule };
})();
