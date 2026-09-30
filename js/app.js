(function () {
  'use strict';

  const STORAGE_KEY = 'lifeboard_journal';

  const PROMPTS = [
    "What made you smile today?",
    "What's something you're grateful for right now?",
    "If you could change one thing about today, what would it be?",
    "What's been on your mind the most lately?",
    "Describe a moment today when you felt truly present.",
    "What's a challenge you're currently facing, and how does it make you feel?",
    "Write about someone who made a difference in your day.",
    "What would your ideal tomorrow look like?",
    "What's something you learned recently that surprised you?",
    "If your current mood were a weather forecast, what would it be?",
    "What's one thing you did today that you're proud of?",
    "Write a letter to your future self, one year from now.",
    "What's a small win you had today that deserves recognition?",
    "How has your energy been today? What affected it?",
    "What's something you've been avoiding, and why?",
    "Describe a place where you feel most at peace.",
    "What boundaries do you need to set or reinforce?",
    "What's a fear you'd like to let go of?",
    "Who do you need to forgive — including yourself?",
    "What does your ideal morning routine look like?"
  ];

  const MOODS = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Frustrated' },
    { emoji: '🤩', label: 'Excited' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '💪', label: 'Productive' },
    { emoji: '⭐', label: 'Memorable' },
    { emoji: '😔', label: 'Bad Day' }
  ];

  // ── State ──
  let entries = [];
  let currentFilter = 'all';
  let currentEntryId = null;
  let editingEntryId = null;
  let selectedMood = null;
  let lastPromptIndex = -1;

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const sidebar = $('#sidebar');
  const detailPanel = $('#detail-panel');
  const entriesList = $('#entries-list');
  const streakEl = $('#streak');

  const viewEntry = $('#view-entry');
  const viewMood = $('#view-mood');
  const viewDate = $('#view-date');
  const viewTitle = $('#view-title');
  const viewText = $('#view-text');
  const viewPin = $('#view-pin');
  const detailEmpty = $('#detail-empty');

  const writeEntry = $('#write-entry');
  const writeHeading = $('#write-heading');
  const entryTitle = $('#entry-title');
  const entryText = $('#entry-text');
  const moodGrid = $('#mood-grid');
  const moodError = $('#mood-error');
  const promptBtn = $('#btn-prompt');
  const promptText = $('#prompt-text');

  const deleteModal = $('#delete-modal');

  // ── Storage ──
  function loadEntries() {
    try {
      entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      entries = [];
    }
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  // ── Streak ──
  function calcStreak() {
    if (entries.length === 0) return 0;

    const daySet = new Set();
    entries.forEach(e => {
      const d = new Date(e.date);
      daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });

    let streak = 0;
    const now = new Date();
    let check = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (!daySet.has(todayKey)) {
      check.setDate(check.getDate() - 1);
      const yesterdayKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (!daySet.has(yesterdayKey)) return 0;
    }

    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (daySet.has(key)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function renderStreak() {
    const s = calcStreak();
    streakEl.textContent = `🔥 ${s}-day streak`;
  }

  // ── Format date ──
  function formatDate(iso) {
    const d = new Date(iso);
    const opts = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    return d.toLocaleDateString('en-US', opts);
  }

  // ── Render entry list ──
  function renderEntries() {
    let filtered = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (currentFilter === 'pinned') {
      filtered = filtered.filter(e => e.pinned);
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(e => e.mood === currentFilter);
    }

    if (filtered.length === 0) {
      entriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>${currentFilter === 'all' ? 'No entries yet. Tap + to start writing!' : 'No entries match this filter.'}</p>
        </div>`;
      return;
    }

    entriesList.innerHTML = filtered.map(e => `
      <div class="entry-card${e.id === currentEntryId ? ' active' : ''}" data-id="${e.id}">
        <div class="card-top">
          <span class="card-mood">${e.mood}</span>
          <span class="card-date">${formatDate(e.date)}</span>
          ${e.pinned ? '<span class="card-pin">★</span>' : ''}
        </div>
        ${e.title ? `<div class="card-title">${escapeHtml(e.title)}</div>` : ''}
        <div class="card-preview">${escapeHtml(e.text)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Navigation ──
  function isMobile() {
    return window.innerWidth < 768;
  }

  function showHome() {
    if (isMobile()) {
      sidebar.classList.add('active');
      detailPanel.classList.remove('active');
    }
    viewEntry.classList.add('hidden');
    writeEntry.classList.add('hidden');
    detailEmpty.classList.remove('hidden');
    currentEntryId = null;
    editingEntryId = null;
    renderEntries();
  }

  function showView(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    currentEntryId = id;
    editingEntryId = null;

    viewMood.textContent = entry.mood;
    viewDate.textContent = formatDate(entry.date);
    viewTitle.textContent = entry.title || '';
    viewTitle.classList.toggle('hidden', !entry.title);
    viewText.textContent = entry.text;
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', !!entry.pinned);

    detailEmpty.classList.add('hidden');
    writeEntry.classList.add('hidden');
    viewEntry.classList.remove('hidden');

    if (isMobile()) {
      sidebar.classList.remove('active');
      detailPanel.classList.add('active');
    }

    renderEntries();
  }

  function showWrite(editId) {
    editingEntryId = editId || null;
    selectedMood = null;
    moodError.classList.add('hidden');
    promptText.classList.add('hidden');

    moodGrid.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));

    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (!entry) return;
      writeHeading.textContent = 'Edit Entry';
      entryTitle.value = entry.title || '';
      entryText.value = entry.text || '';
      selectedMood = entry.mood;
      const moodBtn = moodGrid.querySelector(`[data-mood="${entry.mood}"]`);
      if (moodBtn) moodBtn.classList.add('selected');
    } else {
      writeHeading.textContent = 'New Entry';
      entryTitle.value = '';
      entryText.value = '';
    }

    detailEmpty.classList.add('hidden');
    viewEntry.classList.add('hidden');
    writeEntry.classList.remove('hidden');

    if (isMobile()) {
      sidebar.classList.remove('active');
      detailPanel.classList.add('active');
    }

    entryTitle.focus();
  }

  // ── Event Handlers ──

  // FAB
  $('#fab').addEventListener('click', () => showWrite());

  // Mood selection
  moodGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-option');
    if (!btn) return;
    moodGrid.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    moodError.classList.add('hidden');
  });

  // Prompt
  promptBtn.addEventListener('click', () => {
    let idx;
    do {
      idx = Math.floor(Math.random() * PROMPTS.length);
    } while (idx === lastPromptIndex && PROMPTS.length > 1);
    lastPromptIndex = idx;
    promptText.textContent = PROMPTS[idx];
    promptText.classList.remove('hidden');
  });

  // Save
  $('#btn-save').addEventListener('click', () => {
    if (!selectedMood) {
      moodError.classList.remove('hidden');
      return;
    }

    const title = entryTitle.value.trim();
    const text = entryText.value.trim();

    if (editingEntryId) {
      const entry = entries.find(e => e.id === editingEntryId);
      if (entry) {
        entry.title = title;
        entry.mood = selectedMood;
        entry.text = text;
      }
      saveEntries();
      renderStreak();
      renderEntries();
      showView(editingEntryId);
    } else {
      const newEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title,
        mood: selectedMood,
        text,
        date: new Date().toISOString(),
        pinned: false
      };
      entries.push(newEntry);
      saveEntries();
      renderStreak();
      renderEntries();
      showView(newEntry.id);
    }
  });

  // Edit
  $('#btn-edit').addEventListener('click', () => {
    if (currentEntryId) showWrite(currentEntryId);
  });

  // Pin
  viewPin.addEventListener('click', () => {
    const entry = entries.find(e => e.id === currentEntryId);
    if (!entry) return;
    entry.pinned = !entry.pinned;
    saveEntries();
    viewPin.textContent = entry.pinned ? '★' : '☆';
    viewPin.classList.toggle('pinned', entry.pinned);
    renderEntries();
  });

  // Delete
  $('#btn-delete').addEventListener('click', () => {
    deleteModal.classList.remove('hidden');
  });

  $('#modal-cancel').addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  $('#modal-confirm').addEventListener('click', () => {
    entries = entries.filter(e => e.id !== currentEntryId);
    saveEntries();
    deleteModal.classList.add('hidden');
    renderStreak();
    showHome();
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal.classList.add('hidden');
  });

  // Entry card click
  entriesList.addEventListener('click', (e) => {
    const card = e.target.closest('.entry-card');
    if (!card) return;
    showView(card.dataset.id);
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', showHome);
  });

  // Filter buttons
  document.querySelector('.filter-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderEntries();
  });

  // ── Init ──
  loadEntries();
  renderStreak();
  renderEntries();
})();
