// ================================================
// Fix the Paragraph — app.js
// ================================================

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCRcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TEACHER_PIN = '9999';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91jUOTkXuSJJWiWMEHQ/exec';

let activities = [];
let currentActivity = null;
let studentName = '';
let attemptNumber = 0;
let sessionStart = Date.now();
let trackingRows = [];

const nameModal = document.getElementById('name-modal');
const hintModal = document.getElementById('hint-modal');
const studentNameInput = document.getElementById('student-name');
const startBtn = document.getElementById('start-btn');
const hintText = document.getElementById('hint-text');
const hintCloseBtn = document.getElementById('hint-close-btn');

const tabStudent = document.getElementById('tab-student');
const tabTeacher = document.getElementById('tab-teacher');
const viewStudent = document.getElementById('view-student');
const viewTeacher = document.getElementById('view-teacher');

const gameTitle = document.getElementById('game-title');
const gameInstructions = document.getElementById('game-instructions');
const playerNameDisplay = document.getElementById('player-name-display');
const attemptDisplay = document.getElementById('attempt-display');
const previewText = document.getElementById('preview-text');
const slotsContainer = document.getElementById('slots-container');
const poolContainer = document.getElementById('pool-container');
const checkBtn = document.getElementById('check-btn');
const hintBtn = document.getElementById('hint-btn');
const resetBtn = document.getElementById('reset-btn');
const feedbackBox = document.getElementById('feedback-box');

const teacherPinGate = document.getElementById('teacher-pin-gate');
const teacherDashboard = document.getElementById('teacher-dashboard');
const pinInput = document.getElementById('pin-input');
const pinSubmitBtn = document.getElementById('pin-submit-btn');
const pinError = document.getElementById('pin-error');

const ttabResults = document.getElementById('ttab-results');
const ttabCreate = document.getElementById('ttab-create');
const tviewResults = document.getElementById('tview-results');
const tviewCreate = document.getElementById('tview-create');

const statAttempts = document.getElementById('stat-attempts');
const statCorrect = document.getElementById('stat-correct');
const statIncorrect = document.getElementById('stat-incorrect');
const resultsTbody = document.getElementById('results-tbody');
const noResultsMsg = document.getElementById('no-results-msg');
const resetSessionBtn = document.getElementById('reset-session-btn');

const csvUrlInput = document.getElementById('csv-url-input');
const reloadCsvBtn = document.getElementById('reload-csv-btn');
const csvReloadMsg = document.getElementById('csv-reload-msg');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  }).filter(r => r['Game_ID']);
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function rowToActivity(row) {
  const sentences = [];
  for (let i = 1; i <= 20; i++) {
    const s = row[`Sentence_${i}`];
    if (s) sentences.push(s);
  }
  return {
    id: row['Game_ID'],
    title: row['Title'] || 'Fix the Paragraph',
    instructions: row['Instructions'] || 'Drag the sentences into the correct order.',
    sentences,
    hint: row['Hint'] || '',
    ifPerfectGoTo: row['If_Perfect_Go_To'] || '',
    ifStuckGoTo: row['If_Stuck_Go_To'] || '',
  };
}

async function loadActivities(url) {
  const fetchUrl = url || CSV_URL;
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('Network error');
    const text = await res.text();
    const rows = parseCSV(text);
    activities = rows.map(rowToActivity).filter(a => a.sentences.length > 0);
    return true;
  } catch (e) {
    console.error('Failed to load CSV:', e);
    return false;
  }
}

function getActivityById(id) {
  return activities.find(a => a.id === id) || activities[0] || null;
}

function getActivityFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('game') || null;
}

async function init() {
  await loadActivities();
  const gameId = getActivityFromURL();
  currentActivity = gameId ? getActivityById(gameId) : (activities[0] || null);
  showNameModal();
}

function showNameModal() {
  nameModal.classList.remove('hidden');
  studentNameInput.focus();
}

function hideNameModal() {
  nameModal.classList.add('hidden');
}

startBtn.addEventListener('click', () => {
  const name = studentNameInput.value.trim();
  if (!name) { studentNameInput.focus(); return; }
  studentName = name;
  hideNameModal();
  startGame();
});

studentNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') startBtn.click();
});

function startGame() {
  if (!currentActivity) {
    feedbackBox.textContent = 'No activity loaded. Please check the CSV URL in Teacher settings.';
    feedbackBox.className = 'feedback-box feedback-warn';
    feedbackBox.classList.remove('hidden');
    return;
  }
  attemptNumber++;
  playerNameDisplay.textContent = studentName;
  attemptDisplay.textContent = `Attempt ${attemptNumber}`;
  gameTitle.textContent = currentActivity.title;
  gameInstructions.textContent = currentActivity.instructions;
  feedbackBox.classList.add('hidden');
  feedbackBox.textContent = '';
  buildBoard();
  updatePreview();
}

