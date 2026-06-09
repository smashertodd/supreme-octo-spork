// ============================================================
// Fix the Paragraph — app.js (v15 - Inline Layout & Partial Reset)
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

  const nameInput = document.getElementById("input-name");
  if (nameInput) {
    nameInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleNameSubmit();
    });
  }

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

// ── Library Loading ───────────────────────────────────────────
function loadLibrary() {
  showScreen("screen-loading");
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
  let lastStatus = ""; 
  rows.forEach(originalRow => {
    const row = {};
    for (let key in originalRow) {
      if (key) {
        let safeKey = key.trim().toLowerCase().replace(/ /g, "_");
        row[safeKey] = originalRow[key];
      }
    }
    
    let rowTitle = (row["title"] || "").trim();
    if (rowTitle) lastTitle = rowTitle;
    let currentTitle = lastTitle;
    if (!currentTitle) return; 
    
    let rowStatus = (row["status"] || "").trim().toLowerCase();
    if (rowStatus) lastStatus = rowStatus;
    let currentStatus = lastStatus;
    if (currentStatus !== "active") return; 
    
    if (!(row["text"] || "").trim() && !(row["label"] || "").trim()) return;
    
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
    card.innerHTML = `<span class="card-title">${game.title}</span><span class="card-meta">${game.parts.length} parts ${distractorText}</span>`;
    card.addEventListener("click", () => startActivity(id));
    list.appendChild(card);
  });
}

// ── Activity Rendering (Inline Paragraph Layout) ──────────────
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
    instructions.textContent = "Drag the labels into the correct spaces. Watch out — there are distractors!";
  } else {
    instructions.textContent = "Drag the labels into the correct spaces to complete the text.";
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

  const allLabels = [
    ...game.parts.map(p => ({ ...p, isDistractor: false })),
    ...game.distractors.map(d => ({ ...d, isDistractor: true }))
  ];
  shuffle(allLabels);

  // 1. Build the Choice Pool (The Bank on the left)
  const pool = document.getElementById("choice-pool");
  pool.innerHTML = "";
  allLabels.forEach((item, i) => {
    const chip = createChip(item, i);
    pool.appendChild(chip);
  });
  pool.addEventListener("dragover", onDragOver);
  pool.addEventListener("drop", e => onDropIntoPool(e, pool));

  // 2. Build the Paragraph Drop Zone (The text on the right)
  const dropZone = document.getElementById("drop-zone");
  dropZone.innerHTML = "";
  
  const p = document.createElement('p');
  p.style.lineHeight = "2.5"; // Gives room for the dropped boxes
  p.style.fontSize = "1.1rem";

  game.parts.forEach((part, i) => {
    if (part.text.includes('________')) {
      const textParts = part.text.split('________');
      p.appendChild(document.createTextNode(textParts[0]));

      const inlineSlot = document.createElement('span');
      inlineSlot.className = "inline-dropzone";
      inlineSlot.dataset.answer = part.label; // The correct answer
      inlineSlot.addEventListener("dragover", onDragOver);
      inlineSlot.addEventListener("drop", e => onDropIntoSlot(e, inlineSlot));

      p.appendChild(inlineSlot);
      p.appendChild(document.createTextNode(textParts[1] + ' '));
    } else {
      p.appendChild(document.createTextNode(part.text + ' '));
    }
  });
  
  dropZone.appendChild(p);

  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("btn-check").style.display = "inline-flex";
  document.getElementById("btn-retry").style.display = "none";
}

function createChip(item, index) {
  const chipContainer = document.createElement("div");
  chipContainer.className = "chip-container";
  chipContainer.style.display = "flex";
  chipContainer.style.alignItems = "center";
  chipContainer.style.gap = "8px";
  chipContainer.style.marginBottom = "8px";

  const chip = document.createElement("div");
  chip.className = "sentence-chip";
  chip.draggable = true;
  chip.dataset.index = index;
  chip.dataset.distractor = item.isDistractor ? "true" : "false";
  chip.dataset.label = item.label; // Store the label for checking
  
  // The chip displays the LABEL, not the whole sentence
  const displayText = item.label ? item.label : "Label missing";
  chip.innerHTML = `<span class="chip-text">${displayText}</span>`;
  chip.addEventListener("dragstart", onDragStart);
  chip.addEventListener("dragend", onDragEnd);

  chipContainer.appendChild(chip);

  if (item.hint) {
    const hintBtn = document.createElement("button");
    hintBtn.className = "chip-hint-btn";
    hintBtn.title = "Click for a hint";
    hintBtn.innerHTML = "💡";
    
    const hintText = document.createElement("div");
    hintText.className = "chip-hint-text hidden";
    hintText.textContent = item.hint;
    
    hintBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hintText.classList.toggle('hidden');
      hintsUsed.push(`Hint (${item.label})`);
    });
    
    chipContainer.appendChild(hintBtn);
    chipContainer.appendChild(hintText);
  }
  
  return chipContainer;
}

