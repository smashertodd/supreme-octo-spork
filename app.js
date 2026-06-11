// =========================================================================
// Fix the Paragraph — app.js (v24 - Final Neon + Dual Mode)
// =========================================================================
const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TEACHER_PIN = "@pple";
const REFRESH_INTERVAL = 15000;

// Vibrant tones that match the purple/pink/blue aesthetic
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

// ── State ────────────────────────────────────────────────────
let studentName = "";
let activities = {};
let currentGame = null;
let sessionStart = null;
let dragSrcEl = null;
let hintsUsed = [];
let attemptCount = 0;
let currentLayoutMode = "paragraph"; // 'paragraph', 'categorisation', 'gapfill'

// ── Inject CSS Automatically ──────────────────────────────────
function injectStyles() {
  if (document.getElementById('paragraph-builder-styles')) return;
  const style = document.createElement('style');
  style.id = 'paragraph-builder-styles';
  style.innerHTML = `
    .legend-box { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .legend-tag { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; font-weight: 600; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
    .hint-btn-small { background: rgba(255,255,255,0.7); border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .hint-btn-small:hover { background: #fff; transform: scale(1.1); }
    .paragraph-builder { line-height: 2.2; font-size: 1.1rem; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: left; }
    .paragraph-slot { display: inline-block; min-width: 140px; height: 1.8rem; vertical-align: middle; margin: 4px; border: 2px dashed #cbd5e1; background: #f1f5f9; border-radius: 4px; transition: all 0.2s; }
    .paragraph-slot.drag-over { border-color: #3b82f6; background: #eff6ff; transform: scale(1.02); }
    .paragraph-slot.filled { border: none !important; background: transparent !important; margin: 0 4px; min-width: auto; height: auto; display: inline; }
    .sentence-chip.in-paragraph { display: inline; padding: 4px 8px; border-radius: 4px; border: none !important; box-shadow: none !important; font-weight: 500; color: #0f172a !important; cursor: pointer; transition: background 0.2s; }
    .sentence-chip.locked { pointer-events: none; outline: 2px solid #22c55e !important; outline-offset: 2px; }

    /* Gap Fill Specific Styles */
    .gap-fill-box { line-height: 2.8; font-size: 1.15rem; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: left; color: #1e293b; }
    .gap-slot { display: inline-flex; align-items: center; justify-content: center; min-width: 110px; height: 34px; vertical-align: middle; margin: 0 6px; border: 2px dashed #94a3b8; background: #f8fafc; border-radius: 4px; transition: all 0.2s; padding: 0 4px; }
    .gap-slot.drag-over { border-color: #3b82f6; background: #eff6ff; transform: scale(1.05); }
    .gap-slot.filled { border: none !important; background: transparent !important; margin: 0 4px; min-width: auto; height: auto; display: inline; }
    .gap-chip { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; color: #0f172a !important; cursor: pointer; transition: background 0.2s; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: none !important; margin: 0 !important; }
    .gap-chip.locked { pointer-events: none; outline: 2px solid #22c55e !important; outline-offset: 2px; }
    .hint-btn-inline { background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-left: 4px; vertical-align: middle; transition: transform 0.2s; padding: 0; }
    .hint-btn-inline:hover { transform: scale(1.2); }

    /* Loading Spinner Animation */
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* NEW: V22 Sticky Pool, Auto-Width Chips, Gap Row Bleed Style */
    #choice-pool {
        min-height: 150px;
        padding-bottom: 20px;
        position: sticky;
        top: 2rem;
        align-self: start;
        max-height: 85vh;
        overflow-y: auto;
    }

    .sentence-chip:not(.in-paragraph) {
        display: block;
        width: fit-content;
        max-width: 100%;
    }

    .gap-row { display: flex; align-items: center; flex-wrap: wrap; padding: 8px 12px; border-radius: 8px; transition: all 0.3s ease; border: 1px solid transparent; }
  `;
  document.head.appendChild(style);
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  try {
      const mobileFixScript = document.createElement('script');
      mobileFixScript.src = "https://unpkg.com/drag-drop-touch";
      document.head.appendChild(mobileFixScript);
  } catch (e) { console.log("Mobile fix skipped", e); }
  injectStyles();
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
  if (nameInput) nameInput.addEventListener("keydown", e => { if (e.key === "Enter") handleNameSubmit(); });

  const pinInput = document.getElementById("pin-input");
  if (pinInput) pinInput.addEventListener("keydown", e => { if (e.key === "Enter") submitPin(); });
});

// ── Screens & CSV Parsing ────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function handleNameSubmit() {
  const input = document.getElementById("input-name");
  if (!input) return;
  const name = input.value.trim();
  if (!name) { input.classList.add("error"); input.placeholder = "Please enter your name"; return; }
  input.classList.remove("error");
  studentName = name;
  loadLibrary();
}

