// ============================================================
// Fix the Paragraph — app.js
// ============================================================

const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";

// 👇👇👇 DON'T FORGET TO PASTE YOUR GOOGLE SCRIPT URL HERE 👇👇👇
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec"; 
// 👆👆👆 MAKE SURE IT ENDS IN /exec 👆👆👆

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

  document.getElementById("btn-start").addEventListener("click", handleNameSubmit);
  if(document.getElementById("btn-check")) document.getElementById("btn-check").addEventListener("click", checkAnswer);
  if(document.getElementById("btn-retry")) document.getElementById("btn-retry").addEventListener("click", retryActivity);
  if(document.getElementById("btn-library")) document.getElementById("btn-library").addEventListener("click", () => showLibrary());
  if(document.getElementById("tab-student")) document.getElementById("tab-student").addEventListener("click", () => switchTab("student"));
  if(document.getElementById("tab-teacher")) document.getElementById("tab-teacher").addEventListener("click", () => promptTeacherPin());
  if(document.getElementById("btn-pin-submit")) document.getElementById("btn-pin-submit").addEventListener("click", submitPin);
  if(document.getElementById("btn-pin-cancel")) document.getElementById("btn-pin-cancel").addEventListener("click", closePinModal);
  if(document.getElementById("btn-reset-session")) document.getElementById("btn-reset-session").addEventListener("click", resetSession);
  
  const pinInput = document.getElementById("pin-input");
  if(pinInput) pinInput.addEventListener("keydown", e => { if (e.key === "Enter") submitPin(); });
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
  if (!name) { input.classList.add("error"); input.placeholder = "Please enter your name"; return; }
  input.classList.remove("error"); studentName = name; loadLibrary();
}

// ── CSV Parsing ───────────────────────────────────────────────
function parseCSV(text) {
  const rows = []; const lines = text.split(/\r?\n/); if (lines.length === 0) return rows;
  const headers = splitCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]); const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = []; let current = ""; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } } 
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; } 
    else { current += ch; }
  }
  result.push(current); return result;
}

// ── Library Loading ───────────────────────────────────────────
function loadLibrary() {
  showScreen("screen-loading");
  fetch(LIBRARY_CSV_URL).then(r => r.text()).then(text => {
      const rows = parseCSV(text); buildActivities(rows);
      const activeGames = Object.keys(activities);
      if (activeGames.length === 0) { showError("No active activities found. Ask your teacher to activate one."); return; }
      if (activeGames.length === 1) { startActivity(activeGames[0]); } else { showLibrary(); }
    }).catch(() => showError("Couldn't load activities. Please try again."));
}

function buildActivities(rows) {
  activities = {};
  rows.forEach(row => {
    const status = (row["Status"] || "").toLowerCase(); if (status !== "active") return;
    const id = row["Game_ID"]; const type = (row["Type"] || "").toLowerCase(); if (!id) return;
    if (!activities[id]) { activities[id] = { title: row["Title"] || id, parts: [], distractors: [], overallHint: "" }; }
    
    if (row["Title"]) activities[id].title = row["Title"];
    if (row["Overall_Hint"]) activities[id].overallHint = row["Overall_Hint"]; 
    
    const item = { text: row["Text"], label: row["Label"], hint: row["Hint"] };
    if (type === "distractor") { activities[id].distractors.push(item); } else { activities[id].parts.push(item); }
  });
}

function showLibrary() {
  showScreen("screen-library");
  const list = document.getElementById("library-list"); list.innerHTML = "";
  Object.entries(activities).forEach(([id, game]) => {
    const card = document.createElement("button"); card.className = "activity-card";
    const distractorCount = game.distractors.length;
    const distractorText = distractorCount ? ` + ${distractorCount} distractor${distractorCount > 1 ? "s" : ""}` : "";
    card.innerHTML = `<span class="card-title">${game.title}</span><span class="card-meta">${game.parts.length} sentences${distractorText}</span>`;
    card.addEventListener("click", () => startActivity(id)); list.appendChild(card);
  });
}

// ── Activity (Side-by-Side) ───────────────────────────────────
function startActivity(gameId) {
  currentGame = gameId; const game = activities[gameId];
  hintsUsed = []; attemptCount = 0; 
  renderActivity(game); showScreen("screen-activity");
}

function renderActivity(game) {
  document.getElementById("activity-title").textContent = game.title;
  const hasDistractors = game.distractors.length > 0;
  
  const instructions = document.getElementById("game-instructions");
  if (hasDistractors) { instructions.textContent = "Drag the sentences into the correct label boxes. Watch out — one might be a distractor!"; } 
  else { instructions.textContent = "Drag the sentences into the correct label boxes to build your paragraph."; }

  const hintContainer = document.getElementById("overall-hint-container"); hintContainer.innerHTML = "";
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
  
  const pool = document.getElementById("choice-pool"); pool.innerHTML = "";
  allSentences.forEach((item, i) => { const chip = createChip(item, i); pool.appendChild(chip); });
  
  const dropZone = document.getElementById("drop-zone"); dropZone.innerHTML = "";
  game.parts.forEach((part, i) => {
    const slot = document.createElement("div"); slot.className = "drop-slot";
    const labelText = part.label ? part.label : `Sentence ${i + 1}`;
    slot.innerHTML = `<div class="slot-label">${labelText}</div><div class="slot-content" data-slot-index="${i}"></div>`;
    dropZone.appendChild(slot);
    
    const slotContent = slot.querySelector('.slot-content');
    slotContent.addEventListener("dragover", onDragOver);
    slotContent.addEventListener("drop", e => onDropIntoSlot(e, slotContent));
  });
  
  pool.addEventListener("dragover", onDragOver); pool.addEventListener("drop", e => onDropIntoPool(e, pool));
  
  document.getElementById("feedback").textContent = ""; document.getElementById("feedback").className = "feedback";
  document.getElementById("btn-check").style.display = "inline-flex"; document.getElementById("btn-retry").style.display = "none";
}

