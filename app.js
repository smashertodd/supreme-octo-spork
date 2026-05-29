const TRACKING_URL =
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRKIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv;";


const PIN = “9999”; const REFRESH_INTERVAL = 15000;

const { useState, useEffect, useRef, useCallback } = React;

function shuffle(arr) { const a = […arr]; for (let i = a.length - 1; i >
0; i–) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] =
[a[j], a[i]]; } return a; }

function sendTrackingData(name, gameId, attempt, status, details) {
const params = new URLSearchParams({ name: name, gameId: gameId,
attempt: String(attempt), status: status, details: details });
fetch(TRACKING_URL + “?” + params.toString()).catch(function() {}); }

function parseCSV(text) { const lines = text.trim().split(“”); if
(lines.length < 2) return []; const headers =
lines[0].split(“,”).map(function(h) { return
h.trim().replace(/^“|”$/g, ""); });  return lines.slice(1).map(function(line) {  const cols = line.split(",").map(function(c) { return c.trim().replace(/^"|"$/g,
““); }); const obj = {}; headers.forEach(function(h, i) { obj[h] =
cols[i] ||”“; }); return obj; }); }

function useConfig() { const [config, setConfig] = useState(null); const
[error, setError] = useState(null);

useEffect(function() { const params = new
URLSearchParams(window.location.search); const url =
params.get(“config”); if (!url) { setError(“no-config”); return; }
fetch(url) .then(function(r) { return r.text(); }) .then(function(text)
{ const rows = parseCSV(text); if (!rows.length) { setError(“empty”);
return; } const title = rows[0][“title”] || “Fix the Paragraph”; const
gameId = rows[0][“game_id”] || “fix-paragraph”; const sentences =
rows.filter(function(r) { return r[“sentence”]; }).map(function(r) {
return { correct: r[“sentence”].trim(), distractors: [r[“d1”], r[“d2”],
r[“d3”]].filter(Boolean).map(function(d) { return d.trim(); }) }; }); if
(!sentences.length) { setError(“empty”); return; } setConfig({ title:
title, gameId: gameId, sentences: sentences }); }) .catch(function() {
setError(“fetch-failed”); }); }, []);

return { config: config, error: error }; }

function NameModal(props) { const [value, setValue] = useState(““);
const inputRef = useRef(null);

useEffect(function() { if (inputRef.current) inputRef.current.focus();
}, []);

function handleSubmit(e) { e.preventDefault(); const name =
value.trim(); if (name) props.onSubmit(name); }

return ( React.createElement(“div”, { role: “dialog”, “aria-modal”:
“true”, “aria-labelledby”: “name-modal-title”, style: { position:
“fixed”, inset: 0, background: “rgba(0,0,0,0.5)”, display: “flex”,
alignItems: “center”, justifyContent: “center”, zIndex: 1000 } },
React.createElement(“div”, { style: { background: “#fff”, borderRadius:
“12px”, padding: “32px”, maxWidth: “400px”, width: “90%”, boxShadow: “0
8px 32px rgba(0,0,0,0.2)” } }, React.createElement(“h2”, { id:
“name-modal-title”, style: { marginBottom: “16px”, fontSize: “1.3rem” }
}, “Welcome! What is your name?” ), React.createElement(“form”, {
onSubmit: handleSubmit }, React.createElement(“input”, { ref: inputRef,
type: “text”, value: value, onChange: function(e) {
setValue(e.target.value); }, placeholder: “Enter your name”,
“aria-label”: “Your name”, style: { width: “100%”, padding: “10px 14px”,
fontSize: “1rem”, border: “2px solid #cbd5e1”, borderRadius: “8px”,
boxSizing: “border-box”, marginBottom: “16px” } }),
React.createElement(“button”, { type: “submit”, disabled: !value.trim(),
style: { width: “100%”, padding: “12px”, fontSize: “1rem”, fontWeight:
“700”, background: value.trim() ? “#2563eb” : “#94a3b8”, color: “#fff”,
border: “none”, borderRadius: “8px”, cursor: value.trim() ? “pointer” :
“not-allowed” } }, “Start Activity”) ) ) ) ); }

