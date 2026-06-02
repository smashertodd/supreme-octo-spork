Yes, `Ctrl + Shift + R` is a hard refresh.

And **YES!** Downloading them and opening them is exactly what is causing the problem! Here is why:

1. **The HTML trap:** When you double-click the downloaded `index.html`, Windows opens it in your web browser (like Chrome or Edge) so you can *view* the web page. If you press Ctrl+A and copy text straight from the webpage screen, it strips away all the hidden HTML code (which is why your file just started with the plain text "Fix the Paragraph"). 
2. **The JS/CSS trap:** When you open the `.js` and `.css` files, whatever program Windows is using is applying "rich text formatting" to it (like Microsoft Word does). It changes standard straight quotes (`'`) into smart curly quotes (`‘`), it deletes backticks, and it combines double dashes (`--`) into long dashes (`—`). Code requires plain, unformatted text to run!

### The bulletproof solution:

Let's bypass downloading entirely. I have put the raw code for all three files in the black boxes below.

**Do NOT highlight the text with your mouse.** Instead, click the little **"Copy code"** button that appears in the top-right corner of each black box. This copies the raw, unformatted code directly to your clipboard.

Paste each one directly into GitHub, commit, and then do your hard refresh.

***

### 1. index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fix the Paragraph</title>
  <link rel="stylesheet" href="style.css">
  <script src="app.js" defer></script>
</head>
<body>
  <!-- Modals -->
  <div class="modal-backdrop" id="name-modal">
    <div class="modal-box">
      <h2 class="modal-heading">Fix the Paragraph</h2>
      <p class="modal-subtext">Enter your name to begin.</p>
      <input id="student-name" type="text" placeholder="Your name..." class="text-input" aria-label="Student name" />
      <button id="start-btn" class="btn-primary btn-full">Start</button>
    </div>
  </div>

  <div class="modal-backdrop hidden" id="hint-modal">
    <div class="modal-box">
      <h2 class="modal-heading">💡 Hint</h2>
      <p id="hint-text" class="modal-subtext"></p>
      <button id="hint-close-btn" class="btn-primary btn-full">Got it!</button>
    </div>
  </div>

  <div class="app-wrapper">
    <!-- Tabs -->
    <div class="tab-bar" role="tablist">
      <button id="tab-student" role="tab" aria-selected="true" class="tab-btn tab-active">📝 Student</button>
      <button id="tab-teacher" role="tab" aria-selected="false" class="tab-btn">🔒 Teacher</button>
    </div>

    <!-- Student View -->
    <div id="view-student">
      <div class="view-header">
        <div>
          <h1 id="game-title" class="game-title">Fix the Paragraph</h1>
          <p id="game-instructions" class="game-instructions"></p>
        </div>
        <div class="player-info">
          <span id="player-name-display"></span><br/>
          <span id="attempt-display"></span>
        </div>
      </div>

      <div class="preview-panel">
        <p class="section-label">Live Preview</p>
        <p id="preview-text" class="preview-text"></p>
      </div>

      <div class="section-block">
        <p class="section-label">Arrange the sentences</p>
        <div id="slots-container" class="slots-container"></div>
      </div>

      <div class="section-block">
        <p class="section-label">Sentence pool</p>
        <div id="pool-container" class="pool-container"></div>
      </div>

      <div class="btn-row">
        <button id="check-btn" class="btn-primary">✅ Check</button>
        <button id="hint-btn" class="btn-secondary">💡 Hint</button>
        <button id="reset-btn" class="btn-ghost">🔄 Reset</button>
      </div>

      <div id="feedback-box" class="hidden feedback-box" role="alert" aria-live="polite"></div>
    </div>

    <!-- Teacher View -->
    <div id="view-teacher" class="hidden">
      <div id="teacher-pin-gate">
        <div class="pin-card">
          <h2 class="modal-heading">Teacher Access</h2>
          <p class="modal-subtext">Enter the PIN to continue.</p>
          <input id="pin-input" type="password" maxlength="4" placeholder="••••" class="text-input pin-input" aria-label="Teacher PIN" />
          <button id="pin-submit-btn" class="btn-primary btn-full">Unlock</button>
          <p id="pin-error" class="error-msg hidden">Incorrect PIN. Try again.</p>
        </div>
      </div>

      <div id="teacher-dashboard" class="hidden">
        <div class="view-header">
          <h2 class="modal-heading">Teacher Dashboard</h2>
          <button id="reset-session-btn" class="btn-ghost btn-sm">🗑️ Reset Session</button>
        </div>
        
        <div class="tab-bar">
          <button id="ttab-results" class="tab-btn tab-active tab-sm">📊 Results</button>
          <button id="ttab-create" class="tab-btn tab-sm">➕ Create Activity</button>
        </div>

        <div id="tview-results">
          <div class="stats-grid">
            <div class="stat-card">
              <p class="stat-num" id="stat-attempts">0</p>
              <p class="stat-label">Attempts</p>
            </div>
            <div class="stat-card">
              <p class="stat-num stat-green" id="stat-correct">0</p>
              <p class="stat-label">Correct</p>
            </div>
            <div class="stat-card">
              <p class="stat-num stat-red" id="stat-incorrect">0</p>
              <p class="stat-label">Incorrect</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="results-table" aria-label="Student results">
              <thead>
                <tr><th>Name</th><th>Activity</th><th>Attempt</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody id="results-tbody"></tbody>
            </table>
          </div>
          <p id="no-results-msg" class="no-results-msg">No attempts yet this session.</p>
        </div>

        <div id="tview-create" class="hidden">
          <div class="create-card">
            <h3 class="section-heading">Create / Edit Activity</h3>
            <p class="modal-subtext">Edit your Google Sheet directly, then paste the published CSV URL below and click Reload.</p>
            <label class="field-label" for="csv-url-input">Published CSV URL</label>
            <input id="csv-url-input" type="url" placeholder="https://docs.google.com/..." class="text-input" />
            <button id="reload-csv-btn" class="btn-primary">🔄 Reload Activities</button>
            <p id="csv-reload-msg" class="csv-msg hidden"></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

