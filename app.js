// ============================================================= //
CONFIG — update these two URLs //
============================================================= const
TRACKING_URL =
“https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec”;

// Paste your TRACKING sheet published-as-CSV URL here. // See setup
instructions below for how to get this. const TRACKING_CSV_URL =
“https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=tsv”;

const TEACHER_PIN = “9999”; const SESSION_RESET_KEY =
“ftp_session_reset_ts”; const POLL_INTERVAL_MS = 30000; // 30 seconds

// ============================================================= //
HELPERS // =============================================================

function parseCSVToObjects(text) { const lines = text.trim().split(“”);
if (lines.length < 2) return []; const headers =
lines[0].split(“,”).map((h) =>
h.trim().replace(/^“|”$/g, ""));  return lines.slice(1).map((line) => {  const values = [];  let inQuotes = false;  let cur = "";  for (const ch of line) {  if (ch === '"') { inQuotes = !inQuotes; }  else if (ch === "," && !inQuotes) { values.push(cur); cur = ""; }  else { cur += ch; }  }  values.push(cur);  const obj = {};  headers.forEach((h, i) => {  obj[h] = values[i] ? values[i].trim().replace(/^"|"$/g,
““) :”“; }); return obj; }); }

function getResetTimestamp() { const stored =
localStorage.getItem(SESSION_RESET_KEY); return stored ?
parseInt(stored, 10) : 0; }

function setResetTimestamp() { localStorage.setItem(SESSION_RESET_KEY,
Date.now().toString()); }

function sendTrackingData(playerName, gameId, attempt, status, details)
{ if (!TRACKING_URL || TRACKING_URL.includes(“YOUR_APPS_SCRIPT_URL”))
return; const params = new URLSearchParams({ name: playerName, gameId:
gameId || “unknown”, attempt: attempt, status: status, details: details
|| ““, }); fetch(TRACKING_URL +”?” + params.toString(), { mode:
“no-cors” }).catch( (err) => console.warn(“Tracking error (safe to
ignore):”, err) ); }

