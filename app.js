// app.js - Fix the Paragraph Mini App (Library Edition)

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
var TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91jUOTkXuSJJWiWMEHQ/exec";

// 1️⃣ Paste your published LIBRARY Google Sheet CSV here:
var LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";

// 2️⃣ Paste your published TRACKING Google Sheet CSV here (for Teacher panel):
var TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv"; 

var PIN = "9999";
var REFRESH_INTERVAL = 15000;

// ─── UTILITIES ──────────────────────────────────────────────────────────────
function parseCSVRow(row) {
  var result = []; var insideQuote = false; var current = "";
  for (var i = 0; i < row.length; i++) {
    var ch = row[i];
    if (ch === '"' && !insideQuote) { insideQuote = true; continue; }
    if (ch === '"' && insideQuote) { insideQuote = false; continue; }
    if (ch === ',' && !insideQuote) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function sendTrackingData(name, gameId, attempt, status, details) {
  var params = new URLSearchParams();
  params.append("name", name || "anonymous");
  params.append("gameId", gameId || "unknown");
  params.append("attempt", String(attempt));
  params.append("status", status);
  params.append("details", details || "");
  fetch(TRACKING_URL + "?" + params.toString(), { method: "GET", mode: "no-cors" }).catch(function(){});
}

var e = React.createElement;

// ─── MODALS ─────────────────────────────────────────────────────────────────
function NameModal(props) {
  var _n = React.useState(""); var name = _n[0]; var setName = _n[1];
  return e("div", { className: "modal-backdrop" },
    e("div", { className: "modal-box" },
      e("h2", { className: "modal-heading" }, "What's your name?"),
      e("p", { className: "modal-subtext" }, "Your teacher uses this to see how you are going."),
      e("input", { className: "text-input", autoFocus: true, placeholder: "Type your name...", value: name, onChange: function(ev) { setName(ev.target.value); } }),
      e("button", { className: "btn-primary btn-full", disabled: !name.trim(), onClick: function() { props.onSubmit(name.trim()); } }, "Let's Go!")
    )
  );
}

function PinModal(props) {
  var _p = React.useState(""); var pin = _p[0]; var setPin = _p[1];
  var _err = React.useState(false); var err = _err[0]; var setErr = _err[1];
  return e("div", { className: "modal-backdrop" },
    e("div", { className: "modal-box" },
      e("h2", { className: "modal-heading" }, "Teacher Access"),
      e("p", { className: "modal-subtext" }, "Enter PIN to view student progress."),
      e("input", { type: "password", className: "text-input pin-input", autoFocus: true, placeholder: "****", value: pin, onChange: function(ev) { setPin(ev.target.value); setErr(false); } }),
      err && e("div", { className: "error-msg" }, "Incorrect PIN"),
      e("div", { className: "btn-row", style: { marginTop: 16 } },
        e("button", { className: "btn-primary", style: { flex: 1 }, onClick: function() { if(pin===PIN) props.onSuccess(); else setErr(true); } }, "Unlock"),
        e("button", { className: "btn-secondary", style: { flex: 1 }, onClick: props.onCancel }, "Cancel")
      )
    )
  );
}

// ─── LIBRARY SCREEN ─────────────────────────────────────────────────────────
function LibraryScreen(props) {
  var _lib = React.useState([]); var library = _lib[0]; var setLibrary = _lib[1];
  var _loading = React.useState(true); var loading = _loading[0]; var setLoading = _loading[1];
  
  React.useEffect(function() {
    if (!LIBRARY_CSV_URL || LIBRARY_CSV_URL.indexOf("PASTE_YOUR") > -1) {
      setLoading(false); return;
    }
    fetch(LIBRARY_CSV_URL + "&t=" + Date.now())
      .then(function(r) { return r.text(); })
      .then(function(csv) {
        var lines = csv.trim().split('\n');
        var headers = parseCSVRow(lines[0]).map(function(h) { return h.toLowerCase().trim(); });
        var titleIdx = headers.indexOf('title');
        
        var parsedLib = [];
        for (var i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          var cols = parseCSVRow(lines[i]);
          var title = titleIdx >= 0 ? cols[titleIdx] : cols[0]; 
          if (!title) continue;
          
          var sentences = [];
          for (var j = 0; j < cols.length; j++) {
             if (j !== titleIdx && cols[j] && cols[j].trim() !== '') {
                 sentences.push(cols[j].trim());
             }
          }
          if (sentences.length >= 2) {
             parsedLib.push({ gameId: "lib-" + i, title: title, sentences: sentences });
          }
        }
        setLibrary(parsedLib);
        setLoading(false);
      }).catch(function() { setLoading(false); });
  }, []);

  if (loading) return e("div", { className: "app-wrapper", style: { textAlign: "center", marginTop: 60 } }, "Loading Library...");
  
  if (!LIBRARY_CSV_URL || LIBRARY_CSV_URL.indexOf("PASTE_YOUR") > -1) {
     return e("div", { className: "app-wrapper" },
       e("div", { className: "create-card", style: { textAlign: "center", maxWidth: 500, margin: "0 auto" } },
         e("h2", { className: "section-heading" }, "Library Not Connected"),
         e("p", { className: "modal-subtext" }, "Please paste your published Library CSV URL into app.js to see your activities.")
       )
     );
  }
  
  return e("div", { className: "app-wrapper" },
    e("div", { className: "view-header", style: { justifyContent: "center" } },
       e("h2", { className: "game-title" }, "Activity Library")
    ),
    library.length === 0 ? e("p", { style: { textAlign: "center", color: "var(--text-muted)" } }, "No activities found. Add some rows to your Google Sheet!") :
    e("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 } },
       library.map(function(act, idx) {
          return e("div", { 
            key: idx, className: "part-card", 
            style: { cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, padding: 24, textAlign: "center" },
            onClick: function() { props.onSelect(act); }
          },
            e("div", { style: { fontSize: 18, fontWeight: 700 } }, act.title),
            e("div", { style: { fontSize: 13, color: "var(--text-muted)" } }, act.sentences.length + " sentences")
          );
       })
    )
  );
}

// ─── STUDENT ACTIVITY ───────────────────────────────────────────────────────
function StudentActivity(props) {
  var config = props.config;
  var correctOrder = config.sentences;
  
  var _pool = React.useState(function() { return shuffle(correctOrder.map(function(s, i) { return {id: i, text: s}; })); });
  var pool = _pool[0]; var setPool = _pool[1];
  
  var _slots = React.useState(function() { return new Array(correctOrder.length).fill(null); });
  var slots = _slots[0]; var setSlots = _slots[1];
  
  var _dragging = React.useState(null); var dragging = _dragging[0]; var setDragging = _dragging[1]; 
  var _overSlot = React.useState(null); var overSlot = _overSlot[0]; var setOverSlot = _overSlot[1];
  var _attempts = React.useState(0); var attempts = _attempts[0]; var setAttempts = _attempts[1];
  var _status = React.useState("idle"); var status = _status[0]; var setStatus = _status[1];
  
  // Drag and Drop Logic
  function onDragStart(source, index, item) { setDragging({source: source, index: index, item: item}); }
  function onDragOver(e, slotIndex) { e.preventDefault(); setOverSlot(slotIndex); }
  function onDrop(slotIndex) {
    if (!dragging) return;
    var newPool = pool.slice();
    var newSlots = slots.slice();
    var item = dragging.item;
    
    if (dragging.source === 'pool') {
      newPool = newPool.filter(function(p) { return p.id !== item.id; });
    } else {
      newSlots[dragging.index] = null;
    }
    
    if (newSlots[slotIndex]) { newPool.push(newSlots[slotIndex]); }
    
    newSlots[slotIndex] = item;
    setPool(newPool); setSlots(newSlots); setDragging(null); setOverSlot(null); setStatus("idle");
  }
  
  function returnToPool(slotIndex) {
    var item = slots[slotIndex];
    if (!item) return;
    var newSlots = slots.slice();
    newSlots[slotIndex] = null;
    setSlots(newSlots); setPool(pool.concat([item])); setStatus("idle");
  }

  function handleCheck() {
     var isComplete = slots.every(function(s) { return s !== null; });
     if (!isComplete) { alert("Please fill all slots before checking!"); return; }
     
     var att = attempts + 1; setAttempts(att);
     var isCorrect = slots.every(function(s, i) { return s.text === correctOrder[i]; });
     
     if (isCorrect) {
       setStatus("success");
       sendTrackingData(props.studentName, config.title, att, "completed", att === 1 ? "first_try" : "multi_attempt");
     } else {
       setStatus("error");
       sendTrackingData(props.studentName, config.title, att, "incorrect", "");
     }
  }

  if (status === "success") {
    return e("div", { className: "app-wrapper" },
      e("div", { className: "create-card", style: { textAlign: "center", marginTop: 40, alignItems: "center" } },
        e("div", { style: { fontSize: 64, marginBottom: 16 } }, "🎉"),
        e("h2", { className: "modal-heading", style: { color: "var(--success)" } }, attempts === 1 ? "First try! Amazing!" : "Well done!"),
        e("p", { className: "modal-subtext", style: { marginBottom: 24 } }, "You ordered the paragraph perfectly in " + attempts + " attempt(s)."),
        e("button", { className: "btn-secondary", onClick: props.onBack }, "← Back to Library")
      )
    );
  }

  return e("div", { className: "app-wrapper" },
    e("div", { className: "view-header" },
      e("button", { className: "btn-ghost btn-sm", onClick: props.onBack }, "← Back to Library"),
      e("div", { className: "player-info" }, "👤 " + props.studentName)
    ),
    e("div", { className: "preview-panel" },
      e("h2", { className: "section-heading", style: {marginBottom: 8} }, config.title),
      e("p", { className: "game-instructions" }, "Drag the sentences from the pool into the correct order.")
    ),
    
    e("div", { className: "section-block" },
      e("div", { className: "section-label" }, "Sentence Pool"),
      e("div", { className: "pool-container" },
        pool.length === 0 ? e("span", { style: { color: "var(--text-muted)" } }, "All sentences placed!") :
        pool.map(function(item, idx) {
           return e("div", {
             key: item.id, className: "part-card", draggable: true,
             onDragStart: function() { onDragStart('pool', idx, item); },
             onDragEnd: function() { setDragging(null); setOverSlot(null); }
           }, item.text);
        })
      )
    ),
    
    e("div", { className: "section-block" },
      e("div", { className: "section-label" }, "Paragraph Order"),
      e("div", { className: "slots-container" },
        slots.map(function(item, idx) {
           return e("div", {
             key: "slot-" + idx,
             className: "drop-slot " + (overSlot === idx ? "slot-drag-over" : ""),
             onDragOver: function(ev) { onDragOver(ev, idx); },
             onDrop: function() { onDrop(idx); }
           },
             item ? e("div", {
               className: "part-card", draggable: true,
               onDragStart: function() { onDragStart('slot', idx, item); },
               onDragEnd: function() { setDragging(null); setOverSlot(null); },
               onClick: function() { returnToPool(idx); }
             }, item.text) : e("span", { style: { color: "var(--text-muted)", fontSize: 14 } }, "Drop sentence " + (idx + 1) + " here")
           );
        })
      )
    ),
    
    status === "error" && e("div", { className: "feedback-box feedback-error", style: {marginBottom: 24} }, "Not quite right! Try swapping some sentences."),
    
    e("div", { className: "btn-row", style: { justifyContent: "center" } },
      e("button", { className: "btn-primary", onClick: handleCheck, disabled: pool.length > 0 }, "Check My Answer")
    )
  );
}

// ─── TEACHER PANEL ──────────────────────────────────────────────────────────
function TeacherPanel(props) {
  var _rows = React.useState([]); var rows = _rows[0]; var setRows = _rows[1];
  
  React.useEffect(function() {
    function fetchRows() {
      if (!TRACKING_CSV_URL || TRACKING_CSV_URL.indexOf("PASTE_YOUR") > -1) return;
      fetch(TRACKING_CSV_URL + "&t=" + Date.now())
        .then(function(r) { return r.text(); })
        .then(function(csv) {
           var lines = csv.trim().split('\n');
           var parsed = [];
           for(var i=1; i<lines.length; i++) {
             if(!lines[i].trim()) continue;
             var cols = parseCSVRow(lines[i]);
             var ts = new Date(cols[0]).getTime() || 0;
             if(ts >= props.sessionStart && cols[1]) {
               parsed.push({ name: cols[1], status: cols[4], activity: cols[2] });
             }
           }
           setRows(parsed);
        }).catch(function(){});
    }
    fetchRows();
    var intv = setInterval(fetchRows, REFRESH_INTERVAL);
    return function() { clearInterval(intv); };
  }, [props.sessionStart]);

  var students = {};
  rows.forEach(function(r) {
    if(!students[r.name]) students[r.name] = [];
    students[r.name].push(r.status);
  });
  
  var studentNames = Object.keys(students);
  var total = studentNames.length;
  var completed = studentNames.filter(function(n) { return students[n].indexOf("completed") >= 0; }).length;
  
  return e("div", { className: "app-wrapper" },
    e("div", { className: "view-header" },
      e("h2", { className: "game-title" }, "Session Progress"),
      e("button", { className: "btn-secondary", onClick: props.onReset }, "Reset Session")
    ),
    
    (!TRACKING_CSV_URL || TRACKING_CSV_URL.indexOf("PASTE_YOUR") > -1) && 
      e("div", { className: "feedback-box feedback-warn", style: { marginBottom: 24 } }, "Tracking CSV URL is missing. Paste it into app.js to view student results."),

    e("div", { className: "stats-grid" },
      e("div", { className: "stat-card" },
         e("div", { className: "stat-num" }, total),
         e("div", { className: "stat-label" }, "Active Students")
      ),
      e("div", { className: "stat-card" },
         e("div", { className: "stat-num stat-green" }, completed),
         e("div", { className: "stat-label" }, "Activities Finished")
      )
    ),
    e("div", { className: "table-wrap" },
      e("table", { className: "results-table" },
        e("thead", null, e("tr", null, e("th", null, "Student Name"), e("th", null, "Status"))),
        e("tbody", null, 
          studentNames.length === 0 ? e("tr", null, e("td", { colSpan: 2, className: "no-results-msg" }, "Waiting for students to begin...")) :
          studentNames.map(function(name) {
            var isDone = students[name].indexOf("completed") >= 0;
            return e("tr", { key: name },
              e("td", { style: { fontWeight: 600 } }, name),
              e("td", null, e("span", { className: "badge " + (isDone ? "badge-success" : "badge-warn") }, isDone ? "Finished" : "Working..."))
            );
          })
        )
      )
    )
  );
}

// ─── APP ROOT ───────────────────────────────────────────────────────────────
function App() {
  var _tab = React.useState("student"); var tab = _tab[0]; var setTab = _tab[1];
  var _pinUnlocked = React.useState(false); var pinUnlocked = _pinUnlocked[0]; var setPinUnlocked = _pinUnlocked[1];
  var _showPin = React.useState(false); var showPin = _showPin[0]; var setShowPin = _showPin[1];
  var _name = React.useState(""); var name = _name[0]; var setName = _name[1];
  var _act = React.useState(null); var act = _act[0]; var setAct = _act[1];
  var _sessionStart = React.useState(Date.now()); var sessionStart = _sessionStart[0]; var setSessionStart = _sessionStart[1];

  function switchTab(t) {
    if (t === "teacher" && !pinUnlocked) { setShowPin(true); return; }
    setTab(t);
  }

  return e("div", null,
    showPin && e(PinModal, { onSuccess: function(){ setPinUnlocked(true); setShowPin(false); setTab("teacher"); }, onCancel: function(){ setShowPin(false); } }),
    tab === "student" && !name && e(NameModal, { onSubmit: setName }),
    
    // Top Nav Bar
    e("div", { style: { background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
      e("div", { style: { fontWeight: 800, color: "var(--accent)", fontSize: 18 } }, "Fix the Paragraph"),
      e("div", { className: "tab-bar", style: { borderBottom: "none", margin: 0, padding: 0 } },
        e("button", { className: "tab-btn " + (tab==="student" ? "tab-active" : ""), onClick: function(){ switchTab("student"); } }, "Student View"),
        e("button", { className: "tab-btn " + (tab==="teacher" ? "tab-active" : ""), onClick: function(){ switchTab("teacher"); } }, "Teacher View")
      )
    ),
    
    // Main Panel View
    e("main", null,
      tab === "student" && (
        !act ? e(LibraryScreen, { onSelect: setAct }) : e(StudentActivity, { config: act, studentName: name, onBack: function(){ setAct(null); } })
      ),
      tab === "teacher" && e(TeacherPanel, { sessionStart: sessionStart, onReset: function(){ setSessionStart(Date.now()); } })
    )
  );
}

var root = ReactDOM.createRoot(document.getElementById("root"));
root.render(e(App, null));