// ── Drag & Drop Handlers ─────────────────────────────────────
function onDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => this.classList.add("dragging"), 0);
}

function onDragEnd() {
  this.classList.remove("dragging");
  document.querySelectorAll(".drop-target-over").forEach(el => el.classList.remove("drop-target-over"));
  document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  if (this.classList.contains("inline-dropzone")) {
      this.classList.add("drag-over");
  } else {
      this.classList.add("drop-target-over");
  }
}

function onDropIntoSlot(e, slotContent) {
  e.preventDefault();
  slotContent.classList.remove("drag-over");
  if (!dragSrcEl) return;
  
  // Don't drop on locked correct answers
  if (slotContent.classList.contains("correct")) return;

  // If slot already has an item, send the old item back to the pool
  if (slotContent.children.length > 0) {
    const oldChip = slotContent.children[0];
    // Find its original container to put it back neatly
    const poolContainers = document.querySelectorAll("#choice-pool .chip-container");
    let placedBack = false;
    poolContainers.forEach(container => {
        if (container.children.length === 0 || (container.children[0].tagName === 'BUTTON')) {
            container.prepend(oldChip);
            placedBack = true;
        }
    });
    if(!placedBack) document.getElementById('choice-pool').appendChild(oldChip);
  }
  slotContent.appendChild(dragSrcEl);
  dragSrcEl = null;
}

function onDropIntoPool(e, pool) {
  e.preventDefault();
  pool.classList.remove("drop-target-over");
  if (!dragSrcEl) return;
  
  // Find an empty container to put it in, or just append it
  const containers = pool.querySelectorAll(".chip-container");
  let placed = false;
  for (let c of containers) {
      if (c.querySelectorAll('.sentence-chip').length === 0) {
          c.prepend(dragSrcEl);
          placed = true;
          break;
      }
  }
  if (!placed) pool.appendChild(dragSrcEl);
  dragSrcEl = null;
}

// ── Check Answer (Partial Reset Logic) ────────────────────────
function checkAnswer() {
  const game = activities[currentGame];
  const dropzones = document.querySelectorAll(".inline-dropzone");
  let correctCount = 0;
  let emptyCount = 0;
  let distractorCount = 0;
  let mistakesMade = false;
  let summaryDetails = [];

  attemptCount++;

  dropzones.forEach(zone => {
    if (zone.classList.contains("correct")) {
        correctCount++; // Already locked in from previous attempt
        return; 
    }

    const chip = zone.querySelector(".sentence-chip");
    if (!chip) { 
        emptyCount++; 
        return; 
    }

    // Check Distractor
    if (chip.dataset.distractor === "true") {
      distractorCount++;
      mistakesMade = true;
      bounceBackToPool(chip);
    } 
    // Check Match
    else if (chip.dataset.label === zone.dataset.answer) {
      correctCount++;
      zone.classList.add("correct");
      chip.draggable = false;
      chip.style.cursor = "default";
      chip.style.backgroundColor = "transparent";
      chip.style.border = "none";
      chip.style.boxShadow = "none";
      chip.style.color = "#166534";
      chip.style.fontWeight = "bold";
    } 
    // Incorrect Match
    else {
      mistakesMade = true;
      bounceBackToPool(chip);
    }
  });

  // Calculate Status
  const totalSlots = dropzones.length;
  let status, message;

  if (correctCount === totalSlots) {
    status = "correct";
    message = "🎉 Perfect! You have correctly structured the text.";
    document.getElementById("btn-check").style.display = "none";
    document.getElementById("btn-retry").style.display = "inline-flex";
  } else if (mistakesMade) {
    status = "incorrect";
    message = `⚠️ Incorrect labels were returned to the left. You have locked in ${correctCount} correct answer(s). Keep trying!`;
  } else if (emptyCount > 0) {
    status = "partial";
    message = `You have locked in ${correctCount} correct answer(s). Fill the empty spaces!`;
  }

  showFeedback(message, status);

  // Tracking Details
  summaryDetails.push(`Score: ${correctCount}/${totalSlots}`);
  if (distractorCount > 0) summaryDetails.push(`⚠️ Fell for distractors`);
  
  if (hintsUsed.length > 0) {
    const uniqueHints = [...new Set(hintsUsed)];
    summaryDetails.push(`💡 Hints used: ${uniqueHints.join(", ")}`);
  } else {
    summaryDetails.push(`🧠 No hints used`);
  }

  trackAttempt(status, attemptCount, summaryDetails);
}

// Helper function to return chips neatly to the bank
function bounceBackToPool(chip) {
    const poolContainers = document.querySelectorAll("#choice-pool .chip-container");
    for (let c of poolContainers) {
        if (c.querySelectorAll('.sentence-chip').length === 0) {
            c.prepend(chip);
            return;
        }
    }
    document.getElementById("choice-pool").appendChild(chip);
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