let draggedCard = null;
let dragSource = null;
let selectedCard = null;

function buildBoard() {
  slotsContainer.innerHTML = '';
  poolContainer.innerHTML = '';
  selectedCard = null;

  const shuffled = [...currentActivity.sentences].sort(() => Math.random() - 0.5);

  currentActivity.sentences.forEach((_, i) => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.index = i;
    slot.setAttribute('aria-label', `Slot ${i + 1}`);
    addSlotListeners(slot);
    slotsContainer.appendChild(slot);
  });

  shuffled.forEach(sentence => {
    poolContainer.appendChild(createCard(sentence));
  });
}

function createCard(sentence) {
  const card = document.createElement('div');
  card.className = 'part-card';
  card.draggable = true;
  card.textContent = sentence;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  addCardListeners(card);
  return card;
}

function addCardListeners(card) {
  card.addEventListener('dragstart', e => {
    draggedCard = card;
    dragSource = card.parentElement;
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => {
    draggedCard = null;
    dragSource = null;
  });
  card.addEventListener('click', () => handleCardClick(card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(card); }
  });
}

function handleCardClick(card) {
  if (selectedCard === null) {
    selectedCard = card;
    card.classList.add('selected');
    return;
  }
  if (selectedCard === card) {
    card.classList.remove('selected');
    selectedCard = null;
    return;
  }

  const target = card.parentElement;
  const srcParent = selectedCard.parentElement;

  if (target.classList.contains('drop-slot')) {
    const existing = target.querySelector('.part-card');
    if (existing) { srcParent.appendChild(existing); }
    target.appendChild(selectedCard);
  } else if (target === poolContainer) {
    poolContainer.appendChild(selectedCard);
  } else {
    selectedCard.classList.remove('selected');
    selectedCard = card;
    card.classList.add('selected');
    return;
  }

  selectedCard.classList.remove('selected');
  selectedCard = null;
  updatePreview();
}

function addSlotListeners(slot) {
  slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('slot-drag-over'); });
  slot.addEventListener('dragleave', () => slot.classList.remove('slot-drag-over'));
  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('slot-drag-over');
    if (!draggedCard) return;
    const existing = slot.querySelector('.part-card');
    if (existing && existing !== draggedCard) { dragSource.appendChild(existing); }
    slot.appendChild(draggedCard);
    updatePreview();
  });
  slot.addEventListener('click', () => {
    if (selectedCard && !slot.querySelector('.part-card')) {
      slot.appendChild(selectedCard);
      selectedCard.classList.remove('selected');
      selectedCard = null;
      updatePreview();
    }
  });
}

poolContainer.addEventListener('dragover', e => e.preventDefault());
poolContainer.addEventListener('drop', e => {
  e.preventDefault();
  if (!draggedCard) return;
  poolContainer.appendChild(draggedCard);
  updatePreview();
});

function updatePreview() {
  const slots = slotsContainer.querySelectorAll('.drop-slot');
  const parts = [];
  slots.forEach(slot => {
    const card = slot.querySelector('.part-card');
    parts.push(card ? card.textContent : '___');
  });
  previewText.textContent = parts.join(' ');
}

checkBtn.addEventListener('click', checkAnswer);

function checkAnswer() {
  if (!currentActivity) return;
  const slots = Array.from(slotsContainer.querySelectorAll('.drop-slot'));
  const answers = slots.map(s => { const c = s.querySelector('.part-card'); return c ? c.textContent : ''; });

  if (!answers.every(a => a !== '')) {
    showFeedback('Please fill all slots before checking.', 'warn');
    return;
  }

  const correct = currentActivity.sentences;
  const correctCount = answers.filter((a, i) => a === correct[i]).length;
  const isPerfect = correctCount === correct.length;
  const status = isPerfect ? 'Correct' : 'Incorrect';
  const details = `${correctCount}/${correct.length} correct`;

  track(studentName, currentActivity.id, attemptNumber, status, details);
  recordResult(studentName, currentActivity.id, attemptNumber, status, details);

  if (isPerfect) {
    showFeedback(`✅ Perfect! All ${correct.length} sentences in the right order.`, 'success');
    if (currentActivity.ifPerfectGoTo) {
      setTimeout(() => navigateTo(currentActivity.ifPerfectGoTo), 2000);
    }
  } else {
    showFeedback(`❌ ${details}. Keep trying!`, 'error');
    if (attemptNumber >= 3 && currentActivity.ifStuckGoTo) {
      setTimeout(() => navigateTo(currentActivity.ifStuckGoTo), 2000);
    }
  }
}

function navigateTo(gameId) {
  const activity = getActivityById(gameId);
  if (!activity) return;
  currentActivity = activity;
  attemptNumber = 0;
  startGame();
}

