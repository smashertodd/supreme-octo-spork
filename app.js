// ============================================================
// Fix the Paragraph — app.js (v11)
// ============================================================
const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TEACHER_PIN = "9999";
const REFRESH_INTERVAL = 15000;

// ── State ────────────────────────────────────────────────────
let studentName = "";
let activities = {};
let currentGame = null;
let sessionStart = null;
let dragSrcEl = null;
let hintsUsed = [];
let attemptCount = 0;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  showScreen("screen-name");
  
  // A safe way to add button listeners without crashing
  const safeAdd = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };
  
  safeAdd("btn-start", "click", handleNameSubmit);
  safeAdd("btn-check", "click", checkAnswer);
  safeAdd("btn-retry", "click", retryActivity);
  safeAdd("btn-library", "click", () => showLibrary());
  safeAdd("tab-student", "click", () => switchTab("student"));
  safeAdd("tab-teacher", "click", () => promptTeacherPin());
  safeAdd("btn-pin-submit", "click", submitPin);
  safeAdd("btn-pin-cancel", "click", closePinModal);
  safeAdd("btn-reset-session", "click", resetSession);
  
  // Safely handling the Enter key for typing a name
  const nameInput = document.getElementById("input-name");
  if (nameInput) {
    nameInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleNameSubmit();
    });
  }
  
  // Safely handling the Enter key for typing the PIN
  const pinInput = document.getElementById("pin-input");
  if (pinInput) {
    pinInput.addEventListener("keydown", e => {
      if (e.key === "Enter") submitPin();
    });
  }
});

// ── Screens ──────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function handleNameSubmit() {
  const input = document.getElementById("input-name");
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    input.classList.add("error");
    input.placeholder = "Please enter your name";
    return;
  }
  input.classList.remove("error");
  studentName = name;
  loadLibrary();
}

// ── CSV Parsing ───────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return rows;
  const headers = splitCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = []; let current = ""; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ── Library Loading (UPDATED) ─────────────────────────────────
function loadLibrary() {
  showScreen("screen-loading");
  
  // Cache buster guarantees the newest Google Sheet version
  const cacheBuster = "&t=" + new Date().getTime();
  
  fetch(LIBRARY_CSV_URL + cacheBuster)
    .then(r => r.text())
    .then(text => {
      const rows = parseCSV(text);
      buildActivities(rows);
      const activeGames = Object.keys(activities);
      if (activeGames.length === 0) {
        showError("No active activities found. Ask your teacher to activate one.");
        return;
      }
      if (activeGames.length === 1) {
        startActivity(activeGames[0]);
      } else {
        showLibrary();
      }
    })
    .catch((e) => {
      console.error(e);
      showError("Couldn't load activities. Please try again.");
    });
}

function buildActivities(rows) {
  activities = {};
  let lastTitle = ""; 
  let lastStatus = ""; // Adds memory for the status column

  rows.forEach(originalRow => {
    // 1. Bulletproof Headers
    const row = {};
    for (let key in originalRow) {
      if (key) {
        let safeKey = key.trim().toLowerCase().replace(/ /g, "_"); 
        row[safeKey] = originalRow[key];
      }
    }

    // 2. Read and remember the title
    let rowTitle = (row["title"] || "").trim();
    if (rowTitle) {
      lastTitle = rowTitle;
    }
    let currentTitle = lastTitle;

    if (!currentTitle) return; // Skip if no title

    // 3. Read and remember the status
    let rowStatus = (row["status"] || "").trim().toLowerCase();
    if (rowStatus) {
      lastStatus = rowStatus;
    }
    let currentStatus = lastStatus;

    if (currentStatus !== "active") return; // Skip if turned off

    // Skip totally blank rows
    if (!(row["text"] || "").trim()) return;

    // 4. Build the activity
    const type = (row["type"] || "").trim().toLowerCase();

    if (!activities[currentTitle]) {
      activities[currentTitle] = { title: currentTitle, parts: [], distractors: [], overallHint: "" };
    }
    
    if (row["overall_hint"]) {
      activities[currentTitle].overallHint = row["overall_hint"];
    }

    const item = { text: row["text"], label: row["label"], hint: row["hint"] };
    
    if (type === "distractor") {
      activities[currentTitle].distractors.push(item);
    } else {
      activities[currentTitle].parts.push(item);
    }
  });
}

    // 2. Read and remember the title FIRST
    let currentTitle = (row["title"] || "").trim();
    if (currentTitle) {
      lastTitle = currentTitle;
    } else {
      currentTitle = lastTitle;
    }

    if (!currentTitle) return; // Skip if no title is found at all

    // 3. Check if the row is actually active for the students
    const status = (row["status"] || "").trim().toLowerCase();
    if (status !== "active") return;

    // 4. Build the activity
    const type = (row["type"] || "").trim().toLowerCase();

    if (!activities[currentTitle]) {
      activities[currentTitle] = { title: currentTitle, parts: [], distractors: [], overallHint: "" };
    }
    
    if (row["overall_hint"]) {
      activities[currentTitle].overallHint = row["overall_hint"];
    }

    const item = { text: row["text"], label: row["label"], hint: row["hint"] };
    
    if (type === "distractor") {
      activities[currentTitle].distractors.push(item);
    } else {
      activities[currentTitle].parts.push(item);
    }
  });
}