// ============================================================= //
STYLES (injected once) //
============================================================= const
STYLES = ` , ::before, *::after { box-sizing: border-box; margin: 0;
padding: 0; }

:root { –bg: #f3f4f6; –surface: #ffffff; –border: #d1d5db; –text:
#1f2937; –muted: #6b7280; –primary: #3b82f6; –primary-hover: #2563eb;
–success: #10b981; –warning-bg: #fef3c7; –warning-text: #92400e;
–danger: #ef4444; –radius: 10px; –shadow: 0 2px 8px rgba(0,0,0,0.08); }

body { font-family: ‘Segoe UI’, system-ui, sans-serif; background:
var(–bg); color: var(–text); min-height: 100vh; }

/* —- App shell —- */ .app-shell { max-width: 860px; margin: 0 auto;
padding: 20px 16px 40px; }

/* —- Tabs —- */ .tab-bar { display: flex; gap: 4px; border-bottom: 2px
solid var(–border); margin-bottom: 24px; } .tab-btn { padding: 10px
20px; border: none; background: none; font-size: 15px; font-weight: 600;
color: var(–muted); cursor: pointer; border-bottom: 3px solid
transparent; margin-bottom: -2px; border-radius: 6px 6px 0 0;
transition: color 0.15s, border-color 0.15s; } .tab-btn:hover { color:
var(–primary); } .tab-btn.active { color: var(–primary);
border-bottom-color: var(–primary); }

/* —- Cards —- */ .card { background: var(–surface); border-radius:
var(–radius); box-shadow: var(–shadow); padding: 24px; margin-bottom:
20px; }

/* —- Buttons —- */ .btn { display: inline-flex; align-items: center;
gap: 6px; padding: 10px 20px; border-radius: 7px; font-size: 15px;
font-weight: 600; border: none; cursor: pointer; transition: background
0.15s, transform 0.1s; } .btn:active { transform: scale(0.97); }
.btn-primary { background: var(–primary); color: #fff; }
.btn-primary:hover { background: var(–primary-hover); } .btn-success {
background: var(–success); color: #fff; } .btn-success:hover {
background: #059669; } .btn-danger { background: var(–danger); color:
#fff; } .btn-danger:hover { background: #dc2626; } .btn-outline {
background: transparent; color: var(–primary); border: 2px solid
var(–primary); } .btn-outline:hover { background: #eff6ff; } .btn-full {
width: 100%; justify-content: center; margin-top: 16px; padding: 14px;
font-size: 17px; }

/* —- Form inputs —- */ .input { width: 100%; padding: 10px 14px;
border: 2px solid var(–border); border-radius: 7px; font-size: 15px;
outline: none; transition: border-color 0.15s; } .input:focus {
border-color: var(–primary); }

/* —- Modal overlay —- */ .modal-overlay { position: fixed; inset: 0;
background: rgba(0,0,0,0.5); display: flex; align-items: center;
justify-content: center; z-index: 200; } .modal-box { background:
var(–surface); border-radius: 14px; padding: 32px 28px; max-width:
400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.15); text-align:
center; } .modal-box h2 { font-size: 22px; margin-bottom: 10px; }
.modal-box p { color: var(–muted); margin-bottom: 18px; font-size: 15px;
}

/* —- No-config banner —- */ .no-config-banner { text-align: center;
padding: 48px 24px; } .no-config-banner .icon { font-size: 48px;
margin-bottom: 16px; } .no-config-banner h2 { font-size: 22px;
margin-bottom: 10px; } .no-config-banner p { color: var(–muted);
font-size: 15px; line-height: 1.6; }

/* —- Distractor warning —- */ .distractor-warning { background:
var(–warning-bg); color: var(–warning-text); padding: 10px 16px;
border-radius: 7px; font-weight: 600; font-size: 14px; margin-bottom:
20px; text-align: center; }

/* —- Board —- */ .board { display: flex; flex-direction: column; gap:
10px; margin-bottom: 24px; } .slot-row { display: flex; width: 100%;
min-height: 64px; } .sem-label { width: 130px; flex-shrink: 0; display:
flex; align-items: center; justify-content: center; text-align: center;
font-size: 13px; font-weight: 700; border: 2px solid #000; border-right:
none; border-radius: 8px 0 0 8px; padding: 8px; } .drop-slot {
flex-grow: 1; border: 2px dashed var(–border); border-radius: 0 8px 8px
0; background: #f9fafb; min-height: 64px; display: flex; align-items:
center; padding: 5px; transition: background 0.2s; }
.drop-slot.drag-over { background: #eff6ff; border-color: var(–primary);
}

/* —- Pool —- */ .pool { border: 2px solid var(–border); border-radius:
var(–radius); background: var(–surface); padding: 16px; display: flex;
flex-direction: column; gap: 8px; min-height: 80px; } .pool-title {
font-size: 13px; font-weight: 700; color: var(–muted); text-transform:
uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

/* —- Part cards —- */ .part-card { background: #fff; border: 2px solid
#e5e7eb; border-radius: 7px; padding: 12px 14px; font-size: 15px;
cursor: grab; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex;
justify-content: space-between; align-items: center; word-break:
break-word; transition: box-shadow 0.15s; user-select: none; }
.part-card:active { cursor: grabbing; box-shadow: 0 4px 12px
rgba(0,0,0,0.12); } .part-card.correct { border-color: var(–success); }
.tick { color: var(–success); font-weight: 700; font-size: 18px;
display: none; } .part-card.correct .tick { display: inline; }
.completed-row .sem-label { border-color: transparent; } .completed-row
.drop-slot { border-color: transparent; background: transparent; }
.completed-row .part-card { border-color: transparent; box-shadow: none;
font-weight: 600; }

/* —- Hint modal content —- */ .hint-header { color: #d97706; font-size:
20px; font-weight: 700; margin-bottom: 12px; } .hint-body { font-size:
15px; color: #374151; line-height: 1.6; margin-bottom: 20px; }

/* —- Teacher setup form —- */ .form-group { margin-bottom: 18px; }
.form-label { display: block; font-size: 14px; font-weight: 600;
margin-bottom: 6px; color: var(–text); } .form-row { display: grid;
grid-template-columns: 1fr 1fr; gap: 16px; } .section-title { font-size:
17px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px;
border-bottom: 2px solid var(–border); }

/* —- Part rows in setup —- */ .part-row { display: flex; gap: 8px;
align-items: center; background: #f9fafb; border: 1px solid
var(–border); border-radius: 8px; padding: 10px 12px; margin-bottom:
8px; } .part-row .drag-handle { cursor: grab; color: var(–muted);
font-size: 18px; flex-shrink: 0; } .part-row .part-num { font-weight:
700; font-size: 13px; color: var(–muted); width: 24px; flex-shrink: 0; }
.part-row input { flex-grow: 1; } .part-row .color-swatch { width: 32px;
height: 32px; border-radius: 5px; border: 1px solid var(–border);
cursor: pointer; flex-shrink: 0; } .remove-btn { background: none;
border: none; color: #f87171; font-size: 18px; cursor: pointer;
flex-shrink: 0; line-height: 1; } .remove-btn:hover { color:
var(–danger); }

/* —- Share panel —- */ .share-url-box { display: flex; gap: 8px;
align-items: center; background: #f9fafb; border: 2px solid
var(–border); border-radius: 8px; padding: 10px 14px; font-size: 14px;
word-break: break-all; } .copy-btn { flex-shrink: 0; }

/* —- Library —- */ .library-grid { display: flex; flex-direction:
column; gap: 10px; } .library-item { display: flex; justify-content:
space-between; align-items: center; background: #f9fafb; border: 1px
solid var(–border); border-radius: 8px; padding: 12px 16px; }
.library-item-title { font-weight: 600; font-size: 15px; }
.library-item-meta { font-size: 13px; color: var(–muted); margin-top:
2px; } .library-actions { display: flex; gap: 8px; }

/* —- Session summary —- */ .summary-header { display: flex;
justify-content: space-between; align-items: center; margin-bottom:
20px; flex-wrap: wrap; gap: 10px; } .traffic-light { display:
inline-flex; align-items: center; gap: 10px; font-size: 28px;
font-weight: 800; } .traffic-light .label { font-size: 15px;
font-weight: 700; } .tl-green .label { color: #059669; } .tl-amber
.label { color: #d97706; } .tl-red .label { color: #dc2626; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit,
minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px; } .stat-box {
background: #f9fafb; border: 1px solid var(–border); border-radius: 8px;
padding: 14px; text-align: center; } .stat-value { font-size: 28px;
font-weight: 800; color: var(–text); line-height: 1; } .stat-label {
font-size: 12px; color: var(–muted); margin-top: 4px; text-transform:
uppercase; letter-spacing: 0.04em; }

.student-table { width: 100%; border-collapse: collapse; font-size:
14px; } .student-table th { text-align: left; padding: 8px 12px;
border-bottom: 2px solid var(–border); font-size: 12px; text-transform:
uppercase; letter-spacing: 0.05em; color: var(–muted); } .student-table
td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
.student-table tr:last-child td { border-bottom: none; } .status-badge {
display: inline-block; padding: 3px 10px; border-radius: 20px;
font-size: 12px; font-weight: 700; } .badge-success { background:
#d1fae5; color: #065f46; } .badge-trying { background: #fef3c7; color:
#92400e; }

.refresh-note { font-size: 13px; color: var(–muted); margin-top: 12px;
text-align: right; } .csv-notice { background: #eff6ff; border: 1px
solid #bfdbfe; border-radius: 8px; padding: 14px 16px; font-size: 14px;
color: #1e40af; line-height: 1.6; margin-bottom: 20px; }

/* —- Toast —- */ .toast { position: fixed; bottom: 24px; left: 50%;
transform: translateX(-50%); background: #1f2937; color: #fff; padding:
12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;
z-index: 300; animation: fadeInUp 0.3s ease; } @keyframes fadeInUp {
from { opacity: 0; transform: translateX(-50%) translateY(12px); } to {
opacity: 1; transform: translateX(-50%) translateY(0); } }

/* —- Misc —- */ .visually-hidden { position: absolute; width: 1px;
height: 1px; overflow: hidden; clip: rect(0,0,0,0); } .error-text {
color: var(–danger); font-size: 14px; margin-top: 6px; } .empty-state {
text-align: center; color: var(–muted); padding: 32px; font-size: 15px;
} `;

