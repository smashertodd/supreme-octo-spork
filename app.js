// =========================================================================
// Fix the Paragraph — app.js (v28 - The DOM Crawler Sticky Fix)
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
let isGapFillMode = false;

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
    
    /* NEW: V28 Brute Force Layout Fixes */
    #choice-pool { min-height: 150px; padding-bottom: 20px; }
    .gap-row { display: flex; align-items: center; flex-wrap: wrap; padding: 8px 12px; border-radius: 8px; transition: all 0.3s ease; border: 1px solid transparent; }
    
    .sentence-chip:not(.in-paragraph) { 
        display: block; 
        width: fit-content; 
        max-width: 100%; 
    }

    /* Brute Force IDs to override standard HTML templates */
    @media (min-width: 768px) {
        #main-activity-grid {
            display: grid !important;
            grid-template-columns: 320px 1fr !important;
            align-items: start !important;
        }
    }
    
    #left-sticky-column {
        position: -webkit-sticky !important;
        position: sticky !important;
        top: 24px !important;
        align-self: start !important; 
        height: auto !important; 
        max-height: calc(100vh - 48px) !important;
        overflow-y: auto !important;
        scrollbar-width: thin;
        z-index: 100 !important;
    }
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

  rows.forEach(originalRow => {
    const row = {};
    for (let key in originalRow) if (key) row[key.trim().toLowerCase().replace(/ /g, "_")] = originalRow[key];

    let rowTitle = (row["title"] || "").trim();
    if (rowTitle) lastTitle = rowTitle;
    let currentTitle = lastTitle;
    if (!currentTitle) return;

    let rowStatus = (row["status"] || "").trim().toLowerCase();
    if (rowStatus === 'active' || rowStatus === 'inactive') { lastStatus = rowStatus; }
    if (lastStatus !== "active") return;

    let rowType = (row["type"] || "").trim().toLowerCase();
    let isDistractor = (rowType === "distractor" || rowStatus === "distractor");

    let textContent = (row["text"] || "").trim();
    if (!textContent && !isDistractor) return;

    if (!activities[currentTitle]) activities[currentTitle] = { title: currentTitle, parts: [], distractors: [], overallHint: "" };
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
  isGapFillMode = gameData.parts.some(p => p.text && p.text.includes('___'));
  renderActivity(gameData);
  showScreen("screen-activity");
}

function renderActivity(game) {
  document.getElementById("activity-title").textContent = game.title;
  let instructions = isGapFillMode ? "Drag the correct words/phrases into the gaps." : "Drag the text parts into the correct spaces to build the paragraph.";
  if (game.distractors.length > 0) instructions += " Watch out for distractors!";
  document.getElementById("game-instructions").textContent = instructions;

  const hintContainer = document.getElementById("overall-hint-container");
  hintContainer.innerHTML = game.overallHint ? "<button id='btn-overall-hint' class='btn-overall-hint'>💡 Need an overall hint?</button><div id='overall-hint-text' class='overall-hint-text hidden'>" + game.overallHint + "</div>" : "";
  if (game.overallHint) {
    document.getElementById("btn-overall-hint").addEventListener("click", () => {
      document.getElementById("overall-hint-text").classList.remove("hidden");
      document.getElementById("btn-overall-hint").style.display = "none";
      hintsUsed.push("Overall Hint");
    });
  }

  // Build Left Pool
  const allSentences = [
    ...game.parts.map((p, i) => ({ ...p, isDistractor: false, answerIndex: i })),
    ...game.distractors.map(d => ({ ...d, isDistractor: true, answerIndex: -1 }))
  ];
  shuffle(allSentences);

  const pool = document.getElementById("choice-pool");
  pool.innerHTML = "";
  allSentences.forEach((item, index) => {
    const chip = document.createElement("div");
    chip.className = "sentence-chip bg-white border border-gray-300 p-3 rounded shadow-sm mb-3 cursor-grab text-gray-800 text-left";
    chip.draggable = true;
    chip.dataset.answerIndex = item.answerIndex;
    chip.dataset.isDistractor = item.isDistractor;
    chip.textContent = isGapFillMode ? (item.label || "[Missing]") : item.text;
    
    if (isGapFillMode) {
      chip.dataset.color = COLORS[index % COLORS.length];
      chip.style.backgroundColor = chip.dataset.color;
    }
    
    chip.addEventListener("dragstart", onDragStart);
    chip.addEventListener("dragend", onDragEnd);
    pool.appendChild(chip);
  });
  pool.addEventListener("dragover", onDragOver);
  pool.addEventListener("drop", e => onDropIntoPool(e, pool));

  // Build Right Zone
  const dropZone = document.getElementById("drop-zone");
  dropZone.innerHTML = "";

  if (isGapFillMode) {
      const gapFillBox = document.createElement("div");
      gapFillBox.className = "gap-fill-box";
      gapFillBox.style.display = "flex"; gapFillBox.style.flexDirection = "column"; gapFillBox.style.gap = "8px";

      game.parts.forEach((part, i) => {
          const rowDiv = document.createElement("div");
          rowDiv.className = "gap-row";
          const segments = (part.text || "").split('___');
          
          segments.forEach((seg, sIdx) => {
              if (seg) { const span = document.createElement("span"); span.textContent = seg; rowDiv.appendChild(span); }
              if (sIdx < segments.length - 1) {
                  const slot = document.createElement("span"); slot.className = "gap-slot dropzone"; slot.dataset.expectedIndex = i;
                  slot.addEventListener("dragover", onDragOver); slot.addEventListener("drop", e => onDropIntoSlot(e, slot));
                  rowDiv.appendChild(slot);
                  if (part.hint) {
                      const hBtn = document.createElement("button"); hBtn.className = "hint-btn-inline"; hBtn.innerHTML = "💡";
                      hBtn.onclick = () => { alert("Hint:\n\n" + part.hint); hintsUsed.push("Hint (Gap " + (i+1) + ")"); };
                      rowDiv.appendChild(hBtn);
                  }
              }
          });
          gapFillBox.appendChild(rowDiv);
      });
      dropZone.appendChild(gapFillBox);
  } else {
      const legendBox = document.createElement("div"); legendBox.className = "legend-box";
      const legendTitle = document.createElement("div"); legendTitle.className = "w-full text-sm uppercase font-bold text-gray-500 mb-1"; legendTitle.textContent = "Paragraph Structure:"; legendBox.appendChild(legendTitle);

      game.parts.forEach((part, i) => {
        const tag = document.createElement("div"); tag.className = "legend-tag"; tag.style.backgroundColor = COLORS[i % COLORS.length]; tag.textContent = (i + 1) + ". " + (part.label || "Part " + (i + 1));
        if (part.hint) {
          const hintBtn = document.createElement("button"); hintBtn.className = "hint-btn-small"; hintBtn.innerHTML = "💡";
          hintBtn.onclick = () => { alert("Hint for " + part.label + ":\n\n" + part.hint); hintsUsed.push("Hint (" + part.label + ")"); }; tag.appendChild(hintBtn);
        }
        legendBox.appendChild(tag);
      });
      dropZone.appendChild(legendBox);

      const paraBuilder = document.createElement("div"); paraBuilder.className = "paragraph-builder";
      game.parts.forEach((part, i) => {
        const slot = document.createElement("div"); slot.className = "paragraph-slot dropzone"; slot.dataset.expectedIndex = i; slot.dataset.color = COLORS[i % COLORS.length];
        slot.addEventListener("dragover", onDragOver); slot.addEventListener("drop", e => onDropIntoSlot(e, slot)); paraBuilder.appendChild(slot);
      });
      dropZone.appendChild(paraBuilder);
  }

  document.getElementById("feedback").textContent = ""; document.getElementById("feedback").className = "feedback";
  document.getElementById("btn-check").style.display = "inline-flex"; document.getElementById("btn-retry").style.display = "none";
  
  // =======================================================
  // V28: THE DOM CRAWLER (Guaranteed to un-break sticky)
  // =======================================================
  const poolEl = document.getElementById("choice-pool");
  if (poolEl && poolEl.parentElement) {
      const parentBlock = poolEl.parentElement;
      parentBlock.id = "left-sticky-column";
      if (parentBlock.parentElement) parentBlock.parentElement.id = "main-activity-grid";
      
      // Hunt down and destroy any parent 'overflow: hidden' rules
      let ancestor = parentBlock.parentElement;
      while (ancestor && ancestor !== document.documentElement) {
          ancestor.style.setProperty('overflow', 'visible', 'important');
          ancestor.style.setProperty('overflow-x', 'visible', 'important');
          ancestor.style.setProperty('overflow-y', 'visible', 'important');
          ancestor = ancestor.parentElement;
      }
  }
}

// ── Drag & Drop Handlers ─────────────────────────────────────
function onDragStart(e) { dragSrcEl = this; e.dataTransfer.effectAllowed = "move"; setTimeout(() => this.classList.add("opacity-50"), 0); }
function onDragEnd() { this.classList.remove("opacity-50"); document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over")); updateSlotLayouts(); }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (this.classList.contains("dropzone")) this.classList.add("drag-over"); }
function onDropIntoSlot(e, slot) { e.preventDefault(); slot.classList.remove("drag-over"); if (!dragSrcEl || slot.classList.contains("correct")) return; if (slot.children.length > 0) document.getElementById("choice-pool").appendChild(slot.children[0]); slot.appendChild(dragSrcEl); }
function onDropIntoPool(e, pool) { e.preventDefault(); if (dragSrcEl) pool.appendChild(dragSrcEl); }

// ── Dynamic Styling Update ────────────────────────────────────
function updateSlotLayouts() {
  document.querySelectorAll('.dropzone').forEach(slot => {
    const row = slot.closest('.gap-row');
    if (slot.children.length > 0) {
      slot.classList.add('filled'); const chip = slot.children[0]; chip.classList.add('in-paragraph'); chip.classList.remove('bg-white', 'border', 'mb-3', 'p-3', 'cursor-grab');
      if (isGapFillMode) {
          chip.classList.add('gap-chip'); chip.style.backgroundColor = chip.dataset.color || '#e2e8f0';
          if (row) { row.style.backgroundColor = chip.dataset.color; row.style.color = '#000'; }
      } else { chip.style.backgroundColor = slot.dataset.color; }
    } else {
      slot.classList.remove('filled');
      if (isGapFillMode && row) { row.style.backgroundColor = 'transparent'; row.style.color = 'inherit'; }
    }
  });

  document.querySelectorAll('#choice-pool .sentence-chip').forEach(chip => {
    chip.classList.remove('in-paragraph', 'locked', 'gap-chip'); chip.classList.add('bg-white', 'border', 'mb-3', 'p-3', 'cursor-grab');
    if (isGapFillMode && chip.dataset.color) { chip.style.backgroundColor = chip.dataset.color; } else { chip.style.backgroundColor = ''; }
    chip.style.outline = 'none';
  });
}

// ── Check Answer ──────────────────────────────────────────────
function checkAnswer() {
  const slots = document.querySelectorAll(".dropzone");
  let correctCount = 0; let emptyCount = 0; let distractorCount = 0; let mistakesMade = false;
  attemptCount++;

  slots.forEach((slot, i) => {
    const chip = slot.querySelector(".sentence-chip");
    if (!chip) { emptyCount++; return; }
    if (chip.classList.contains("locked")) { correctCount++; return; }

    const expected = slot.dataset.expectedIndex; const actual = chip.dataset.answerIndex; const isDistractor = chip.dataset.isDistractor === "true";
    if (isDistractor) { distractorCount++; mistakesMade = true; document.getElementById("choice-pool").appendChild(chip); } 
    else if (expected === actual) { correctCount++; chip.classList.add("locked"); chip.draggable = false; } 
    else { mistakesMade = true; document.getElementById("choice-pool").appendChild(chip); }
  });

  updateSlotLayouts();
  
  const totalSlots = slots.length; let status, message;
  if (correctCount === totalSlots) { status = "correct"; message = isGapFillMode ? "🎉 Perfect! You filled the gaps correctly." : "🎉 Perfect! You built the paragraph correctly."; document.getElementById("btn-check").style.display = "none"; document.getElementById("btn-retry").style.display = "inline-flex"; } 
  else if (mistakesMade) { status = "incorrect"; message = "⚠️ Incorrect parts were sent back to the left. You locked in " + correctCount + " correct answer(s). Keep trying!"; } 
  else if (emptyCount > 0) { status = "partial"; message = "Fill the remaining empty spaces! You have " + correctCount + " locked in."; }

  const fb = document.getElementById("feedback"); if(fb) { fb.textContent = message; fb.className = "feedback " + status; }
  let details = ["Score: " + correctCount + "/" + totalSlots]; if (distractorCount > 0) details.push("⚠️ Fell for distractors"); details.push(hintsUsed.length > 0 ? "💡 Hints: " + [...new Set(hintsUsed)].join(", ") : "🧠 No hints used");
  trackAttempt(status, attemptCount, details);
}

function retryActivity() { let cA = attemptCount; let cH = [...hintsUsed]; renderActivity(activities[currentGame]); attemptCount = cA; hintsUsed = cH; }

// ── Tracking & Teacher Tab ────────────────────────────────────
function trackAttempt(status, attempt, details) { const params = new URLSearchParams({ name: studentName, game_id: currentGame, attempt: attempt, status: status, details: details.join(" | ") }); fetch(TRACKING_URL + "?" + params.toString(), { mode: 'no-cors' }).catch(() => {}); }
function switchTab(tab) {
  const tabS = document.getElementById("tab-student"); const tabT = document.getElementById("tab-teacher"); const pS = document.getElementById("panel-student"); const pT = document.getElementById("panel-teacher");
  if(tabS) tabS.classList.toggle("active", tab === "student"); if(tabT) tabT.classList.toggle("active", tab === "teacher"); if(pS) pS.classList.toggle("hidden", tab !== "student"); if(pT) pT.classList.toggle("hidden", tab !== "teacher");
  if (tab === "teacher") loadTeacherData();
}
function promptTeacherPin() { const modal = document.getElementById("pin-modal"); const input = document.getElementById("pin-input"); if (modal) modal.classList.remove("hidden"); if (input) { input.value = ""; input.focus(); } }
function closePinModal() { const modal = document.getElementById("pin-modal"); if(modal) modal.classList.add("hidden"); }
function submitPin() { const input = document.getElementById("pin-input"); if (!input) return; if (input.value.trim() === TEACHER_PIN) { closePinModal(); switchTab("teacher"); } else { document.getElementById("pin-error").textContent = "Incorrect PIN."; input.value = ""; input.focus(); } }
function resetSession() { sessionStart = Date.now(); loadTeacherData(); }
function loadTeacherData() {
  const container = document.getElementById("teacher-results"); if(!container) return; container.innerHTML = "<p>Loading results...</p>";
  fetch(TRACKING_CSV_URL + "&t=" + Date.now()).then(r => r.text()).then(text => { const rows = parseCSV(text); const filtered = sessionStart ? rows.filter(r => new Date(r["Timestamp"]).getTime() >= sessionStart) : rows; renderTeacherTable(filtered.reverse()); }).catch(() => { container.innerHTML = "<p>Could not load results.</p>"; });
}
function renderTeacherTable(rows) {
  const container = document.getElementById("teacher-results"); if (!container) return; if (rows.length === 0) { container.innerHTML = "<p>No results yet.</p>"; return; }
  const headers = ["Timestamp", "Name", "Game_ID", "Attempt", "Status", "Details"]; let html = "<table id='results-table'><thead><tr>"; headers.forEach(h => { html += "<th>" + h + "</th>"; }); html += "</tr></thead><tbody>"; rows.forEach(row => { html += "<tr>"; headers.forEach(h => { html += "<td>" + (row[h] || "") + "</td>"; }); html += "</tr>"; }); html += "</tbody></table>"; container.innerHTML = html;
}
setInterval(() => { const t = document.getElementById("panel-teacher"); if (t && !t.classList.contains("hidden")) loadTeacherData(); }, REFRESH_INTERVAL);

// ── Utils ────────────────────────────────────────────────────
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function showError(msg) { showScreen("screen-error"); const errEl = document.getElementById("error-message"); if (errEl) errEl.textContent = msg; }
