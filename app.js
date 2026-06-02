// ============================================================ // Fix
the Paragraph — app.js //
============================================================

const LIBRARY_CSV_URL =
“https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv”;
const TRACKING_CSV_URL =
“https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv”;
const TRACKING_URL =
“https://script.google.com/macros/s/AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91UOTkXuSJJWiWMEHQ/exec”;
const TEACHER_PIN = “9999”; const REFRESH_INTERVAL = 15000;

// ── State ──────────────────────────────────────────────────── let
studentName = ““; let activities = {}; // { game_id: { title, parts: [],
distractors: [] } } let currentGame = null; // game_id string let
sessionStart = null; // timestamp when session was reset (for teacher
filter) let dragSrcEl = null;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener(“DOMContentLoaded”, () => {
showScreen(“screen-name”);
document.getElementById(“btn-start”).addEventListener(“click”,
handleNameSubmit);
document.getElementById(“btn-check”).addEventListener(“click”,
checkAnswer);
document.getElementById(“btn-retry”).addEventListener(“click”,
retryActivity);
document.getElementById(“btn-library”).addEventListener(“click”, () =>
showLibrary());
document.getElementById(“tab-student”).addEventListener(“click”, () =>
switchTab(“student”));
document.getElementById(“tab-teacher”).addEventListener(“click”, () =>
promptTeacherPin());
document.getElementById(“btn-pin-submit”).addEventListener(“click”,
submitPin);
document.getElementById(“btn-pin-cancel”).addEventListener(“click”,
closePinModal);
document.getElementById(“btn-reset-session”).addEventListener(“click”,
resetSession);
document.getElementById(“pin-input”).addEventListener(“keydown”, e => {
if (e.key === “Enter”) submitPin(); }); });

// ── Screens ──────────────────────────────────────────────────
function showScreen(id) { document.querySelectorAll(“.screen”).forEach(s
=> s.classList.remove(“active”)); const el =
document.getElementById(id); if (el) el.classList.add(“active”); }

// ── Name Entry ───────────────────────────────────────────────
function handleNameSubmit() { const input =
document.getElementById(“input-name”); const name = input.value.trim();
if (!name) { input.classList.add(“error”); input.placeholder = “Please
enter your name”; return; } input.classList.remove(“error”); studentName
= name; loadLibrary(); }