// ============================================================= //
INJECT STYLES //
============================================================= (function
injectStyles() { const el = document.createElement(“style”);
el.textContent = STYLES; document.head.appendChild(el); })();

// ============================================================= //
CONSTANTS //
============================================================= const
DEFAULT_COLORS = [ “#fbbf24”,“#34d399”,“#60a5fa”,“#f87171”,“#a78bfa”,
“#fb923c”,“#2dd4bf”,“#e879f9”,“#facc15”,“#94a3b8”,]; const LABEL_PRESETS
= [ “Topic sentence”,“Supporting idea 1”,“Supporting idea 2”,
“Supporting idea 3”,“Concluding
sentence”,“Evidence”,“Analysis”,“Example”,];

// ============================================================= //
REACT APP //
============================================================= const {
useState, useEffect, useRef, useCallback } = React;

// ———- Toast ———- function Toast({ message, onDone }) { useEffect(() =>
{ const t = setTimeout(onDone, 2800); return () => clearTimeout(t); },
[onDone]); return React.createElement(“div”, { className: “toast”, role:
“status” }, message); }

// ———- Name modal ———- function NameModal({ onConfirm }) { const [name,
setName] = useState(““); const [error, setError] = useState(”“); const
inputRef = useRef(null); useEffect(() => { inputRef.current?.focus(); },
[]); function handleSubmit(e) { e.preventDefault(); if (!name.trim()) {
setError(”Please enter your name.”); return; } onConfirm(name.trim()); }
return React.createElement( “div”, { className: “modal-overlay”, role:
“dialog”, “aria-modal”: “true”, “aria-labelledby”: “name-modal-title” },
React.createElement( “div”, { className: “modal-box” },
React.createElement(“h2”, { id: “name-modal-title” }, “Welcome! 👋”),
React.createElement(“p”, null, “Please enter your name to begin.”),
React.createElement( “form”, { onSubmit: handleSubmit },
React.createElement(“input”, { ref: inputRef, className: “input”, type:
“text”, placeholder: “Your name”, value: name, onChange: e =>
setName(e.target.value), “aria-label”: “Enter your name”, autoComplete:
“given-name”, }), error && React.createElement(“p”, { className:
“error-text”, role: “alert” }, error), React.createElement(“button”, {
type: “submit”, className: “btn btn-primary btn-full” }, “Start
Activity”) ) ) ); }

// ———- Hint modal ———- function HintModal({ hint, onClose }) {
useEffect(() => { const handler = (e) => { if (e.key === “Escape”)
onClose(); }; document.addEventListener(“keydown”, handler); return ()
=> document.removeEventListener(“keydown”, handler); }, [onClose]);
return React.createElement( “div”, { className: “modal-overlay”, role:
“dialog”, “aria-modal”: “true”, “aria-labelledby”: “hint-title” },
React.createElement( “div”, { className: “modal-box” },
React.createElement(“div”, { className: “hint-header”, id: “hint-title”
}, “💡 Here’s a Hint”), React.createElement(“div”, { className:
“hint-body” }, hint), React.createElement(“button”, { className: “btn
btn-primary”, onClick: onClose }, “Keep Trying”) ) ); }

// ———- PIN modal ———- function PinModal({ onSuccess, onCancel }) {
const [pin, setPin] = useState(““); const [error, setError] =
useState(”“); const inputRef = useRef(null); useEffect(() => {
inputRef.current?.focus(); }, []); function handleSubmit(e) {
e.preventDefault(); if (pin === TEACHER_PIN) { onSuccess(); } else {
setError(”Incorrect PIN. Please try again.”); setPin(““); } } return
React.createElement(”div”, { className: “modal-overlay”, role: “dialog”,
“aria-modal”: “true”, “aria-labelledby”: “pin-title” },
React.createElement( “div”, { className: “modal-box” },
React.createElement(“h2”, { id: “pin-title” }, “🔒 Teacher Access”),
React.createElement(“p”, null, “Enter the teacher PIN to continue.”),
React.createElement( “form”, { onSubmit: handleSubmit },
React.createElement(“input”, { ref: inputRef, className: “input”, type:
“password”, inputMode: “numeric”, placeholder: “PIN”, value: pin,
onChange: e => setPin(e.target.value), “aria-label”: “Teacher PIN”, }),
error && React.createElement(“p”, { className: “error-text”, role:
“alert” }, error), React.createElement( “div”, { style: { display:
“flex”, gap: “10px”, marginTop: “16px” } },
React.createElement(“button”, { type: “button”, className: “btn
btn-outline”, style: { flex: 1 }, onClick: onCancel }, “Cancel”),
React.createElement(“button”, { type: “submit”, className: “btn
btn-primary”, style: { flex: 1 } }, “Unlock”) ) ) ) ); }

