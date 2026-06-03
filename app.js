// ============================================================
// Fix the Paragraph — app.js
// ============================================================

const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91UOTkXuSJJWiWMEHQ/exec";
const TEACHER_PIN = "9999";
const REFRESH_INTERVAL = 15000;

// ── State ────────────────────────────────────────────────────
let studentName = "";
let activities = {}; 
let currentGame = null; 
let sessionStart = null;
let dragSrcEl = null;
let hintsUsed = []; // Tracks which hints the student clicks

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  showScreen("screen-name");

  document.getElementById("btn-start").addEventListener("click", handleNameSubmit);
  document.getElementById("btn-check").addEventListener("click", checkAnswer);
  document.getElementById("btn-retry").addEventListener("click", retryActivity);
  document.getElementById("btn-library").addEventListener("click", () => showLibrary());
  document.getElementById("tab-student").addEventListener("click", () => switchTab("student"));
  document.getElementById("tab-teacher").addEventListener("click", () => promptTeacherPin());
  document.getElementById("btn-pin-submit").addEventListener("click", submitPin);
  document.getElementById("btn-pin-cancel").addEventListener("click", closePinModal);
  document.getElementById("btn-reset-session").addEventListener("click", resetSession);
  
  document.getElementById("pin-input").addEventListener("keydown", e => {
    if (e.key === "Enter") submitPin();
  });
});

// ── Screens ──────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function handleNameSubmit() {
  const input = document.getElementById("input-name");
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
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Library Loading ───────────────────────────────────────────
function loadLibrary() {
  showScreen("screen-loading");
  fetch(LIBRARY_CSV_URL)
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
    .catch(() => showError("Couldn't load activities. Please try again."));
}

function buildActivities(rows) {
  activities = {};
  rows.forEach(row => {
    const status = (row["Status"] || "").toLowerCase();
    if (status !== "active") return;
    
    const id = row["Game_ID"];
    const type = (row["Type"] || "").toLowerCase();
    if (!id) return;
    
    if (!activities[id]) {
      activities[id] = { title: row["Title"] || id, parts: [], distractors: [], overallHint: "" };
    }
    
    if (row["Title"]) activities[id].title = row["Title"];
    if (row["Overall_Hint"]) activities[id].overallHint = row["Overall_Hint"]; // Catches the new column
    
    const item = { text: row["Text"], label: row["Label"], hint: row["Hint"] };
    if (type === "distractor") {
      activities[id].distractors.push(item);
    } else {
      activities[id].parts.push(item);
    }
  });
}

function showLibrary() {
  showScreen("screen-library");
  const list = document.getElementById("library-list");
  list.innerHTML = "";
  
  Object.entries(activities).forEach(([id, game]) => {
    const card = document.createElement("button");
    card.className = "activity-card";
    
    const distractorCount = game.distractors.length;
    const distractorText = distractorCount ? ` + ${distractorCount} distractor${distractorCount > 1 ? "s" : ""}` : "";
    
    card.innerHTML = `
      <span class="card-title">${game.title}</span>
      <span class="card-meta">${game.parts.length} sentences${distractorText}</span>
    `;
    card.addEventListener("click", () => startActivity(id));
    list.appendChild(card);
  });
}

// ── Activity ──────────────────────────────────────────────────
function startActivity(gameId) {
  currentGame = gameId;
  const game = activities[gameId];
  renderActivity(game);
  showScreen("screen-activity");
}