function showLibrary() {
  showScreen("screen-library");
  const list = document.getElementById("library-list");
  if (!list) return;
  list.innerHTML = "";

  Object.entries(activities).forEach(([id, game]) => {
    const card = document.createElement("button");
    card.className = "activity-card";
    const distractorCount = game.distractors.length;
    const distractorText = distractorCount ? `+ ${distractorCount} distractor${distractorCount > 1 ? "s" : ""}` : "";
    card.innerHTML = `<span class="card-title">${game.title}</span><span class="card-meta">${game.parts.length} sentences ${distractorText}</span>`;
    card.addEventListener("click", () => startActivity(id));
    list.appendChild(card);
  });
}

// ── Activity (Side-by-Side) ───────────────────────────────────
function startActivity(gameId) {
  currentGame = gameId;
  const game = activities[gameId];
  hintsUsed = [];
  attemptCount = 0;
  renderActivity(game);
  showScreen("screen-activity");
}

function renderActivity(game) {
  document.getElementById("activity-title").textContent = game.title;
  const hasDistractors = game.distractors.length > 0;
  const instructions = document.getElementById("game-instructions");

  if (hasDistractors) {
    instructions.textContent = "Drag the sentences into the correct label boxes. Watch out — one might be a distractor!";
  } else {
    instructions.textContent = "Drag the sentences into the correct label boxes to build your paragraph.";
  }

  const hintContainer = document.getElementById("overall-hint-container");
  hintContainer.innerHTML = "";

  if (game.overallHint) {
    hintContainer.innerHTML = `
      <button id="btn-overall-hint" class="btn-overall-hint">💡 Need a hint?</button>
      <div id="overall-hint-text" class="overall-hint-text hidden">${game.overallHint}</div>
    `;
    document.getElementById("btn-overall-hint").addEventListener("click", () => {
      document.getElementById("overall-hint-text").classList.remove("hidden");
      document.getElementById("btn-overall-hint").style.display = "none";
      hintsUsed.push("Overall Hint");
    });
  }
  
  const allSentences = [
    ...game.parts.map(p => ({ ...p, isDistractor: false })),
    ...game.distractors.map(d => ({ ...d, isDistractor: true }))
  ];
  shuffle(allSentences);
  
  const pool = document.getElementById("choice-pool");
  pool.innerHTML = "";
  allSentences.forEach((item, i) => {
    const chip = createChip(item, i);
    pool.appendChild(chip);
  });
  
  const dropZone = document.getElementById("drop-zone");
  dropZone.innerHTML = "";
  game.parts.forEach((part, i) => {
    const slot = document.createElement("div");
    slot.className = "drop-slot";
    const labelText = part.label ? part.label : `Sentence ${i + 1}`;
    slot.innerHTML = `<div class="slot-label">${labelText}</div><div class="slot-content" data-slot-index="${i}"></div>`;
    dropZone.appendChild(slot);
    const slotContent = slot.querySelector('.slot-content');
    slotContent.addEventListener("dragover", onDragOver);
    slotContent.addEventListener("drop", e => onDropIntoSlot(e, slotContent));
  });
  
  pool.addEventListener("dragover", onDragOver);
  pool.addEventListener("drop", e => onDropIntoPool(e, pool));
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("btn-check").style.display = "inline-flex";
  document.getElementById("btn-retry").style.display = "none";
}