// ============================================================= //
STUDENT VIEW //
============================================================= function
StudentView({ config, playerName }) { const [parts, setParts] =
useState([]); const [poolItems, setPoolItems] = useState([]); const
[slotContents, setSlotContents] = useState({}); const [attemptCount,
setAttemptCount] = useState(0); const [showHint, setShowHint] =
useState(false); const [hintText, setHintText] = useState(““); const
[completed, setCompleted] = useState(false); const boardRef =
useRef(null); const poolRef = useRef(null); const sortablesRef =
useRef([]);

// Build game data from config useEffect(() => { if (!config) return;
const correctParts = (config.parts || []).map((p, i) => ({ id:
part-${i}, text: p.text, label: p.label || Part ${i + 1}, color: p.color
|| DEFAULT_COLORS[i % DEFAULT_COLORS.length], hint: p.hint || ““, }));
const distractorItems = (config.distractors || []).map((d, i) => ({ id:
dist-${i}, text: d.text, label:”distractor”, color: “#e5e7eb”, hint: ““,
})); const shuffled = […correctParts, …distractorItems].sort(() =>
Math.random() - 0.5); setParts(correctParts); setPoolItems(shuffled);
setSlotContents({}); setAttemptCount(0); setCompleted(false); },
[config]);

// Init SortableJS after render useEffect(() => { if (!boardRef.current
|| !poolRef.current || parts.length === 0) return;
sortablesRef.current.forEach(s => s.destroy()); sortablesRef.current =
[];

    const poolEl = poolRef.current;
    sortablesRef.current.push(
      new Sortable(poolEl, {
        group: "parts",
        animation: 150,
        onEnd: syncStateFromDOM,
      })
    );

    const slotEls = boardRef.current.querySelectorAll(".drop-slot");
    slotEls.forEach((slotEl) => {
      sortablesRef.current.push(
        new Sortable(slotEl, {
          group: "parts",
          animation: 150,
          onAdd(evt) {
            // Enforce max 1 per slot — eject existing card back to pool
            if (evt.to.children.length > 1) {
              const existing = Array.from(evt.to.children).find(c => c !== evt.item);
              if (existing) poolEl.appendChild(existing);
            }
            syncStateFromDOM();
          },
          onEnd: syncStateFromDOM,
        })
      );
    });

    return () => { sortablesRef.current.forEach(s => s.destroy()); };

}, [parts]);

function syncStateFromDOM() { if (!boardRef.current) return; const
newSlots = {};
boardRef.current.querySelectorAll(“.drop-slot”).forEach(slotEl => {
const slotId = slotEl.getAttribute(“data-slot-id”); const card =
slotEl.querySelector(“[data-part-id]”); newSlots[slotId] = card ?
card.getAttribute(“data-part-id”) : null; }); setSlotContents({
…newSlots }); }

function checkAnswer() { const newAttempt = attemptCount + 1;
setAttemptCount(newAttempt);

    let allCorrect = true;
    let firstHint = "";
    const details = [];
    const slotEls = boardRef.current?.querySelectorAll(".drop-slot");
    if (!slotEls || slotEls.length === 0) return;

    let placedCount = 0;
    slotEls.forEach(sl => { if (sl.children.length > 0) placedCount++; });
    if (placedCount === 0) {
      alert("Please drag some parts into the slots first!");
      setAttemptCount(newAttempt - 1);
      return;
    }

    slotEls.forEach((slotEl, idx) => {
      const slotId = slotEl.getAttribute("data-slot-id");
      const card = slotEl.querySelector("[data-part-id]");
      const placedId = card ? card.getAttribute("data-part-id") : null;
      const correct = placedId === slotId;
      if (!correct) {
        allCorrect = false;
        const part = parts[idx];
        if (!firstHint && part?.hint) firstHint = part.hint;
        details.push(`Slot ${idx + 1} wrong`);
        // Kick back incorrect card to pool
        if (card) poolRef.current.appendChild(card);
      } else {
        card?.classList.add("correct");
      }
    });

    if (allCorrect) {
      setCompleted(true);
      sendTrackingData(playerName, config?.id || "unknown", newAttempt, "Success", "Completed perfectly");
      // Bloom colours
      slotEls.forEach((slotEl, idx) => {
        const card = slotEl.querySelector("[data-part-id]");
        if (card) card.style.backgroundColor = parts[idx]?.color || "#e5e7eb";
        slotEl.closest(".slot-row")?.classList.add("completed-row");
      });
      setTimeout(() => {
        alert("Brilliant! You've built the paragraph perfectly! 🎉");
        if (config?.perfectGoTo) window.location.href = `?config=${config.perfectGoTo}`;
      }, 500);
    } else {
      sendTrackingData(playerName, config?.id || "unknown", newAttempt, "Try Again", details.join(" | "));
      if (newAttempt >= 3 && config?.stuckGoTo) {
        setTimeout(() => {
          if (window.confirm("This one is tricky! Would you like to try an easier version?")) {
            window.location.href = `?config=${config.stuckGoTo}`;
          }
        }, 600);
      } else if (firstHint) {
        setHintText(firstHint);
        setShowHint(true);
      }
    }

}

if (!config) { return React.createElement( “div”, { className: “card
no-config-banner” }, React.createElement(“div”, { className: “icon” },
“📝”), React.createElement(“h2”, null, “No activity loaded”),
React.createElement(“p”, null, “You need a teacher-generated link to use
this activity. Ask your teacher to share their link with you.”) ); }

const hasDisstractors = (config.distractors || []).length > 0;

