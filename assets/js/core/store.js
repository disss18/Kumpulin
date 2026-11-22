const Store = (() => {
  const KEY = 'kumpulin-state-v2';
  let state = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function seed() {
    return {
      tasks: clone(KumpulinData.tasks),
      exams: clone(KumpulinData.exams),
      checklists: {},
      reminders: { deadline: true, exam: true, email: false }
    };
  }

  function load() {
    if (state) {
      return state;
    }
    const base = seed();
    try {
      const raw = window.localStorage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : null;
      state = saved && Array.isArray(saved.tasks) ? Object.assign(base, saved) : base;
    } catch (error) {
      state = base;
    }
    return state;
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  }

  function getTasks() {
    return clone(load().tasks);
  }

  function getTask(id) {
    const task = load().tasks.find((item) => item.id === id);
    return task ? clone(task) : null;
  }

  function getDefaultTask() {
    const tasks = load().tasks;
    const open = tasks
      .filter((task) => task.status === 'belum' || task.status === 'revisi')
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    const task = open[0] || tasks[0];
    return task ? clone(task) : null;
  }

  function updateTask(id, patch) {
    const task = load().tasks.find((item) => item.id === id);
    if (!task) {
      return null;
    }
    Object.assign(task, patch);
    save();
    return clone(task);
  }

  function addTask(task) {
    const item = Object.assign({ id: createId('tugas'), status: 'belum', rules: [], checklist: [] }, task);
    load().tasks.push(item);
    save();
    return clone(item);
  }

  function getExams() {
    return clone(load().exams);
  }

  function addExam(exam) {
    const item = Object.assign({ id: createId('ujian'), note: '' }, exam);
    load().exams.push(item);
    save();
    return clone(item);
  }

  function getChecklist(taskId, length) {
    const saved = load().checklists[taskId] || [];
    return Array.from({ length }, (_, index) => Boolean(saved[index]));
  }

  function setChecklistItem(taskId, index, checked) {
    const lists = load().checklists;
    const list = lists[taskId] || [];
    list[index] = checked;
    lists[taskId] = list;
    save();
  }

  function getReminders() {
    return clone(load().reminders);
  }

  function setReminder(key, value) {
    load().reminders[key] = value;
    save();
  }

  function reset() {
    state = seed();
    try {
      window.localStorage.removeItem(KEY);
    } catch (error) {
      state = seed();
    }
  }

  return {
    getTasks,
    getTask,
    getDefaultTask,
    updateTask,
    addTask,
    getExams,
    addExam,
    getChecklist,
    setChecklistItem,
    getReminders,
    setReminder,
    reset
  };
})();