function createChip(item, index) {
  const chip = document.createElement("div");
  chip.className = "sentence-chip";
  chip.draggable = true;
  chip.dataset.index = index;
  chip.dataset.distractor = item.isDistractor ? "true" : "false";
  chip.dataset.originalText = item.text;

  let innerHTML = `<span class="chip-text">${item.text}</span>`;
  if (item.hint) {
    innerHTML += `<button class="chip-hint-btn" title="Click for a hint">💡</button><div class="chip-hint-text hidden">${item.hint}</div>`;
  }
  chip.innerHTML = innerHTML;
  chip.addEventListener("dragstart", onDragStart);
  chip.addEventListener("dragend", onDragEnd);
  
  if (item.hint) {
    const hintBtn = chip.querySelector('.chip-hint-btn');
    const hintText = chip.querySelector('.chip-hint-text');
    const hintName = item.label ? `Hint (${item.label})` : `Hint (Sentence)`;
    hintBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hintText.classList.toggle('hidden');
      hintsUsed.push(hintName);
    });
  }
  return chip;
}

function onDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => this.classList.add("dragging"), 0);
}

function onDragEnd() {
  this.classList.remove("dragging");
  document.querySelectorAll(".drop-target-over").forEach(el => el.classList.remove("drop-target-over"));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  this.classList.add("drop-target-over");
}

function onDropIntoSlot(e, slotContent) {
  e.preventDefault();
  slotContent.classList.remove("drop-target-over");
  if (!dragSrcEl) return;
  if (slotContent.children.length > 0) {
    document.getElementById('choice-pool').appendChild(slotContent.children[0]);
  }
  slotContent.appendChild(dragSrcEl);
  dragSrcEl = null;
}

function onDropIntoPool(e, pool) {
  e.preventDefault();
  pool.classList.remove("drop-target-over");
  if (!dragSrcEl) return;
  pool.appendChild(dragSrcEl);
  dragSrcEl = null;
}

// ── Check Answer ──────────────────────────────────────────────
function checkAnswer() {
  const game = activities[currentGame];
  const dropZone = document.getElementById("drop-zone");
  const slots = Array.from(dropZone.querySelectorAll(".slot-content"));
  const hasDistractors = game.distractors.length > 0;
  let emptyCount = 0;
  let correctCount = 0;
  let distractorCount = 0;
  let summaryDetails = [];
  
  slots.forEach((slot, i) => {
    const chip = slot.querySelector(".sentence-chip");
    if (!chip) { emptyCount++; return; }
    chip.classList.remove("correct", "incorrect", "distractor-warning");
    
    if (chip.dataset.distractor === "true") {
      distractorCount++;
      chip.classList.add("distractor-warning");
    } else {
      if (chip.dataset.originalText === game.parts[i].text) {
        correctCount++;
        chip.classList.add("correct");
      } else {
        chip.classList.add("incorrect");
      }
    }
  });
  
  if (emptyCount === slots.length) {
    showFeedback("Drag the sentences into the boxes first!", "neutral");
    return;
  }
  
  attemptCount++;
  const perfect = (correctCount === slots.length) && (distractorCount === 0);
  let status, message;
  
  if (perfect) {
    status = "correct";
    message = "🎉 Perfect! You matched all the sentences to the correct labels.";
  } else if (emptyCount > 0) {
    status = "partial";
    message = "⚠️ You have empty boxes! Fill all the labels before checking.";
  } else if (hasDistractors && distractorCount === 0 && correctCount < slots.length) {
    status = "partial";
    message = "✅ Good — you left the distractor out! But check your label matches.";
  } else if (hasDistractors && distractorCount > 0) {
    status = "incorrect";
    message = "⚠️ You have a distractor in there. Check your labels carefully!";
  } else {
    status = "incorrect";
    message = "❌ Not quite right. Check which sentences match which labels.";
  }
  
  showFeedback(message, status);
  
  if (hasDistractors) {
    if (distractorCount > 0) {
      summaryDetails.push(`⚠️ Distractors included: ${distractorCount}`);
    } else {
      summaryDetails.push(`✅ No distractors included`);
    }
  }

  if (hintsUsed.length > 0) {
    const uniqueHints = [...new Set(hintsUsed)];
    summaryDetails.push(`💡 Hints used: ${uniqueHints.join(", ")}`);
  } else {
    summaryDetails.push(`🧠 No hints used`);
  }
  
  trackAttempt(status, attemptCount, summaryDetails);
  document.getElementById("btn-check").style.display = "none";
  document.getElementById("btn-retry").style.display = "inline-flex";
}