return React.createElement( “div”, null, showHint &&
React.createElement(HintModal, { hint: hintText, onClose: () =>
setShowHint(false) }), React.createElement(“div”, { className: “card” },
React.createElement(“h1”, { style: { fontSize: “22px”, fontWeight:
“800”, marginBottom: “6px” } }, config.title || “Fix the Paragraph”),
React.createElement(“p”, { style: { color: “var(–muted)”, fontSize:
“15px”, marginBottom: “20px” } }, “Drag the parts from the pool into the
correct slots to build the paragraph.” ), hasDisstractors &&
React.createElement( “div”, { className: “distractor-warning”, role:
“note” }, “⚠️ Watch out! There are extra parts in the pool that do not
belong.” ), // Board React.createElement( “div”, { className: “board”,
ref: boardRef, “aria-label”: “Paragraph slots” }, parts.map((part) =>
React.createElement( “div”, { key: part.id, className: “slot-row” },
React.createElement( “div”, { className: “sem-label”, style: {
backgroundColor: part.color }, “aria-hidden”: “true”, }, part.label ),
React.createElement( “div”, { className: “drop-slot”, “data-slot-id”:
part.id, “aria-label”: Slot for ${part.label}, } ) ) ) ), // Pool
React.createElement( “div”, { className: “pool”, ref: poolRef,
“aria-label”: “Available parts” }, React.createElement(“div”, {
className: “pool-title” }, “Available Parts”), poolItems.map((item) =>
React.createElement( “div”, { key: item.id, className: “part-card”,
“data-part-id”: item.id, tabIndex: 0, “aria-label”: item.text, },
React.createElement(“span”, null, item.text),
React.createElement(“span”, { className: “tick”, “aria-hidden”: “true”
}, “✔”) ) ) ), React.createElement( “button”, { className: “btn
btn-success btn-full”, onClick: checkAnswer, disabled: completed, },
completed ? “✔ Completed!” : “Check Answer” ) ) ); }

// ============================================================= //
TEACHER SETUP VIEW //
============================================================= function
SetupView({ onSave, onLoadToStudent, initialConfig }) { const [title,
setTitle] = useState(initialConfig?.title || ““); const [configId,
setConfigId] = useState(initialConfig?.id ||”“); const [parts, setParts]
= useState( initialConfig?.parts || [ { text: ””, label:
LABEL_PRESETS[0], color: DEFAULT_COLORS[0], hint: ”” }, { text: ””,
label: LABEL_PRESETS[1], color: DEFAULT_COLORS[1], hint: ”” }, { text:
””, label: LABEL_PRESETS[2], color: DEFAULT_COLORS[2], hint: ”” }, ] );
const [distractors, setDistractors] =
useState(initialConfig?.distractors || []); const [perfectGoTo,
setPerfectGoTo] = useState(initialConfig?.perfectGoTo ||”“); const
[stuckGoTo, setStuckGoTo] = useState(initialConfig?.stuckGoTo ||”“);
const [shareUrl, setShareUrl] = useState(”“); const [errors, setErrors]
= useState({});

function validate() { const e = {}; if (!title.trim()) e.title = “Title
is required.”; if (!configId.trim()) e.configId = “Activity ID is
required.”; else if
(!/[1]+$/.test(configId.trim())) e.configId = "Use only lowercase letters, numbers, and hyphens.";  parts.forEach((p, i) => { if (!p.text.trim()) e[`part_${i}`]
= “Part text is required.”; }); return e; }

function buildConfig() { return { id: configId.trim(), title:
title.trim(), parts: parts.map(p => ({ text: p.text.trim(), label:
p.label, color: p.color, hint: p.hint })), distractors:
distractors.map(d => ({ text: d.text.trim() })).filter(d => d.text),
perfectGoTo: perfectGoTo.trim(), stuckGoTo: stuckGoTo.trim(), }; }

function handleGenerate() { const e = validate(); setErrors(e); if
(Object.keys(e).length > 0) return; const cfg = buildConfig(); const
encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))); const
url =
${window.location.origin}${window.location.pathname}?config=${encoded};
setShareUrl(url); onSave(cfg); }

function handleCopy() { navigator.clipboard.writeText(shareUrl).then(()
=> { alert(“Link copied to clipboard!”); }); }

function addPart() { const idx = parts.length; setParts([…parts, { text:
““, label: LABEL_PRESETS[idx % LABEL_PRESETS.length] || Part ${idx + 1},
color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length], hint:”“, }]); }

function updatePart(idx, field, value) { const updated = parts.map((p,
i) => i === idx ? { …p, [field]: value } : p); setParts(updated); }

function removePart(idx) { setParts(parts.filter((_, i) => i !== idx));
}

function addDistractor() { setDistractors([…distractors, { text: “” }]);
}

function updateDistractor(idx, value) {
setDistractors(distractors.map((d, i) => i === idx ? { text: value } :
d)); }

function removeDistractor(idx) { setDistractors(distractors.filter((_,
i) => i !== idx)); }