function PINModal(props) { const [value, setValue] = useState(““); const
[error, setError] = useState(false); const inputRef = useRef(null);

useEffect(function() { if (inputRef.current) inputRef.current.focus();
}, []);

function handleSubmit(e) { e.preventDefault(); if (value === PIN) {
props.onSuccess(); } else { setError(true); setValue(““); } }

return ( React.createElement(“div”, { role: “dialog”, “aria-modal”:
“true”, “aria-labelledby”: “pin-modal-title”, style: { position:
“fixed”, inset: 0, background: “rgba(0,0,0,0.5)”, display: “flex”,
alignItems: “center”, justifyContent: “center”, zIndex: 1000 } },
React.createElement(“div”, { style: { background: “#fff”, borderRadius:
“12px”, padding: “32px”, maxWidth: “360px”, width: “90%”, boxShadow: “0
8px 32px rgba(0,0,0,0.2)” } }, React.createElement(“h2”, { id:
“pin-modal-title”, style: { marginBottom: “8px”, fontSize: “1.2rem” } },
“Teacher Access” ), React.createElement(“p”, { style: { color:
“#64748b”, marginBottom: “16px” } }, “Enter your PIN to continue.”),
error && React.createElement(“p”, { role: “alert”, style: { color:
“#dc2626”, marginBottom: “12px” } }, “Incorrect PIN. Try again.”),
React.createElement(“form”, { onSubmit: handleSubmit },
React.createElement(“input”, { ref: inputRef, type: “password”, value:
value, onChange: function(e) { setValue(e.target.value); }, placeholder:
“PIN”, “aria-label”: “Teacher PIN”, style: { width: “100%”, padding:
“10px 14px”, fontSize: “1rem”, border: “2px solid #cbd5e1”,
borderRadius: “8px”, boxSizing: “border-box”, marginBottom: “16px” } }),
React.createElement(“div”, { style: { display: “flex”, gap: “8px” } },
React.createElement(“button”, { type: “button”, onClick: props.onCancel,
style: { flex: 1, padding: “10px”, fontSize: “1rem”, background:
“#f1f5f9”, color: “#334155”, border: “none”, borderRadius: “8px”,
cursor: “pointer” } }, “Cancel”), React.createElement(“button”, { type:
“submit”, style: { flex: 1, padding: “10px”, fontSize: “1rem”,
fontWeight: “700”, background: “#2563eb”, color: “#fff”, border: “none”,
borderRadius: “8px”, cursor: “pointer” } }, “Enter”) ) ) ) ) ); }

function TeacherSetup(props) { const [title, setTitle] = useState(““);
const [gameId, setGameId] = useState(”“); const [rows, setRows] =
useState([{ sentence: ““, d1:”“, d2:”“, d3:”” }]);

function addRow() { setRows(function(r) { return […r, { sentence: ““,
d1:”“, d2:”“, d3:”” }]; }); }

function updateRow(i, field, val) { setRows(function(r) { const next =
[…r]; next[i] = Object.assign({}, next[i], { [field]: val }); return
next; }); }

function removeRow(i) { setRows(function(r) { return
r.filter(function(_, idx) { return idx !== i; }); }); }

function exportCSV() { const header = “title,game_id,sentence,d1,d2,d3”;
const lines = rows.map(function(r, i) { return [i === 0 ? title : ““, i
=== 0 ? gameId :”“, r.sentence, r.d1, r.d2, r.d3] .map(function(v) {
return ‘“’ + (v ||”“).replace(/”/g,’““‘) +’”’; }) .join(“,”); }); const
csv = [header, …lines].join(“”); const blob = new Blob([csv], { type:
“text/csv” }); const url = URL.createObjectURL(blob); const a =
document.createElement(“a”); a.href = url; a.download = (gameId ||
“activity”) + “.csv”; a.click(); URL.revokeObjectURL(url); }

const inputStyle = { width: “100%”, padding: “8px 10px”, fontSize:
“0.9rem”, border: “1px solid #cbd5e1”, borderRadius: “6px”, boxSizing:
“border-box” };

return ( React.createElement(“div”, { style: { maxWidth: “800px”,
margin: “0 auto”, padding: “24px 16px” } }, React.createElement(“h2”, {
style: { fontSize: “1.4rem”, marginBottom: “20px” } }, “Activity
Setup”), React.createElement(“div”, { style: { display: “grid”,
gridTemplateColumns: “1fr 1fr”, gap: “16px”, marginBottom: “24px” } },
React.createElement(“label”, null, React.createElement(“span”, { style:
{ display: “block”, fontWeight: “600”, marginBottom: “4px” } },
“Activity Title”), React.createElement(“input”, { type: “text”, value:
title, onChange: function(e) { setTitle(e.target.value); }, style:
inputStyle, placeholder: “e.g. Capital Letters” }) ),
React.createElement(“label”, null, React.createElement(“span”, { style:
{ display: “block”, fontWeight: “600”, marginBottom: “4px” } }, “Game
ID”), React.createElement(“input”, { type: “text”, value: gameId,
onChange: function(e) { setGameId(e.target.value); }, style: inputStyle,
placeholder: “e.g. capital-letters-y3” }) ) ),
React.createElement(“table”, { style: { width: “100%”, borderCollapse:
“collapse”, marginBottom: “16px” } }, React.createElement(“thead”, null,
React.createElement(“tr”, null, [“Correct Sentence”, “Distractor 1”,
“Distractor 2”, “Distractor 3”, “”].map(function(h) { return
React.createElement(“th”, { key: h, style: { textAlign: “left”, padding:
“8px”, background: “#f1f5f9”, fontSize: “0.85rem”, fontWeight: “600” }
}, h); }) ) ), React.createElement(“tbody”, null, rows.map(function(row,
i) { return React.createElement(“tr”, { key: i }, [“sentence”, “d1”,
“d2”, “d3”].map(function(field) { return React.createElement(“td”, {
key: field, style: { padding: “4px” } }, React.createElement(“input”, {
type: “text”, value: row[field], onChange: function(e) { updateRow(i,
field, e.target.value); }, style: inputStyle, “aria-label”: field + ”
row ” + (i + 1) }) ); }), React.createElement(“td”, { style: { padding:
“4px” } }, React.createElement(“button”, { onClick: function() {
removeRow(i); }, “aria-label”: “Remove row” + (i + 1), style: {
background: “#fee2e2”, color: “#dc2626”, border: “none”, borderRadius:
“6px”, padding: “6px 10px”, cursor: “pointer” } }, “X”) ) ); }) ) ),
React.createElement(“div”, { style: { display: “flex”, gap: “12px”,
flexWrap: “wrap” } }, React.createElement(“button”, { onClick: addRow,
style: { padding: “10px 20px”, background: “#f1f5f9”, color: “#334155”,
border: “none”, borderRadius: “8px”, cursor: “pointer”, fontWeight:
“600” } }, “+ Add Row”), React.createElement(“button”, { onClick:
exportCSV, style: { padding: “10px 20px”, background: “#2563eb”, color:
“#fff”, border: “none”, borderRadius: “8px”, cursor: “pointer”,
fontWeight: “600” } }, “Export CSV”) ) ) ); }

function SessionSummary(props) { const [rows, setRows] = useState([]);
const [sessionStart, setSessionStart] = useState(null); const
[lastRefresh, setLastRefresh] = useState(null); const timerRef =
useRef(null);

const fetchData = useCallback(function() { if (!TRACKING_CSV_URL ||
TRACKING_CSV_URL === “PASTE_YOUR_CSV_URL_HERE”) return;
fetch(TRACKING_CSV_URL + “&t=” + Date.now()) .then(function(r) { return
r.text(); }) .then(function(text) { const parsed = parseCSV(text);
setRows(parsed); setLastRefresh(new Date()); }) .catch(function() {});
}, []);

useEffect(function() { fetchData(); timerRef.current =
setInterval(fetchData, REFRESH_INTERVAL); return function() {
clearInterval(timerRef.current); }; }, [fetchData]);

function resetSession() { setSessionStart(new Date()); }

const filtered = sessionStart ? rows.filter(function(r) { const t = new
Date(r[“Timestamp”]); return t >= sessionStart; }) : rows;

const gameRows = props.gameId ? filtered.filter(function(r) { return
r[“Game_ID”] === props.gameId; }) : filtered;

const students = {}; gameRows.forEach(function(r) { const name =
r[“Name”]; if (!name) return; if (!students[name]) { students[name] = {
attempts: 0, completed: false, firstTrySuccess: false, clues: 0,
distractors: 0 }; } const s = students[name]; if (r[“Status”] ===
“attempt”) s.attempts++; if (r[“Status”] === “completed”) { s.completed
= true; if (s.attempts <= 1) s.firstTrySuccess = true; } if (r[“Status”]
=== “clue_used”) s.clues++; if (r[“Status”] === “distractor_used”)
s.distractors++; });

const studentList = Object.keys(students).map(function(name) { return
Object.assign({ name: name }, students[name]); });

const total = studentList.length; const completions =
studentList.filter(function(s) { return s.completed; }).length; const
firstTryMasters = studentList.filter(function(s) { return
s.firstTrySuccess; }).length; const successRate = total > 0 ?
Math.round((firstTryMasters / total) * 100) : 0;

const trafficColor = successRate >= 80 ? “#16a34a” : successRate >= 50 ?
“#d97706” : “#dc2626”; const trafficLabel = successRate >= 80 ? “Ready
to move on” : successRate >= 50 ? “Some students struggling” : “Re-model
recommended”;

const panelStyle = { background: “#f8fafc”, border: “1px solid #e2e8f0”,
borderRadius: “10px”, padding: “16px”, marginBottom: “16px” };

return ( React.createElement(“div”, { style: { maxWidth: “800px”,
margin: “0 auto”, padding: “24px 16px” } }, React.createElement(“div”, {
style: { display: “flex”, alignItems: “center”, justifyContent:
“space-between”, marginBottom: “20px”, flexWrap: “wrap”, gap: “12px” }
}, React.createElement(“h2”, { style: { fontSize: “1.4rem”, margin: 0 }
}, “Session Summary”), React.createElement(“div”, { style: { display:
“flex”, gap: “8px” } }, React.createElement(“button”, { onClick:
fetchData, style: { padding: “8px 16px”, background: “#f1f5f9”, color:
“#334155”, border: “none”, borderRadius: “8px”, cursor: “pointer”,
fontWeight: “600” } }, “Refresh”), React.createElement(“button”, {
onClick: resetSession, style: { padding: “8px 16px”, background:
“#fee2e2”, color: “#dc2626”, border: “none”, borderRadius: “8px”,
cursor: “pointer”, fontWeight: “600” } }, “Reset Session”) ) ),

      TRACKING_CSV_URL === "PASTE_YOUR_CSV_URL_HERE" && React.createElement("div", {
        style: { background: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "12px", marginBottom: "16px" }
      }, "Set TRACKING_CSV_URL in app.js to enable live data."),

      React.createElement("div", { style: Object.assign({}, panelStyle, { borderLeft: "6px solid " + trafficColor }) },
        React.createElement("div", { style: { fontSize: "2.5rem", fontWeight: "800", color: trafficColor } }, successRate + "%"),
        React.createElement("div", { style: { fontWeight: "600", color: trafficColor, marginBottom: "8px" } }, trafficLabel),
        React.createElement("div", { style: { display: "flex", gap: "24px", flexWrap: "wrap", color: "#475569", fontSize: "0.95rem" } },
          React.createElement("span", null, "Students: " + total),
          React.createElement("span", null, "Completed: " + completions),
          React.createElement("span", null, "First-try success: " + firstTryMasters)
        )
      ),

      lastRefresh && React.createElement("p", { style: { color: "#94a3b8", fontSize: "0.8rem", marginBottom: "16px" } },
        "Last refreshed: " + lastRefresh.toLocaleTimeString() + " (auto-refreshes every 15s)"
      ),

      studentList.length > 0 && React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
        React.createElement("thead", null,
          React.createElement("tr", null,
            ["Student", "Completed", "First Try", "Attempts", "Clues", "Distractors"].map(function(h) {
              return React.createElement("th", {
                key: h,
                style: { textAlign: "left", padding: "8px", background: "#f1f5f9", fontSize: "0.85rem", fontWeight: "600" }
              }, h);
            })
          )
        ),
        React.createElement("tbody", null,
          studentList.map(function(s) {
            return React.createElement("tr", { key: s.name, style: { borderBottom: "1px solid #e2e8f0" } },
              React.createElement("td", { style: { padding: "8px", fontWeight: "600" } }, s.name),
              React.createElement("td", { style: { padding: "8px", color: s.completed ? "#16a34a" : "#94a3b8" } }, s.completed ? "Yes" : "No"),
              React.createElement("td", { style: { padding: "8px", color: s.firstTrySuccess ? "#16a34a" : "#94a3b8" } }, s.firstTrySuccess ? "Yes" : "No"),
              React.createElement("td", { style: { padding: "8px" } }, s.attempts),
              React.createElement("td", { style: { padding: "8px" } }, s.clues),
              React.createElement("td", { style: { padding: "8px" } }, s.distractors)
            );
          })
        )
      ),

      studentList.length === 0 && React.createElement("p", { style: { color: "#94a3b8", textAlign: "center", padding: "32px" } },
        "No student data yet for this session."
      )
    )

); }

function ActivityCard(props) { const { item, index, studentName, gameId
} = props; const [words, setWords] = useState([]); const [answered,
setAnswered] = useState(false); const [correct, setCorrect] =
useState(false); const [attempts, setAttempts] = useState(0); const
[clueUsed, setClueUsed] = useState(false); const [dragOver, setDragOver]
= useState(null); const [selectedWord, setSelectedWord] =
useState(null);

useEffect(function() { const correctWords = item.correct.split(” “);
const allWords = shuffle([…correctWords, …item.distractors]);
setWords(allWords.map(function(w, i) { return { id: i, text: w, placed:
false }; })); }, [item]);

const [answer, setAnswer] = useState([]);

function handleDragStart(e, wordId) { e.dataTransfer.setData(“wordId”,
String(wordId)); }

function handleDropOnAnswer(e, position) { e.preventDefault(); const
wordId = parseInt(e.dataTransfer.getData(“wordId”)); placeWord(wordId,
position); setDragOver(null); }

function handleDropOnBank(e) { e.preventDefault(); const wordId =
parseInt(e.dataTransfer.getData(“wordId”)); returnWord(wordId);
setDragOver(null); }

function placeWord(wordId, position) { const word =
words.find(function(w) { return w.id === wordId; }); if (!word ||
word.placed) return; const newAnswer = […answer]; if
(newAnswer[position] !== undefined && newAnswer[position] !== null) {
const displaced = newAnswer[position]; setWords(function(ws) { return
ws.map(function(w) { if (w.id === displaced) return Object.assign({}, w,
{ placed: false }); if (w.id === wordId) return Object.assign({}, w, {
placed: true }); return w; }); }); } else { setWords(function(ws) {
return ws.map(function(w) { return w.id === wordId ? Object.assign({},
w, { placed: true }) : w; }); }); } newAnswer[position] = wordId;
setAnswer(newAnswer); }

function returnWord(wordId) { setAnswer(function(a) { return
a.map(function(id) { return id === wordId ? null : id; }); });
setWords(function(ws) { return ws.map(function(w) { return w.id ===
wordId ? Object.assign({}, w, { placed: false }) : w; }); }); }

function handleCheck() { const correctWords = item.correct.split(” “);
const answerWords = answer.map(function(id) { if (id === null || id ===
undefined) return”“; const w = words.find(function(w) { return w.id ===
id; }); return w ? w.text :”“; }); const isCorrect = answerWords.join(”
“) === correctWords.join(” “); const newAttempts = attempts + 1;
setAttempts(newAttempts);

    sendTrackingData(studentName, gameId, newAttempts, "attempt", isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      setAnswered(true);
      setCorrect(true);
      sendTrackingData(studentName, gameId, newAttempts, "completed", "sentence-" + (index + 1));
      if (newAttempts === 1) {
        sendTrackingData(studentName, gameId, newAttempts, "first_try_mastered", "sentence-" + (index + 1));
      }
      if (window.InteractivesTelemetry) {
        window.InteractivesTelemetry.track("paragraph_completed", { gameId: gameId, sentence: index + 1, attempts: newAttempts });
        if (newAttempts === 1) {
          window.InteractivesTelemetry.track("first_try_mastered", { gameId: gameId, sentence: index + 1 });
        }
      }
    }

}

function handleClue() { setClueUsed(true); sendTrackingData(studentName,
gameId, attempts, “clue_used”, “sentence-” + (index + 1)); if
(window.InteractivesTelemetry) {
window.InteractivesTelemetry.track(“clue_used”, { gameId: gameId,
sentence: index + 1 }); } }

const correctWords = item.correct.split(” “); const answerSlots =
Array.from({ length: correctWords.length }); const unplacedWords =
words.filter(function(w) { return !w.placed; });

return ( React.createElement(“div”, { style: { background: “#fff”,
borderRadius: “12px”, padding: “24px”, boxShadow: “0 2px 8px
rgba(0,0,0,0.08)”, marginBottom: “20px”, border: answered ? “2px solid
#16a34a” : “2px solid #e2e8f0” } }, React.createElement(“div”, { style:
{ display: “flex”, alignItems: “center”, marginBottom: “16px” } },
React.createElement(“span”, { style: { background: answered ? “#dcfce7”
: “#eff6ff”, color: answered ? “#16a34a” : “#2563eb”, fontWeight: “800”,
fontSize: “0.85rem”, padding: “4px 12px”, borderRadius: “20px”,
marginRight: “12px” } }, “Sentence” + (index + 1)), answered &&
React.createElement(“span”, { style: { color: “#16a34a”, fontWeight:
“700” } }, “Correct!”) ),

      clueUsed && React.createElement("div", {
        style: { background: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.9rem" }
      }, "Clue: " + item.correct),

      React.createElement("div", {
        onDragOver: function(e) { e.preventDefault(); },
        onDrop: handleDropOnAnswer,
        style: {
          minHeight: "52px", background: "#f8fafc", border: "2px dashed #cbd5e1",
          borderRadius: "8px", padding: "10px", display: "flex", flexWrap: "wrap",
          gap: "8px", marginBottom: "14px"
        },
        "aria-label": "Answer area"
      },
        answerSlots.map(function(_, i) {
          const wordId = answer[i];
          const word = wordId !== undefined && wordId !== null ? words.find(function(w) { return w.id === wordId; }) : null;
          return React.createElement("div", {
            key: i,
            onDragOver: function(e) { e.preventDefault(); setDragOver(i); },
            onDrop: function(e) { handleDropOnAnswer(e, i); },
            onClick: function() { if (word) returnWord(word.id); },
            style: {
              minWidth: "60px", minHeight: "36px", background: word ? "#dbeafe" : "#e2e8f0",
              borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px 10px", cursor: word ? "pointer" : "default",
              border: dragOver === i ? "2px solid #2563eb" : "2px solid transparent",
              fontWeight: word ? "600" : "400", color: "#1e293b"
            }
          }, word ? word.text : "");
        })
      ),

      React.createElement("div", {
        onDragOver: function(e) { e.preventDefault(); },
        onDrop: handleDropOnBank,
        style: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }
      },
        unplacedWords.map(function(word) {
          return React.createElement("div", {
            key: word.id,
            draggable: true,
            onDragStart: function(e) { handleDragStart(e, word.id); },
            role: "button",
            tabIndex: 0,
            "aria-label": word.text,
            onKeyDown: function(e) {
              if (e.key === "Enter" || e.key === " ") {
                if (selectedWord === word.id) {
                  setSelectedWord(null);
                } else {
                  setSelectedWord(word.id);
                }
              }
            },
            style: {
              background: selectedWord === word.id ? "#2563eb" : "#fff",
              color: selectedWord === word.id ? "#fff" : "#1e293b",
              border: "2px solid " + (selectedWord === word.id ? "#2563eb" : "#cbd5e1"),
              borderRadius: "8px", padding: "6px 14px",
              cursor: "grab", fontWeight: "600", fontSize: "0.95rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }
          }, word.text);
        })
      ),

      !answered && React.createElement("div", { style: { display: "flex", gap: "10px" } },
        React.createElement("button", {
          onClick: handleCheck,
          style: {
            padding: "10px 24px", background: "#2563eb", color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700"
          }
        }, "Check"),
        !clueUsed && React.createElement("button", {
          onClick: handleClue,
          style: {
            padding: "10px 24px", background: "#f1f5f9", color: "#475569",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"
          }
        }, "Show Clue")
      )
    )

); }

function StudentActivity(props) { const { config, studentName } = props;
const completed = config.sentences.filter(function(_, i) { return
props.completedSet.has(i); }).length;

return ( React.createElement(“div”, { style: { maxWidth: “700px”,
margin: “0 auto”, padding: “24px 16px” } }, React.createElement(“div”, {
style: { marginBottom: “20px” } }, React.createElement(“h1”, { style: {
fontSize: “1.6rem”, fontWeight: “800”, marginBottom: “4px” } },
config.title), React.createElement(“p”, { style: { color: “#64748b” } },
“Hi” + studentName + “! Arrange each sentence correctly.”),
React.createElement(“div”, { style: { background: “#eff6ff”,
borderRadius: “8px”, padding: “10px 16px”, marginTop: “12px”, display:
“flex”, alignItems: “center”, gap: “12px” } },
React.createElement(“span”, { style: { fontWeight: “700”, color:
“#2563eb” } }, completed + ” / ” + config.sentences.length + ”
complete”), React.createElement(“div”, { style: { flex: 1, height:
“8px”, background: “#bfdbfe”, borderRadius: “4px” } },
React.createElement(“div”, { style: { width: (config.sentences.length >
0 ? (completed / config.sentences.length * 100) : 0) + “%”, height:
“100%”, background: “#2563eb”, borderRadius: “4px”, transition: “width
0.3s” } }) ) ) ), config.sentences.map(function(item, i) { return
React.createElement(ActivityCard, { key: i, index: i, item: item,
studentName: studentName, gameId: config.gameId, onComplete: function()
{ props.onComplete(i); } }); }) ) ); }

function App() { const { config, error } = useConfig(); const
[activeTab, setActiveTab] = useState(“student”); const [studentName,
setStudentName] = useState(null); const [showPIN, setShowPIN] =
useState(false); const [teacherUnlocked, setTeacherUnlocked] =
useState(false); const [completedSet, setCompletedSet] = useState(new
Set());

function handleTabClick(tab) { if (tab === “teacher” &&
!teacherUnlocked) { setShowPIN(true); } else { setActiveTab(tab); } }

function handlePINSuccess() { setTeacherUnlocked(true);
setShowPIN(false); setActiveTab(“teacher”); }

function handleComplete(index) { setCompletedSet(function(s) { const
next = new Set(s); next.add(index); return next; }); }

const tabStyle = function(tab) { return { padding: “10px 24px”,
fontWeight: “700”, fontSize: “0.95rem”, border: “none”, cursor:
“pointer”, borderBottom: activeTab === tab ? “3px solid #2563eb” : “3px
solid transparent”, background: “transparent”, color: activeTab === tab
? “#2563eb” : “#64748b” }; };

if (error === “no-config” && activeTab === “student”) { return (
React.createElement(“div”, { style: { minHeight: “100vh”, display:
“flex”, alignItems: “center”, justifyContent: “center”, background:
“#f8fafc” } }, React.createElement(“div”, { style: { maxWidth: “480px”,
textAlign: “center”, padding: “40px 24px” } },
React.createElement(“div”, { style: { fontSize: “3rem”, marginBottom:
“16px” } }, “🔗”), React.createElement(“h1”, { style: { fontSize:
“1.5rem”, fontWeight: “800”, marginBottom: “12px” } }, “You need a link
to start”), React.createElement(“p”, { style: { color: “#64748b”,
lineHeight: “1.6” } }, “This activity requires a teacher-generated link.
Ask your teacher to share their link with you.” ),
React.createElement(“button”, { onClick: function() {
handleTabClick(“teacher”); }, style: { marginTop: “24px”, padding: “10px
24px”, background: “#2563eb”, color: “#fff”, border: “none”,
borderRadius: “8px”, cursor: “pointer”, fontWeight: “700” } }, “I’m a
teacher”) ), showPIN && React.createElement(PINModal, { onSuccess:
handlePINSuccess, onCancel: function() { setShowPIN(false); } }) ) ); }

return ( React.createElement(“div”, { style: { minHeight: “100vh”,
background: “#f8fafc” } }, showPIN && React.createElement(PINModal, {
onSuccess: handlePINSuccess, onCancel: function() { setShowPIN(false); }
}), studentName === null && activeTab === “student” && config &&
React.createElement(NameModal, { onSubmit: setStudentName }),
React.createElement(“nav”, { style: { background: “#fff”, borderBottom:
“1px solid #e2e8f0”, display: “flex”, paddingLeft: “16px” } },
React.createElement(“button”, { style: tabStyle(“student”), onClick:
function() { handleTabClick(“student”); } }, “Student Activity”),
React.createElement(“button”, { style: tabStyle(“setup”), onClick:
function() { handleTabClick(“setup”); } }, “Teacher Setup”),
React.createElement(“button”, { style: tabStyle(“teacher”), onClick:
function() { handleTabClick(“teacher”); } }, “Session Summary”) ),
activeTab === “student” && ( error ? ( React.createElement(“div”, {
style: { padding: “40px”, textAlign: “center”, color: “#dc2626” } },
“Could not load activity config. Please check the link.” ) ) : config ?
( React.createElement(StudentActivity, { config: config, studentName:
studentName || “Student”, completedSet: completedSet, onComplete:
handleComplete }) ) : ( React.createElement(“div”, { style: { padding:
“40px”, textAlign: “center”, color: “#94a3b8” } }, “Loading…”) ) ),
activeTab === “setup” && React.createElement(TeacherSetup, null),
activeTab === “teacher” && React.createElement(SessionSummary, { gameId:
config ? config.gameId : null }) ) ); }

const root = ReactDOM.createRoot(document.getElementById(“root”));
root.render(React.createElement(App, null));