### 2. style.css
```css
:root {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --success: #10b981;
  --danger: #ef4444;
  --warn-bg: #fef3c7;
  --warn-text: #92400e;
  --bg: #f3f4f6;
  --surface: #ffffff;
  --border: #e5e7eb;
  --text: #1f2937;
  --muted: #6b7280;
}
*, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-backdrop.hidden { display: none; }
.modal-box { background: white; border-radius: 16px; padding: 40px 36px; max-width: 420px; width: 92%; box-shadow: 0 25px 50px rgba(0,0,0,0.2); text-align: center; display: flex; flex-direction: column; gap: 12px; }

.modal-heading { font-size: 22px; font-weight: 700; color: var(--text); }
.modal-subtext { color: var(--muted); font-size: 15px; line-height: 1.5; }
.section-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
.section-heading { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.game-title { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.game-instructions { color: var(--muted); font-size: 14px; }

.text-input { width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; outline: none; transition: border-color 0.2s; font-family: inherit; }
.text-input:focus { border-color: var(--primary); }
.pin-input { text-align: center; letter-spacing: 6px; font-size: 22px; }

.btn-primary, .btn-secondary, .btn-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 11px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s; font-family: inherit; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: var(--warn-bg); color: var(--warn-text); border: 2px solid #fbbf24; }
.btn-secondary:hover { background: #fde68a; }
.btn-ghost { background: transparent; color: var(--muted); border: 2px solid var(--border); }
.btn-ghost:hover { border-color: var(--primary); color: var(--primary); }
.btn-full { width: 100%; }
.btn-sm { padding: 7px 16px; font-size: 13px; }

.app-wrapper { max-width: 860px; margin: 0 auto; padding: 24px 20px; }

.tab-bar { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--border); padding-bottom: 0; }
.tab-btn { padding: 10px 22px; font-size: 15px; font-weight: 600; cursor: pointer; background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -2px; color: var(--muted); transition: color 0.2s, border-color 0.2s; font-family: inherit; }
.tab-btn:hover { color: var(--primary); }
.tab-active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-sm { padding: 8px 16px; font-size: 13px; }

.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
.player-info { font-size: 13px; color: var(--muted); background: var(--border); padding: 8px 14px; border-radius: 20px; text-align: right; white-space: nowrap; }

.preview-panel { background: white; border: 2px solid var(--border); border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.preview-text { font-size: 17px; line-height: 2; color: #111827; min-height: 36px; }

.section-block { margin-bottom: 24px; }
.slots-container { display: flex; flex-direction: column; gap: 8px; }
.drop-slot { min-height: 58px; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 6px; display: flex; align-items: center; transition: border-color 0.2s, background 0.2s; }
.drop-slot.slot-drag-over { border-color: var(--primary); background: #eef2ff; }

.pool-container { background: white; border: 2px solid var(--border); border-radius: 10px; padding: 20px; min-height: 80px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.part-card { background: white; border: 2px solid #e5e7eb; padding: 10px 16px; border-radius: 8px; cursor: grab; font-size: 15px; user-select: none; box-shadow: 0 2px 6px rgba(0,0,0,0.07); transition: transform 0.12s, box-shadow 0.12s, border-color 0.2s; }
.part-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-1px); }
.part-card:active { cursor: grabbing; }
.part-card.selected { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.2); }
.drop-slot .part-card { width: 100%; cursor: grab; }

.btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }

.feedback-box { padding: 14px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-top: 8px; }
.feedback-success { background: #d1fae5; color: #065f46; border: 2px solid #34d399; }
.feedback-error { background: #fee2e2; color: #991b1b; border: 2px solid #f87171; }
.feedback-warn { background: var(--warn-bg); color: var(--warn-text); border: 2px solid #fbbf24; }

.hidden { display: none !important; }
.error-msg { color: var(--danger); font-size: 14px; margin-top: 4px; }

.pin-card { max-width: 360px; margin: 40px auto; background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 12px; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { background: white; border: 2px solid var(--border); border-radius: 10px; padding: 16px; text-align: center; }
.stat-num { font-size: 32px; font-weight: 800; color: #7c3aed; }
.stat-green { color: var(--success); }
.stat-red { color: var(--danger); }
.stat-label { font-size: 13px; color: var(--muted); margin-top: 2px; }

.table-wrap { overflow-x: auto; border-radius: 8px; border: 2px solid var(--border); margin-bottom: 16px; }
.results-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.results-table th { background: #f9fafb; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid var(--border); }
.results-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--text); }
.results-table tr:last-child td { border-bottom: none; }

.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warn { background: #fef3c7; color: #92400e; }

.no-results-msg { text-align: center; color: var(--muted); font-size: 14px; padding: 20px; }

.create-card { background: white; border: 2px solid var(--border); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
.field-label { font-size: 13px; font-weight: 700; color: var(--text); display: block; }

.csv-msg { font-size: 14px; font-weight: 600; padding: 10px 14px; border-radius: 8px; }
.csv-msg-success { background: #d1fae5; color: #065f46; }
.csv-msg-error { background: #fee2e2; color: #991b1b; }

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .app-wrapper { padding: 16px 12px; }
  .game-title { font-size: 18px; }
}
```

### 3. app.js
```javascript
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
```