return React.createElement( “div”, null, // Activity details
React.createElement( “div”, { className: “card” },
React.createElement(“div”, { className: “section-title” }, “Activity
Details”), React.createElement( “div”, { className: “form-row” },
React.createElement( “div”, { className: “form-group” },
React.createElement(“label”, { className: “form-label”, htmlFor:
“cfg-title” }, “Activity Title”), React.createElement(“input”, { id:
“cfg-title”, className: “input”, type: “text”, placeholder:
“e.g. Research Report Abstract”, value: title, onChange: e =>
setTitle(e.target.value), }), errors.title && React.createElement(“p”, {
className: “error-text” }, errors.title) ), React.createElement( “div”,
{ className: “form-group” }, React.createElement(“label”, { className:
“form-label”, htmlFor: “cfg-id” }, “Activity ID”),
React.createElement(“input”, { id: “cfg-id”, className: “input”, type:
“text”, placeholder: “e.g. abstract-1”, value: configId, onChange: e =>
setConfigId(e.target.value.toLowerCase().replace(/+/g, “-”)), }),
errors.configId && React.createElement(“p”, { className: “error-text” },
errors.configId) ) ) ), // Parts React.createElement( “div”, {
className: “card” }, React.createElement(“div”, { className:
“section-title” }, “Paragraph Parts (in correct order)”),
parts.map((part, idx) => React.createElement( “div”, { key: idx,
className: “part-row” }, React.createElement(“span”, { className:
“part-num” }, ${idx + 1}.), React.createElement(“input”, { className:
“input”, type: “text”, placeholder: Text for part ${idx + 1}, value:
part.text, onChange: e => updatePart(idx, “text”, e.target.value),
“aria-label”: Part ${idx + 1} text, }), React.createElement(“input”, {
className: “input”, type: “text”, placeholder: “Label”, value:
part.label, onChange: e => updatePart(idx, “label”, e.target.value),
style: { maxWidth: “160px” }, “aria-label”: Part ${idx + 1} label, }),
React.createElement(“input”, { type: “color”, className: “color-swatch”,
value: part.color, onChange: e => updatePart(idx, “color”,
e.target.value), title: “Label colour”, “aria-label”:
Part ${idx + 1} colour, }), React.createElement(“input”, { className:
“input”, type: “text”, placeholder: “Hint (optional)”, value: part.hint,
onChange: e => updatePart(idx, “hint”, e.target.value), style: {
maxWidth: “200px” }, “aria-label”: Part ${idx + 1} hint, }),
parts.length > 2 && React.createElement( “button”, { className:
“remove-btn”, onClick: () => removePart(idx), “aria-label”:
Remove part ${idx + 1}, }, “×” ), errors[part_${idx}] &&
React.createElement(“p”, { className: “error-text” },
errors[part_${idx}]) ) ), React.createElement( “button”, { className:
“btn btn-outline”, onClick: addPart, style: { marginTop: “8px” } }, “+
Add Part” ) ), // Distractors React.createElement( “div”, { className:
“card” }, React.createElement(“div”, { className: “section-title” },
“Distractors (optional)”), React.createElement(“p”, { style: { color:
“var(–muted)”, fontSize: “14px”, marginBottom: “14px” } }, “Add extra
sentences that don’t belong. Students must identify and ignore them.” ),
distractors.map((d, idx) => React.createElement( “div”, { key: idx,
className: “part-row” }, React.createElement(“input”, { className:
“input”, type: “text”, placeholder: Distractor ${idx + 1}, value:
d.text, onChange: e => updateDistractor(idx, e.target.value),
“aria-label”: Distractor ${idx + 1}, }), React.createElement(“button”, {
className: “remove-btn”, onClick: () => removeDistractor(idx),
“aria-label”: Remove distractor ${idx + 1}, }, “×”) ) ),
React.createElement( “button”, { className: “btn btn-outline”, onClick:
addDistractor, style: { marginTop: “8px” } }, “+ Add Distractor” ) ), //
Adaptive paths React.createElement( “div”, { className: “card” },
React.createElement(“div”, { className: “section-title” }, “Adaptive
Paths (optional)”), React.createElement( “div”, { className: “form-row”
}, React.createElement( “div”, { className: “form-group” },
React.createElement(“label”, { className: “form-label”, htmlFor:
“perfect-goto” }, “🎉 If Perfect → go to Activity ID”),
React.createElement(“input”, { id: “perfect-goto”, className: “input”,
type: “text”, placeholder: “e.g. abstract-2”, value: perfectGoTo,
onChange: e => setPerfectGoTo(e.target.value), }) ),
React.createElement( “div”, { className: “form-group” },
React.createElement(“label”, { className: “form-label”, htmlFor:
“stuck-goto” }, “🆘 If Stuck (3 attempts) → go to Activity ID”),
React.createElement(“input”, { id: “stuck-goto”, className: “input”,
type: “text”, placeholder: “e.g. abstract-easy”, value: stuckGoTo,
onChange: e => setStuckGoTo(e.target.value), }) ) ) ), // Generate
React.createElement( “div”, { className: “card” }, React.createElement(
“button”, { className: “btn btn-primary btn-full”, onClick:
handleGenerate }, “🔗 Generate Student Link” ), shareUrl &&
React.createElement( “div”, { style: { marginTop: “16px” } },
React.createElement(“p”, { style: { fontWeight: “600”, marginBottom:
“8px” } }, “Share this link with students:”), React.createElement(
“div”, { className: “share-url-box” }, React.createElement(“span”, {
style: { flexGrow: 1 } }, shareUrl), React.createElement( “button”, {
className: “btn btn-outline copy-btn”, onClick: handleCopy }, “Copy” ) )
) ) ); }

// ============================================================= //
SESSION SUMMARY VIEW //
============================================================= function
SessionSummaryView() { const [rows, setRows] = useState([]); const
[lastRefresh, setLastRefresh] = useState(null); const [loading,
setLoading] = useState(false); const [error, setError] = useState(““);
const [resetTs, setResetTs] = useState(getResetTimestamp()); const
intervalRef = useRef(null);

const csvNotConfigured = !TRACKING_CSV_URL || TRACKING_CSV_URL ===
“PASTE_TRACKING_CSV_URL_HERE”;

const fetchData = useCallback(async () => { if (csvNotConfigured)
return; setLoading(true); setError(““); try { const cacheBust =
&t=${Date.now()}; const res = await fetch(TRACKING_CSV_URL + cacheBust);
if (!res.ok) throw new Error(HTTP ${res.status}); const text = await
res.text(); const parsed = parseCSVToObjects(text); setRows(parsed);
setLastRefresh(new Date()); } catch (err) { setError(”Could not load
tracking data. Check that the Tracking sheet is published as CSV.”); }
finally { setLoading(false); } }, [csvNotConfigured]);

useEffect(() => { fetchData(); intervalRef.current =
setInterval(fetchData, POLL_INTERVAL_MS); return () =>
clearInterval(intervalRef.current); }, [fetchData]);

function handleReset() { if (!window.confirm(“Reset session? This will
hide all data from before this moment. The Google Sheet is unchanged.”))
return; setResetTimestamp(); setResetTs(Date.now()); }

// Filter rows after reset timestamp const sessionRows = rows.filter(row
=> { if (!row.Timestamp) return false; const ts = new
Date(row.Timestamp).getTime(); return ts > resetTs; });