// ── CSV Parsing ───────────────────────────────────────────────
function parseCSV(text) { const rows = []; const lines = text.split(//);
const headers = splitCSVLine(lines[0]); for (let i = 1; i <
lines.length; i++) { if (!lines[i].trim()) continue; const values =
splitCSVLine(lines[i]); const row = {}; headers.forEach((h, idx) => {
row[h.trim()] = (values[idx] || ““).trim(); }); rows.push(row); } return
rows; }

function splitCSVLine(line) { const result = []; let current = ““; let
inQuotes = false; for (let i = 0; i < line.length; i++) { const ch =
line[i]; if (ch === ‘“‘) { if (inQuotes && line[i + 1] ===’”’) { current
+= ’”’; i++; } else { inQuotes = !inQuotes; } } else if (ch === “,” &&
!inQuotes) { result.push(current); current = ““; } else { current += ch;
} } result.push(current); return result; }

// ── Library Loading ───────────────────────────────────────────
function loadLibrary() { showScreen(“screen-loading”);
fetch(LIBRARY_CSV_URL) .then(r => r.text()) .then(text => { const rows =
parseCSV(text); buildActivities(rows); const activeGames =
Object.keys(activities); if (activeGames.length === 0) { showError(“No
active activities found. Ask your teacher to activate one.”); return; }
if (activeGames.length === 1) { // Auto-land on the single active
activity startActivity(activeGames[0]); } else { showLibrary(); } })
.catch(() => showError(“Couldn’t load activities. Please try again.”));
}

function buildActivities(rows) { activities = {}; rows.forEach(row => {
const status = (row[“Status”] || ““).toLowerCase(); if (status
!==”active”) return; const id = row[“Game_ID”]; const type =
(row[“Type”] || ““).toLowerCase(); if (!id) return; if (!activities[id])
{ activities[id] = { title: row[“Title”] || id, parts: [], distractors:
[] }; } // Title is only on the first row — preserve it if
(row[“Title”]) activities[id].title = row[“Title”];

    const item = { text: row["Text"], label: row["Label"], hint: row["Hint"] };
    if (type === "distractor") {
      activities[id].distractors.push(item);
    } else {
      activities[id].parts.push(item);
    }

}); }

// ── Library Screen ────────────────────────────────────────────
function showLibrary() { showScreen(“screen-library”); const list =
document.getElementById(“library-list”); list.innerHTML = ““;
Object.entries(activities).forEach(([id, game]) => { const card =
document.createElement(”button”); card.className = “activity-card”;
card.innerHTML =
<span class="card-title">${game.title}</span>       <span class="card-meta">${game.parts.length} sentences${game.distractors.length ? +
game.distractors.lengthdistractor{game.distractors.length > 1 ? “s” :
““}: ""}</span>; card.addEventListener(”click”, () =>
startActivity(id)); list.appendChild(card); }); }

// ── Activity ──────────────────────────────────────────────────
function startActivity(gameId) { currentGame = gameId; const game =
activities[gameId]; renderActivity(game); showScreen(“screen-activity”);
}

function renderActivity(game) {
document.getElementById(“activity-title”).textContent = game.title;

// Combine parts + distractors, shuffle const allSentences = [
…game.parts.map(p => ({ …p, isDistractor: false })),
…game.distractors.map(d => ({ …d, isDistractor: true })) ];
shuffle(allSentences);

// Choice pool const pool = document.getElementById(“choice-pool”);
pool.innerHTML = ““; allSentences.forEach((item, i) => { const chip =
createChip(item, i); pool.appendChild(chip); });

// Drop zone const dropZone = document.getElementById(“drop-zone”);
dropZone.innerHTML = ““; dropZone.addEventListener(”dragover”,
onDragOver); dropZone.addEventListener(“drop”, e => onDrop(e,
dropZone));

// Pool also accepts drops back pool.addEventListener(“dragover”,
onDragOver); pool.addEventListener(“drop”, e => onDrop(e, pool));

// Reset feedback document.getElementById(“feedback”).textContent = ““;
document.getElementById(”btn-check”).style.display = “inline-flex”;
document.getElementById(“btn-retry”).style.display = “none”; }

function createChip(item, index) { const chip =
document.createElement(“div”); chip.className = “sentence-chip”;
chip.draggable = true; chip.dataset.index = index;
chip.dataset.distractor = item.isDistractor ? “true” : “false”;
chip.dataset.label = item.label || ““; chip.textContent = item.text;
chip.title = item.hint ||”“;

chip.addEventListener(“dragstart”, onDragStart);
chip.addEventListener(“dragend”, onDragEnd);

// Touch support chip.addEventListener(“touchstart”, onTouchStart, {
passive: true }); chip.addEventListener(“touchmove”, onTouchMove, {
passive: false }); chip.addEventListener(“touchend”, onTouchEnd);

return chip; }

// ── Drag & Drop (mouse) ───────────────────────────────────────
function onDragStart(e) { dragSrcEl = this; e.dataTransfer.effectAllowed
= “move”; e.dataTransfer.setData(“text/plain”, this.dataset.index);
setTimeout(() => this.classList.add(“dragging”), 0); }

function onDragEnd() { this.classList.remove(“dragging”);
document.querySelectorAll(“.drop-target-over”).forEach(el =>
el.classList.remove(“drop-target-over”)); }

function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect =
“move”; this.classList.add(“drop-target-over”); }

function onDrop(e, container) { e.preventDefault();
container.classList.remove(“drop-target-over”); if (!dragSrcEl) return;

// Find chip under cursor for ordering const target =
e.target.closest(“.sentence-chip”); if (target && target !== dragSrcEl
&& target.parentNode === container) { const rect =
target.getBoundingClientRect(); const after = e.clientY > rect.top +
rect.height / 2; container.insertBefore(dragSrcEl, after ?
target.nextSibling : target); } else { container.appendChild(dragSrcEl);
} dragSrcEl = null; }