function parseCSV(text) {
  const rows = []; const lines = text.split(/\r?\n/);
  if (lines.length === 0) return rows;
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

// ── Library Loading & Smart Parsing ───────────────────────────
function loadLibrary() {
  showScreen("screen-loading");
  const loadingScreen = document.getElementById("screen-loading");
  if (loadingScreen) {
      loadingScreen.innerHTML = `
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 60vh;">
              <div style="border: 5px solid #e2e8f0; border-top-color: #d8b4fe; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
              <h2 style="color: #334155; font-size: 1.5rem; font-weight: 600;">Loading Activities...</h2>
          </div>
      `;
  }
  fetch(LIBRARY_CSV_URL + "&t=" + new Date().getTime())
    .then(r => r.text())
    .then(text => {
      buildActivities(parseCSV(text));
      const activeGames = Object.keys(activities);
      if (activeGames.length === 0) { showError("No active activities found."); return; }
      if (activeGames.length === 1) startActivity(activeGames[0]);
      else showLibrary();
    })
    .catch((e) => { console.error(e); showError("Couldn't load activities."); });
}

function buildActivities(rows) {
  activities = {};
  let lastTitle = "";
  let lastStatus = "";
  let lastType = "";

  rows.forEach(originalRow => {
    const row = {};
    for (let key in originalRow) if (key) row[key.trim().toLowerCase().replace(/ /g, "_")] = originalRow[key];
    
    // Inherit Title
    let rowTitle = (row["title"] || "").trim();
    if (rowTitle) lastTitle = rowTitle;
    let currentTitle = lastTitle;
    if (!currentTitle) return;
    
    // Inherit Status
    let rowStatus = (row["status"] || "").trim().toLowerCase();
    if (rowStatus === 'active' || rowStatus === 'inactive') { lastStatus = rowStatus; }
    if (lastStatus !== "active") return;

    // Inherit Type (only if it's not a Distractor tag)
    let rawType = (row["type"] || "").trim();
    if (rawType && rawType.toLowerCase() !== "distractor") {
        lastType = rawType;
    }

    // Check Distractor Status
    let rowType = (row["type"] || "").trim().toLowerCase();
    let isDistractor = (rowType === "distractor" || rowStatus === "distractor");
    
    let textContent = (row["text"] || "").trim();
    if (!textContent && !isDistractor) return;
    
    if (!activities[currentTitle]) activities[currentTitle] = { title: currentTitle, type: lastType, parts: [], distractors: [], overallHint: "" };
    if (row["overall_hint"]) activities[currentTitle].overallHint = row["overall_hint"];
    
    const item = { text: textContent, label: row["label"], hint: row["hint"] };
    if (isDistractor) { activities[currentTitle].distractors.push(item); }
    else { activities[currentTitle].parts.push(item); }
  });
}

function showLibrary() {
  showScreen("screen-library");
  const list = document.getElementById("library-list");
  if (!list) return;
  list.innerHTML = "";
  Object.entries(activities).forEach(([id, game]) => {
    const card = document.createElement("button"); card.className = "activity-card";
    const distractorText = game.distractors.length ? "+ " + game.distractors.length + " distractor(s)" : "";
    card.innerHTML = "<span class='card-title'>" + game.title + "</span><span class='card-meta'>" + game.parts.length + " parts " + distractorText + "</span>";
    card.addEventListener("click", () => startActivity(id));
    list.appendChild(card);
  });
}

// ── UI Rendering: The Builder ─────────────────────────────────
function startActivity(gameId) {
  currentGame = gameId; hintsUsed = []; attemptCount = 0;

  const gameData = activities[gameId];
  
  // DETERMINE LAYOUT MODE
  const hasGaps = gameData.parts.some(p => p.text && p.text.includes('___'));
  const typeStr = (gameData.type || "").toLowerCase();

  if (!hasGaps) {
      currentLayoutMode = "paragraph";
  } else if (typeStr.includes("categorisation") || typeStr.includes("categorize")) {
      currentLayoutMode = "categorisation";
  } else {
      currentLayoutMode = "gapfill";
  }

  renderActivity(gameData);
  showScreen("screen-activity");
}

function renderActivity(game) {
  document.getElementById("activity-title").textContent = game.title;

  let instructions = "Drag the text parts into the correct spaces to build the paragraph.";
  if (currentLayoutMode !== "paragraph") instructions = "Drag the correct words/phrases into the gaps.";
  if (game.distractors.length > 0) instructions += " Watch out for distractors!";
  
  document.getElementById("game-instructions").textContent = instructions;
  
  const hintContainer = document.getElementById("overall-hint-container");
  hintContainer.innerHTML = game.overallHint ? "<button id='