// Aggregate stats const totalAttempts = sessionRows.length; const
completions = sessionRows.filter(r => r.Status === “Success”).length;

// Per-student: find each student’s first attempt status const
studentMap = {}; sessionRows.forEach(row => { const name = row.Name ||
“Unknown”; if (!studentMap[name]) studentMap[name] = { attempts: 0,
latestStatus: ““, firstSuccess: false }; studentMap[name].attempts++;
studentMap[name].latestStatus = row.Status; if (parseInt(row.Attempt,
10) === 1 && row.Status ===”Success”) { studentMap[name].firstSuccess =
true; } });

const studentList = Object.entries(studentMap).map(([name, data]) => ({
name, …data })); const firstTryMasters = studentList.filter(s =>
s.firstSuccess).length; const totalStudents = studentList.length; const
firstTryPct = totalStudents > 0 ? Math.round((firstTryMasters /
totalStudents) * 100) : 0;

const tlClass = firstTryPct >= 80 ? “tl-green” : firstTryPct >= 50 ?
“tl-amber” : “tl-red”; const tlEmoji = firstTryPct >= 80 ? “🟢” :
firstTryPct >= 50 ? “🟡” : “🔴”; const tlLabel = firstTryPct >= 80 ?
“Good to move on” : firstTryPct >= 50 ? “Some re-teaching needed” :
“Re-model before moving on”;

if (csvNotConfigured) { return React.createElement( “div”, { className:
“card” }, React.createElement(“div”, { className: “section-title” },
“Session Summary”), React.createElement( “div”, { className:
“csv-notice” }, React.createElement(“strong”, null, “⚙️ Setup
required:”), “To enable live session data, you need to publish the
Tracking sheet as a CSV and paste the URL into the”,
React.createElement(“code”, null, “TRACKING_CSV_URL”), ” constant at the
top of “, React.createElement(”code”, null, “app.js”), “. See the setup
instructions included with this delivery.” ) ); }

return React.createElement( “div”, { className: “card” },
React.createElement( “div”, { className: “summary-header” },
React.createElement(“h2”, { style: { fontSize: “20px”, fontWeight: “800”
} }, “Session Summary”), React.createElement( “div”, { style: { display:
“flex”, gap: “10px”, alignItems: “center” } }, loading &&
React.createElement(“span”, { style: { fontSize: “13px”, color:
“var(–muted)” } }, “Refreshing…”), React.createElement(“button”, {
className: “btn btn-outline”, onClick: fetchData }, “↻ Refresh”),
React.createElement(“button”, { className: “btn btn-danger”, onClick:
handleReset }, “Reset Session”) ) ), error && React.createElement(“p”, {
className: “error-text”, style: { marginBottom: “16px” } }, error),
totalStudents === 0 && !loading && React.createElement( “div”, {
className: “empty-state” }, “No student data yet for this session. Data
will appear here as students complete the activity.” ), totalStudents >
0 && React.createElement( “div”, null, // Traffic light
React.createElement( “div”, { style: { marginBottom: “20px” } },
React.createElement( “div”, { className: traffic-light ${tlClass} },
React.createElement(“span”, null, tlEmoji), React.createElement(“span”,
{ className: “label” }, ${firstTryPct}% first-try success — ${tlLabel})
) ), // Stats grid React.createElement( “div”, { className: “stats-grid”
}, React.createElement(“div”, { className: “stat-box” },
React.createElement(“div”, { className: “stat-value” }, totalStudents),
React.createElement(“div”, { className: “stat-label” }, “Students”) ),
React.createElement(“div”, { className: “stat-box” },
React.createElement(“div”, { className: “stat-value” }, completions),
React.createElement(“div”, { className: “stat-label” }, “Completions”)
), React.createElement(“div”, { className: “stat-box” },
React.createElement(“div”, { className: “stat-value” },
firstTryMasters), React.createElement(“div”, { className: “stat-label”
}, “First-try ✔”) ), React.createElement(“div”, { className: “stat-box”
}, React.createElement(“div”, { className: “stat-value” },
totalAttempts), React.createElement(“div”, { className: “stat-label” },
“Total Attempts”) ) ), // Student table React.createElement( “table”, {
className: “student-table”, “aria-label”: “Student results” },
React.createElement( “thead”, null, React.createElement( “tr”, null,
React.createElement(“th”, null, “Student”), React.createElement(“th”,
null, “Attempts”), React.createElement(“th”, null, “Status”),
React.createElement(“th”, null, “First Try ✔”) ) ), React.createElement(
“tbody”, null, studentList.sort((a, b) =>
a.name.localeCompare(b.name)).map(s => React.createElement( “tr”, { key:
s.name }, React.createElement(“td”, { style: { fontWeight: “600” } },
s.name), React.createElement(“td”, null, s.attempts),
React.createElement( “td”, null, React.createElement( “span”, {
className:
status-badge ${s.latestStatus === "Success" ? "badge-success" : "badge-trying"},
}, s.latestStatus || “—” ) ), React.createElement(“td”, null,
s.firstSuccess ? “✔” : “—”) ) ) ) ) ), lastRefresh &&
React.createElement( “p”, { className: “refresh-note” },
Last updated: ${lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
) ); }

// ============================================================= // MAIN
APP // =============================================================
function App() { const [activeTab, setActiveTab] = useState(“student”);
const [showPin, setShowPin] = useState(false); const [teacherUnlocked,
setTeacherUnlocked] = useState(false); const [playerName, setPlayerName]
= useState(null); const [config, setConfig] = useState(null); const
[toast, setToast] = useState(null); const [library, setLibrary] =
useState(() => { try { return
JSON.parse(localStorage.getItem(“ftp_library”) || “[]”); } catch {
return []; } });

// Load config from URL on mount useEffect(() => { const params = new
URLSearchParams(window.location.search); const encoded =
params.get(“config”); if (encoded) { try { const decoded =
JSON.parse(decodeURIComponent(escape(atob(encoded))));
setConfig(decoded); } catch (e) { console.warn(“Invalid config param”,
e); } } }, []);