function renderActivity(game) {
  document.getElementById("activity-title").textContent = game.title;
  hintsUsed = []; // Reset hints when activity starts
  
  // Dynamic Instructions
  const instructions = document.getElementById("game-instructions");
  if (game.distractors.length > 0) {
    instructions.textContent = "Drag the sentences into the correct order. Watch out — one might not belong!";
  } else {
    instructions.textContent = "Drag the sentences into the correct order to build your paragraph.";
  }

  // Inject Overall Hint if it exists
  const hintContainer = document.getElementById("overall-hint-injection-point");
  hintContainer.innerHTML = "";
  if (game.overallHint) {
    hintContainer.innerHTML = `
      <div class="overall-hint-container">
        <button id="btn-overall-hint" class="btn-overall-hint">💡 Need a hint?</button>
        <div id="overall-hint-text" class="overall-hint-text hidden">${game.overallHint}</div>
      </div>
    `;
    document.getElementById("btn-overall-hint").addEventListener("click", () => {
      document.getElementById("overall-hint-text").classList.remove("hidden");
      document.getElementById("btn-overall-hint").style.display = "none";
      hintsUsed.push("Overall Hint"); // Log that they clicked it
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
  dropZone.addEventListener("dragover", onDragOver);
  dropZone.addEventListener("drop", e => onDrop(e, dropZone));
  
  pool.addEventListener("dragover", onDragOver);
  pool.addEventListener("drop", e => onDrop(e, pool));
  
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

  let innerHTML = '';
  if (item.label) innerHTML += `<span class="chip-label">${item.label}</span>`;
  innerHTML += `<span class="chip-text">${item.text}</span>`;
  
  if (item.hint) {
    innerHTML += `
      <button class="chip-hint-btn" title="Click for a hint">💡</button>
      <div class="chip-hint-text hidden">${item.hint}</div>
    `;
  }
  chip.innerHTML = innerHTML;
  
  chip.addEventListener("dragstart", onDragStart);
  chip.addEventListener("dragend", onDragEnd);
  chip.addEventListener("touchstart", onTouchStart, { passive: true });
  chip.addEventListener("touchmove", onTouchMove, { passive: false });
  chip.addEventListener("touchend", onTouchEnd);
  
  if (item.hint) {
    const hintBtn = chip.querySelector('.chip-hint-btn');
    const hintText = chip.querySelector('.chip-hint-text');
    const hintName = item.label ? `Hint (${item.label})` : `Hint (Sentence)`;
    
    const toggleHint = (e) => {
      e.preventDefault();
      e.stopPropagation();
      hintText.classList.toggle('hidden');
      hintsUsed.push(hintName); // Log that they clicked it
    };
    
    hintBtn.addEventListener('click', toggleHint);
    hintBtn.addEventListener('mousedown', (e) => e.stopPropagation()); 
    hintBtn.addEventListener('touchstart', toggleHint, { passive: false });
  }
  
  return chip;
}

// ── Drag & Drop ───────────────────────────────────────────────
function onDragStart(e) { dragSrcEl = this; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", this.dataset.index); setTimeout(() => this.classList.add("dragging"), 0); }
function onDragEnd() { this.classList.remove("dragging"); document.querySelectorAll(".drop-target-over").forEach(el => el.classList.remove("drop-target-over")); }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; this.classList.add("drop-target-over"); }
function onDrop(e, container) {
  e.preventDefault(); container.classList.remove("drop-target-over"); if (!dragSrcEl) return;
  const target = e.target.closest(".sentence-chip");
  if (target && target !== dragSrcEl && target.parentNode === container) {
    const rect = target.getBoundingClientRect(); const after = e.clientY > rect.top + rect.height / 2;
    container.insertBefore(dragSrcEl, after ? target.nextSibling : target);
  } else { container.appendChild(dragSrcEl); } dragSrcEl = null;
}

let touchChip = null, touchClone = null, touchOffsetX = 0, touchOffsetY = 0;
function onTouchStart(e) {
  if(e.target.closest('.chip-hint-btn')) return; // Ignore drag if they are clicking the hint button
  touchChip = this; const touch = e.touches[0]; const rect = this.getBoundingClientRect();
  touchOffsetX = touch.clientX - rect.left; touchOffsetY = touch.clientY - rect.top;
  touchClone = this.cloneNode(true); touchClone.classList.add("touch-clone"); touchClone.style.position = "fixed"; touchClone.style.zIndex = "1000"; touchClone.style.width = rect.width + "px"; touchClone.style.left = (touch.clientX - touchOffsetX) + "px"; touchClone.style.top = (touch.clientY - touchOffsetY) + "px"; document.body.appendChild(touchClone);
  this.classList.add("dragging");
}
function onTouchMove(e) { if (touchClone) { e.preventDefault(); const touch = e.touches[0]; touchClone.style.left = (touch.clientX - touchOffsetX) + "px"; touchClone.style.top = (touch.clientY - touchOffsetY) + "px"; } }
function onTouchEnd(e) {
  if (touchClone) { touchClone.remove(); touchClone = null; } if (!touchChip) return; touchChip.classList.remove("dragging");
  const touch = e.changedTouches[0]; const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const pool = document.getElementById("choice-pool"); const dropZone = document.getElementById("drop-zone");
  let container = null;
  if (el && (el === dropZone || dropZone.contains(el))) container = dropZone;
  else if (el && (el === pool || pool.contains(el))) container = pool;
  if (container) { const target = el.closest(".sentence-chip"); if (target && target !== touchChip && target.parentNode === container) { container.insertBefore(touchChip, target); } else { container.appendChild(touchChip); } }
  touchChip = null;
}

// ── Check Answer ──────────────────────────────────────────────
function checkAnswer() {
  const game = activities[currentGame];
  const dropZone = document.getElementById("drop-zone");
  const submitted = Array.from(dropZone.querySelectorAll(".sentence-chip"));
  
  if (submitted.length === 0) { showFeedback("Drag the sentences into the box first!", "neutral"); return; }
  
  const distractorsInZone = submitted.filter(c => c.dataset.distractor === "true");
  const partsInZone = submitted.filter(c => c.dataset.distractor !== "true");
  const correctParts = game.parts;
  
  let orderCorrect = partsInZone.length === correctParts.length;
  if (orderCorrect) { partsInZone.forEach((chip, i) => { if (chip.dataset.originalText !== correctParts[i].text) orderCorrect = false; }); }
  
  const noDistractors = distractorsInZone.length === 0;
  const allPartsPresent = partsInZone.length === correctParts.length;
  
  const perfect = orderCorrect && noDistractors && allPartsPresent;
  
  submitted.forEach(chip => {
    chip.classList.remove("correct", "incorrect", "distractor-warning");
    if (chip.dataset.distractor === "true") { chip.classList.add("distractor-warning"); } 
    else { const idx = partsInZone.indexOf(chip); chip.classList.add(idx >= 0 && chip.dataset.originalText === correctParts[idx]?.text ? "correct" : "incorrect"); }
  });
  
  let status, message;
  if (perfect) { status = "correct"; message = "🎉 Perfect! You got the order exactly right."; } 
  else if (noDistractors && !orderCorrect) { status = "partial"; message = "✅ Good — you kept the distractors out! But check the order of your sentences."; } 
  else if (!noDistractors && orderCorrect) { status = "partial"; message = "⚠️ The order is right, but there's a sentence in there that doesn't belong."; } 
  else { status = "incorrect"; message = "❌ Not quite. Check which sentences belong and what order they go in."; }
  
  showFeedback(message, status);
  
  // Package up the details and hints for the Google Sheet
  let finalDetails = submitted.map(c => c.dataset.originalText);
  if (hintsUsed.length > 0) {
    // Remove duplicates so we don't spam the teacher if they clicked it 5 times
    const uniqueHints = [...new Set(hintsUsed)];
    finalDetails.push("👉 HINTS USED: " + uniqueHints.join(", "));
  }
  
  trackAttempt(status, finalDetails);
  
  document.getElementById("btn-check").style.display = "none";
  document.getElementById("btn-retry").style.display = "inline-flex";
}

function showFeedback(message, type) { const fb = document.getElementById("feedback"); fb.textContent = message; fb.className = "feedback " + type; }
function retryActivity() { renderActivity(activities[currentGame]); }

// ── Tracking ──────────────────────────────────────────────────
function trackAttempt(status, details) {
  const params = new URLSearchParams({
    name: studentName,
    game_id: currentGame,
    status: status,
    details: details.join(" | ")
  });
  
  fetch(`${TRACKING_URL}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {});
}

// ── Teacher Tab ───────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById("tab-student").classList.toggle("active", tab === "student");
  document.getElementById("tab-teacher").classList.toggle("active", tab === "teacher");
  document.getElementById("panel-student").classList.toggle("hidden", tab !== "student");
  document.getElementById("panel-teacher").classList.toggle("hidden", tab !== "teacher");
  if (tab === "teacher") loadTeacherData();
}

function promptTeacherPin() { document.getElementById("pin-modal").classList.remove("hidden"); document.getElementById("pin-input").value = ""; document.getElementById("pin-input").focus(); document.getElementById("pin-error").textContent = ""; }
function closePinModal() { document.getElementById("pin-modal").classList.add("hidden"); }
function submitPin() {
  const entered = document.getElementById("pin-input").value.trim();
  if (entered === TEACHER_PIN) { closePinModal(); switchTab("teacher"); } 
  else { document.getElementById("pin-error").textContent = "Incorrect PIN. Try again."; document.getElementById("pin-input").value = ""; document.getElementById("pin-input").focus(); }
}

function resetSession() { sessionStart = Date.now(); loadTeacherData(); }

function loadTeacherData() {
  const container = document.getElementById("teacher-results");
  container.innerHTML = "<p>Loading results...</p>";
  
  // Adding a timestamp to bust the 5-minute Google cache
  fetch(TRACKING_CSV_URL + "&t=" + Date.now())
    .then(r => r.text())
    .then(text => {
      const rows = parseCSV(text);
      const filtered = sessionStart ? rows.filter(r => new Date(r["Timestamp"]).getTime() >= sessionStart) : rows;
      renderTeacherTable(filtered.reverse()); // Put newest at the top
    })
    .catch(() => { container.innerHTML = "<p>Could not load results.</p>"; });
}

function renderTeacherTable(rows) {
  const container = document.getElementById("teacher-results");
  if (rows.length === 0) { container.innerHTML = "<p>No results yet.</p>"; return; }
  
  const headers = ["Timestamp", "Name", "Game_ID", "Status", "Details"];
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
  if (teacherPanel && !teacherPanel.classList.contains("hidden")) { loadTeacherData(); }
}, REFRESH_INTERVAL);

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function showError(msg) { showScreen("screen-error"); document.getElementById("error-message").textContent = msg; }