function showFeedback(message, type) {
  const fb = document.getElementById("feedback");
  if(fb) { fb.textContent = message; fb.className = "feedback " + type; }
}

function retryActivity() {
  let currentAttempts = attemptCount;
  let currentHints = [...hintsUsed];
  renderActivity(activities[currentGame]);
  attemptCount = currentAttempts;
  hintsUsed = currentHints;
}

// ── Tracking & Teacher Tab ────────────────────────────────────
function trackAttempt(status, attempt, details) {
  const params = new URLSearchParams({
    name: studentName,
    game_id: currentGame,
    attempt: attempt,
    status: status,
    details: details.join(" | ")
  });
  fetch(`${TRACKING_URL}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {});
}

function switchTab(tab) {
  const tabStudent = document.getElementById("tab-student");
  const tabTeacher = document.getElementById("tab-teacher");
  const panelStudent = document.getElementById("panel-student");
  const panelTeacher = document.getElementById("panel-teacher");
  if(tabStudent) tabStudent.classList.toggle("active", tab === "student");
  if(tabTeacher) tabTeacher.classList.toggle("active", tab === "teacher");
  if(panelStudent) panelStudent.classList.toggle("hidden", tab !== "student");
  if(panelTeacher) panelTeacher.classList.toggle("hidden", tab !== "teacher");

  if (tab === "teacher") loadTeacherData();
}

function promptTeacherPin() {
  const modal = document.getElementById("pin-modal");
  const input = document.getElementById("pin-input");
  const err = document.getElementById("pin-error");
  if (modal) modal.classList.remove("hidden");
  if (input) { input.value = ""; input.focus(); }
  if (err) err.textContent = "";
}

function closePinModal() {
  const modal = document.getElementById("pin-modal");
  if(modal) modal.classList.add("hidden");
}

function submitPin() {
  const input = document.getElementById("pin-input");
  if (!input) return;
  const entered = input.value.trim();
  if (entered === TEACHER_PIN) {
    closePinModal();
    switchTab("teacher");
  } else {
    const err = document.getElementById("pin-error");
    if (err) err.textContent = "Incorrect PIN. Try again.";
    input.value = "";
    input.focus();
  }
}

function resetSession() {
  sessionStart = Date.now();
  loadTeacherData();
}

function loadTeacherData() {
  const container = document.getElementById("teacher-results");
  if(!container) return;
  container.innerHTML = "<p>Loading results...</p>";
  fetch(TRACKING_CSV_URL + "&t=" + Date.now())
    .then(r => r.text())
    .then(text => {
      const rows = parseCSV(text);
      const filtered = sessionStart ? rows.filter(r => new Date(r["Timestamp"]).getTime() >= sessionStart) : rows;
      renderTeacherTable(filtered.reverse());
    })
    .catch(() => { container.innerHTML = "<p>Could not load results.</p>"; });
}

function renderTeacherTable(rows) {
  const container = document.getElementById("teacher-results");
  if (!container) return;
  if (rows.length === 0) { container.innerHTML = "<p>No results yet.</p>"; return; }
  const headers = ["Timestamp", "Name", "Game_ID", "Attempt", "Status", "Details"];
  let html = `<table id="results-table"><thead><tr>`;
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += `</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>`;
    headers.forEach(h => { html += `<td>${row[h] || ""}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

setInterval(() => {
  const teacherPanel = document.getElementById("panel-teacher");
  if (teacherPanel && !teacherPanel.classList.contains("hidden")) {
    loadTeacherData();
  }
}, REFRESH_INTERVAL);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showError(msg) {
  showScreen("screen-error");
  const errEl = document.getElementById("error-message");
  if (errEl) errEl.textContent = msg;
}