function showToast(msg) { setToast(msg); }

function handleTabClick(tab) { if (tab === “teacher” &&
!teacherUnlocked) { setShowPin(true); return; } setActiveTab(tab); }

function handlePinSuccess() { setShowPin(false);
setTeacherUnlocked(true); setActiveTab(“teacher”); }

function handleSaveConfig(cfg) { const updatedLibrary = library.filter(l
=> l.id !== cfg.id); updatedLibrary.unshift(cfg);
setLibrary(updatedLibrary); localStorage.setItem(“ftp_library”,
JSON.stringify(updatedLibrary)); showToast(“Activity saved to library
✔”); }

function handleLoadFromLibrary(cfg) { setConfig(cfg);
setActiveTab(“student”); setPlayerName(null);
showToast(Loaded: ${cfg.title}); }

function handleDeleteFromLibrary(id) { if (!window.confirm(“Delete this
activity from the library?”)) return; const updated = library.filter(l
=> l.id !== id); setLibrary(updated);
localStorage.setItem(“ftp_library”, JSON.stringify(updated));
showToast(“Deleted from library”); }

function handleExportLibrary() { const blob = new
Blob([JSON.stringify(library, null, 2)], { type: “application/json” });
const url = URL.createObjectURL(blob); const a =
document.createElement(“a”); a.href = url; a.download =
“ftp-library.json”; a.click(); URL.revokeObjectURL(url); }

function handleImportLibrary(e) { const file = e.target.files?.[0]; if
(!file) return; const reader = new FileReader(); reader.onload = (ev) =>
{ try { const imported = JSON.parse(ev.target.result); if
(!Array.isArray(imported)) throw new Error(“Invalid format”); const
merged = […library]; imported.forEach(item => { if (!merged.find(m =>
m.id === item.id)) merged.push(item); }); setLibrary(merged);
localStorage.setItem(“ftp_library”, JSON.stringify(merged));
showToast(Imported ${imported.length} activit${imported.length === 1 ? "y" : "ies"} ✔);
} catch { showToast(“❌ Import failed — invalid file.”); } };
reader.readAsText(file); e.target.value = ““; }

const tabs = [ { id: “student”, label: “📝 Activity” }, { id: “teacher”,
label: “⚙️ Setup” }, { id: “library”, label: “📚 Library” }, { id:
“session”, label: “📊 Session” }, ];

return React.createElement( “div”, { className: “app-shell” }, // PIN
modal showPin && React.createElement(PinModal, { onSuccess:
handlePinSuccess, onCancel: () => setShowPin(false), }), // Name modal
(student tab only, if no name yet) activeTab === “student” &&
!playerName && React.createElement(NameModal, { onConfirm:
setPlayerName, }), // Toast toast && React.createElement(Toast, {
message: toast, onDone: () => setToast(null) }), // Tab bar
React.createElement( “div”, { className: “tab-bar”, role: “tablist” },
tabs.map(t => React.createElement( “button”, { key: t.id, className:
tab-btn ${activeTab === t.id ? "active" : ""}, role: “tab”,
“aria-selected”: activeTab === t.id, onClick: () =>
handleTabClick(t.id), }, t.label ) ) ), // Tab panels activeTab ===
“student” && playerName && React.createElement(StudentView, { config,
playerName }), activeTab === “teacher” && React.createElement(SetupView,
{ onSave: handleSaveConfig, onLoadToStudent: handleLoadFromLibrary,
initialConfig: null, }), activeTab === “library” && React.createElement(
“div”, null, React.createElement( “div”, { className: “card” },
React.createElement( “div”, { style: { display: “flex”, justifyContent:
“space-between”, alignItems: “center”, marginBottom: “16px”, flexWrap:
“wrap”, gap: “10px” } }, React.createElement(“h2”, { style: { fontSize:
“18px”, fontWeight: “700” } }, “Saved Activities”), React.createElement(
“div”, { style: { display: “flex”, gap: “8px” } },
React.createElement(“button”, { className: “btn btn-outline”, onClick:
handleExportLibrary }, “⬇ Export”), React.createElement( “label”, {
className: “btn btn-outline”, style: { cursor: “pointer” } }, “⬆
Import”, React.createElement(“input”, { type: “file”, accept: “.json”,
style: { display: “none” }, onChange: handleImportLibrary, }) ) ) ),
library.length === 0 ? React.createElement(“div”, { className:
“empty-state” }, “No activities saved yet. Create one in the Setup
tab.”) : React.createElement( “div”, { className: “library-grid” },
library.map(item => React.createElement( “div”, { key: item.id,
className: “library-item” }, React.createElement( “div”, null,
React.createElement(“div”, { className: “library-item-title” },
item.title), React.createElement(“div”, { className: “library-item-meta”
},
ID: ${item.id} · ${item.parts?.length || 0} parts · ${item.distractors?.length || 0} distractors
) ), React.createElement( “div”, { className: “library-actions” },
React.createElement(“button”, { className: “btn btn-primary”, onClick:
() => handleLoadFromLibrary(item), }, “Load”),
React.createElement(“button”, { className: “btn btn-danger”, onClick: ()
=> handleDeleteFromLibrary(item.id), “aria-label”: Delete ${item.title},
}, “Delete”) ) ) ) ) ) ), activeTab === “session” &&
React.createElement(SessionSummaryView) ); }

// Mount const root =
ReactDOM.createRoot(document.getElementById(“root”));
root.render(React.createElement(App));

[1] a-z0-9-