function createChip(item, index) {
  const chip = document.createElement("div");
  chip.className = "sentence-chip"; chip.draggable = true; chip.dataset.index = index;
  chip.dataset.distractor = item.isDistractor ? "true" : "false"; chip.dataset.originalText = item.text; 

  let innerHTML = `<span class="chip-text">${item.text}</span>`;
  if (item.hint) {
    innerHTML += `<button class="chip-hint-btn" title="Click for a hint">💡</button><div class="chip-hint-text hidden">${item.hint}</div>`;
  }
  chip.innerHTML = innerHTML;
  
  chip.addEventListener("dragstart", onDragStart); chip.addEventListener("dragend", onDragEnd);
  
  if (item.hint) {
    const hintBtn = chip.querySelector('.chip-hint-btn'); const hintText = chip.querySelector('.chip-hint-text');
    const hintName = item.label ? `Hint (${item.label})` : `Hint (Sentence)`;
    hintBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      hintText.classList.toggle('hidden'); hintsUsed.push(hintName); 
    });
  }
  return chip;
}

function onDragStart(e) { dragSrcEl = this; e.dataTransfer.effectAllowed = "move"; setTimeout(() => this.classList.add("dragging"), 0); }
function onDragEnd() { this.classList.remove("dragging"); document.querySelectorAll(".drop-target-over").forEach(el => el.classList.remove("drop-target-over")); }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; this.classList.add("drop-target-over"); }

function onDropIntoSlot(e, slotContent) {
  e.preventDefault(); slotContent.classList.remove("drop-target-over"); if (!dragSrcEl) return;
  if (slotContent.children.length > 0) { document.getElementById('choice-pool').appendChild(slotContent.children[0]); }
  slotContent.appendChild(dragSrcEl); dragSrcEl = null;
}

function onDropIntoPool(e, pool) {
  e.preventDefault(); pool.classList.remove("drop-target-over"); if (!dragSrcEl) return;
  pool.appendChild(dragSrcEl); dragSrcEl = null;
}

// ── Check Answer ──────────────────────────────────────────────
function checkAnswer() {
  const game = activities[currentGame];
  const dropZone = document.getElementById("drop-zone");
  const slots = Array.from(dropZone.querySelectorAll(".slot-content"));
  const hasDistractors = game.distractors.length > 0;
  
  let emptyCount = 0; let correctCount = 0; let distractorCount = 0; let summaryDetails = [];
  
  slots.forEach((slot, i) => {
    const chip = slot.querySelector(".sentence-chip");
    if (!chip) { emptyCount++; return; }
    chip.classList.remove("correct", "incorrect", "distractor-warning");
    
    if (chip.dataset.distractor === "true") { distractorCount++; chip.classList.add("distractor-warning"); } 
    else {
      if (chip.dataset.originalText === game.parts[i].text) { correctCount++; chip.classList.add("correct"); } 
      else { chip.classList.add("incorrect"); }
    }
  });

  if (emptyCount === slots.length) { showFeedback("Drag the sentences into the boxes first!", "neutral"); return; }
  attemptCount++; 
  
  const perfect = (correctCount === slots.length) && (distractorCount === 0);
  let status, message;
  
  if (perfect) { status = "correct"; message = "🎉 Perfect! You matched all the sentences to the correct labels."; } 
  else if (emptyCount > 0) { status = "partial"; message = "⚠️ You have empty boxes! Fill all the labels before checking."; } 
  else if (hasDistractors && distractorCount === 0 && correctCount < slots.length) { status = "partial"; message = "✅ Good — you left the distractor out! But check your label matches."; } 
  else if (hasDistractors && distractorCount > 0) { status = "incorrect"; message = "⚠️ You have a distractor in there. Check your labels carefully!"; } 
  else { status = "incorrect"; message = "❌ Not quite right. Check which sentences match which labels."; }
  
  showFeedback(message, status);
  
  if (hasDistractors) {
    if (distractorCount > 0) summaryDetails.push(`⚠️ Distractors included: ${distractorCount}`); 
    else summaryDetails.push(`✅ No distractors included`);
  }

  if (hintsUsed.length > 0) {
    const uniqueHints = [...new Set(hintsUsed)];
    summaryDetails.push(`💡 Hints used: ${uniqueHints.join(", ")}`);
  } else { summaryDetails.push(`🧠 No hints used`); }
  
  trackAttempt(status, attemptCount, summaryDetails);
  
  document.getElementById("btn-check").style.display = "none";
  document.getElementById("btn-retry").style.display = "inline-flex";
}

function showFeedback(message, type) { const fb = document.getElementById("feedback"); fb.textContent = message; fb.className = "feedback " + type; }
function retryActivity() { let currentAttempts = attemptCount; let currentHints = [...hintsUsed]; renderActivity(activities[currentGame]); attemptCount = currentAttempts; hintsUsed = currentHints; }

// ── Tracking & Teacher Tab ────────────────────────────────────
function trackAttempt(status, attempt, details) {
  const params = new URLSearchParams({ name: studentName, game_id: currentGame, attempt: attempt, status: status, details: details.join(" | ") });
  fetch(`${TRACKING_URL}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {});
}

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
  if (teacherPanel && !teacherPanel.classList.contains("hidden")) { loadTeacherData(); }
}, REFRESH_INTERVAL);

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function showError(msg) { showScreen("screen-error"); if(document.getElementById("error-message")) document.getElementById("error-message").textContent = msg; }