// ── Touch Drag ──────────────────────────────────────────────── let
touchChip = null, touchClone = null, touchOffsetX = 0, touchOffsetY = 0;

function onTouchStart(e) { touchChip = this; const touch = e.touches[0];
const rect = this.getBoundingClientRect(); touchOffsetX =
touch.clientX - rect.left; touchOffsetY = touch.clientY - rect.top;

touchClone = this.cloneNode(true);
touchClone.classList.add(“touch-clone”); touchClone.style.width =
rect.width + “px”; touchClone.style.left = (touch.clientX -
touchOffsetX) + “px”; touchClone.style.top = (touch.clientY -
touchOffsetY) + “px”; document.body.appendChild(touchClone);
this.classList.add(“dragging”); }

function onTouchMove(e) { e.preventDefault(); const touch =
e.touches[0]; if (touchClone) { touchClone.style.left = (touch.clientX -
touchOffsetX) + “px”; touchClone.style.top = (touch.clientY -
touchOffsetY) + “px”; } }

function onTouchEnd(e) { if (touchClone) { touchClone.remove();
touchClone = null; } if (!touchChip) return;
touchChip.classList.remove(“dragging”);

const touch = e.changedTouches[0]; const el =
document.elementFromPoint(touch.clientX, touch.clientY); const pool =
document.getElementById(“choice-pool”); const dropZone =
document.getElementById(“drop-zone”);

let container = null; if (el && (el === dropZone ||
dropZone.contains(el))) container = dropZone; else if (el && (el ===
pool || pool.contains(el))) container = pool;

if (container) { const target = el.closest(“.sentence-chip”); if (target
&& target !== touchChip && target.parentNode === container) {
container.insertBefore(touchChip, target); } else {
container.appendChild(touchChip); } } touchChip = null; }

// ── Check Answer ──────────────────────────────────────────────
function checkAnswer() { const game = activities[currentGame]; const
dropZone = document.getElementById(“drop-zone”); const submitted =
Array.from(dropZone.querySelectorAll(“.sentence-chip”));

if (submitted.length === 0) { showFeedback(“Drag the sentences into the
box first!”, “neutral”); return; }

// Distractors should NOT be in the drop zone const distractorsInZone =
submitted.filter(c => c.dataset.distractor === “true”); // Parts should
all be in drop zone const partsInZone = submitted.filter(c =>
c.dataset.distractor !== “true”); const correctParts = game.parts;

// Check order let orderCorrect = partsInZone.length ===
correctParts.length; if (orderCorrect) { partsInZone.forEach((chip, i)
=> { if (chip.textContent !== correctParts[i].text) orderCorrect =
false; }); }

const noDistractors = distractorsInZone.length === 0; const
allPartsPresent = partsInZone.length === correctParts.length;

const perfect = orderCorrect && noDistractors && allPartsPresent; const
partial = allPartsPresent && noDistractors && !orderCorrect;

// Visual feedback on chips submitted.forEach(chip => {
chip.classList.remove(“correct”, “incorrect”, “distractor-warning”); if
(chip.dataset.distractor === “true”) {
chip.classList.add(“distractor-warning”); } else { const idx =
partsInZone.indexOf(chip); chip.classList.add(idx >= 0 &&
chip.textContent === correctParts[idx]?.text ? “correct” : “incorrect”);
} });

let status, message; if (perfect) { status = “correct”; message = “🎉
Perfect! You got the order exactly right and spotted the
distractor(s).”; } else if (noDistractors && !orderCorrect) { status =
“partial”; message = “✅ Good — you kept the distractors out! But check
the order of your sentences.”; } else if (!noDistractors &&
orderCorrect) { status = “partial”; message = “⚠️ The order is right,
but there’s a sentence in there that doesn’t belong — can you spot it?”;
} else { status = “incorrect”; message = “❌ Not quite. Check which
sentences belong and what order they go in.”; }