hintBtn.addEventListener('click', () => {
  if (!currentActivity || !currentActivity.hint) return;
  hintText.textContent = currentActivity.hint;
  hintModal.classList.remove('hidden');
  hintCloseBtn.focus();
});

hintCloseBtn.addEventListener('click', () => {
  hintModal.classList.add('hidden');
});

resetBtn.addEventListener('click', () => {
  buildBoard();
  updatePreview();
  feedbackBox.classList.add('hidden');
});

function showFeedback(msg, type) {
  feedbackBox.textContent = msg;
  feedbackBox.className = `feedback-box feedback-${type}`;
  feedbackBox.classList.remove('hidden');
}

tabStudent.addEventListener('click', () => {
  tabStudent.classList.add('tab-active');
  tabStudent.setAttribute('aria-selected', 'true');
  tabTeacher.classList.remove('tab-active');
  tabTeacher.setAttribute('aria-selected', 'false');
  viewStudent.classList.remove('hidden');
  viewTeacher.classList.add('hidden');
});

tabTeacher.addEventListener('click', () => {
  tabTeacher.classList.add('tab-active');
  tabTeacher.setAttribute('aria-selected', 'true');
  tabStudent.classList.remove('tab-active');
  tabStudent.setAttribute('aria-selected', 'false');
  viewTeacher.classList.remove('hidden');
  viewStudent.classList.add('hidden');
  teacherPinGate.classList.remove('hidden');
  teacherDashboard.classList.add('hidden');
  pinInput.value = '';
  pinError.classList.add('hidden');
});

pinSubmitBtn.addEventListener('click', checkPin);
pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkPin(); });

function checkPin() {
  if (pinInput.value === TEACHER_PIN) {
    teacherPinGate.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    refreshDashboard();
  } else {
    pinError.classList.remove('hidden');
    pinInput.value = '';
    pinInput.focus();
  }
}

ttabResults.addEventListener('click', () => {
  ttabResults.classList.add('tab-active');
  ttabCreate.classList.remove('tab-active');
  tviewResults.classList.remove('hidden');
  tviewCreate.classList.add('hidden');
});

ttabCreate.addEventListener('click', () => {
  ttabCreate.classList.add('tab-active');
  ttabResults.classList.remove('tab-active');
  tviewCreate.classList.remove('hidden');
  tviewResults.classList.add('hidden');
});

resetSessionBtn.addEventListener('click', () => {
  if (confirm('Reset session? This will clear all results shown for this session.')) {
    sessionStart = Date.now();
    refreshDashboard();
  }
});

function track(name, gameId, attempt, status, details) {
  if (typeof InteractivesTelemetry !== 'undefined') {
    try { InteractivesTelemetry.track({ name, gameId, attempt, status, details }); } catch(e) {}
  }
  fetch(TRACKING_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Timestamp: new Date().toISOString(),
      Name: name, Game_ID: gameId, Attempt: attempt, Status: status, Details: details
    })
  }).catch(() => {});
}

function recordResult(name, gameId, attempt, status, details) {
  trackingRows.push({ timestamp: Date.now(), name, gameId, attempt, status, details });
}

function refreshDashboard() {
  const rows = trackingRows.filter(r => r.timestamp >= sessionStart);
  const correct = rows.filter(r => r.status === 'Correct').length;
  const wrong = rows.filter(r => r.status === 'Incorrect').length;

  statAttempts.textContent = rows.length;
  statCorrect.textContent = correct;
  statIncorrect.textContent = wrong;

  resultsTbody.innerHTML = '';
  if (rows.length === 0) {
    noResultsMsg.classList.remove('hidden');
  } else {
    noResultsMsg.classList.add('hidden');
    rows.slice().reverse().forEach(r => {
      const tr = document.createElement('tr');
      const time = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.gameId}</td>
        <td>${r.attempt}</td>
        <td><span class="badge ${r.status === 'Correct' ? 'badge-success' : 'badge-warn'}">${r.status}</span></td>
        <td>${time}</td>`;
      resultsTbody.appendChild(tr);
    });
  }
}

reloadCsvBtn.addEventListener('click', async () => {
  const url = csvUrlInput.value.trim();
  if (!url) { showCsvMsg('Please enter a CSV URL.', 'error'); return; }
  showCsvMsg('Loading…', '');
  const ok = await loadActivities(url);
  if (ok) {
    showCsvMsg(`✅ Loaded ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}.`, 'success');
  } else {
    showCsvMsg('❌ Failed to load. Check the URL and try again.', 'error');
  }
});

function showCsvMsg(msg, type) {
  csvReloadMsg.textContent = msg;
  csvReloadMsg.className = `csv-msg${type ? ' csv-msg-' + type : ''}`;
  csvReloadMsg.classList.remove('hidden');
}

init();