showFeedback(message, status); trackAttempt(status, submitted.map(c =>
c.textContent));

document.getElementById(“btn-check”).style.display = “none”;
document.getElementById(“btn-retry”).style.display = “inline-flex”; }

function showFeedback(message, type) { const fb =
document.getElementById(“feedback”); fb.textContent = message;
fb.className = “feedback” + type; }

function retryActivity() { renderActivity(activities[currentGame]); }

// ── Tracking ──────────────────────────────────────────────────
function trackAttempt(status, details) { const payload = { Name:
studentName, Game_ID: currentGame, Status: status, Details:
details.join(” | “) };

// Cogniti telemetry if (typeof InteractivesTelemetry !== “undefined”) {
InteractivesTelemetry.track(“attempt”, payload); }

// Google Sheet tracking const params = new URLSearchParams({ name:
studentName, game_id: currentGame, status: status, details:
details.join(” | “) });
fetch(${TRACKING_URL}?${params.toString()}).catch(() => {}); }

// ── Teacher Tab ───────────────────────────────────────────────
function switchTab(tab) {
document.getElementById(“tab-student”).classList.toggle(“active”, tab
=== “student”);
document.getElementById(“tab-teacher”).classList.toggle(“active”, tab
=== “teacher”);
document.getElementById(“panel-student”).classList.toggle(“hidden”, tab
!== “student”);
document.getElementById(“panel-teacher”).classList.toggle(“hidden”, tab
!== “teacher”); if (tab === “teacher”) loadTeacherData(); }

function promptTeacherPin() {
document.getElementById(“pin-modal”).classList.remove(“hidden”);
document.getElementById(“pin-input”).value = ““;
document.getElementById(”pin-input”).focus();
document.getElementById(“pin-error”).textContent = ““; }

function closePinModal() {
document.getElementById(“pin-modal”).classList.add(“hidden”); }

function submitPin() { const entered =
document.getElementById(“pin-input”).value.trim(); if (entered ===
TEACHER_PIN) { closePinModal(); switchTab(“teacher”); } else {
document.getElementById(“pin-error”).textContent = “Incorrect PIN. Try
again.”; document.getElementById(“pin-input”).value = ““;
document.getElementById(”pin-input”).focus(); } }

function resetSession() { sessionStart = Date.now(); loadTeacherData();
}

function loadTeacherData() { const container =
document.getElementById(“teacher-results”); container.innerHTML = “
Loading results…
“; fetch(TRACKING_CSV_URL) .then(r => r.text()) .then(text => { const
rows = parseCSV(text); const filtered = sessionStart ? rows.filter(r =>
new Date(r[”Timestamp”]).getTime() >= sessionStart) : rows;
renderTeacherTable(filtered); }) .catch(() => { container.innerHTML =”
Could not load results.
“; }); }

function renderTeacherTable(rows) { const container =
document.getElementById(“teacher-results”); if (rows.length === 0) {
container.innerHTML = “
No results yet.
“; return; } const headers = [”Timestamp”, ”Name”, ”Game_ID”, ”Attempt”,
”Status”, ”Details”]; let html =”

“; headers.forEach(h => { html += <th>${h}</th>; }); html +=”
“; rows.forEach(row => { html +=”
“; headers.forEach(h => { html += <td>${row[h] || ""}</td>; }); html +=”
“; }); html +=”

“; container.innerHTML = html; }

// Auto-refresh teacher data setInterval(() => { const teacherPanel =
document.getElementById(“panel-teacher”); if (teacherPanel &&
!teacherPanel.classList.contains(“hidden”)) { loadTeacherData(); } },
REFRESH_INTERVAL);

// ── Utilities ─────────────────────────────────────────────────
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i–) { const
j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j],
arr[i]]; } return arr; }

function showError(msg) { showScreen(“screen-error”);
document.getElementById(“error-message”).textContent = msg; }
