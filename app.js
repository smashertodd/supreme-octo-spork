// app.js - Fix the Paragraph Mini App 

// CONFIG - update these two values: 
var TRACKING_URL = [ 
  "https://script.google.com/macros/s/",
  "AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91jUOTkXuSJJWiWMEHQ",
  "/exec"
].join("");
var TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv"; 
var PIN = "9999"; 
var REFRESH_INTERVAL = 15000;

// Default paragraph config
var DEFAULT_SENTENCES = [ 
  "First, gather all your ingredients before you start cooking.", 
  "Next, preheat the oven to the correct temperature.", 
  "Then, mix the dry ingredients together in a large bowl.", 
  "After that, add the wet ingredients and stir until combined.", 
  "Finally, pour the mixture into a baking tin and place it in the oven."
];

// Utilities
function parseCSVRow(row) { 
  var result = []; 
  var insideQuote = false; 
  var current = ""; 
  for (var i = 0; i < row.length; i++) { 
    var ch = row[i]; 
    if (ch === '"' && !insideQuote) { 
      insideQuote = true; 
      continue; 
    } 
    if (ch === '"' && insideQuote) { 
      insideQuote = false; 
      continue; 
    } 
    if (ch === ',' && !insideQuote) { 
      result.push(current.trim()); 
      current = ""; 
      continue; 
    } 
    current += ch; 
  } 
  result.push(current.trim()); 
  return result; 
}

function parseConfig(csv) { 
  var lines = csv.trim().split("\n"); 
  if (lines.length < 2) return null; 
  
  var headers = parseCSVRow(lines[0]).map(function(h) { return h.toLowerCase(); }); 
  var idIdx = headers.indexOf("id"); 
  var sentenceIdx = headers.indexOf("sentence"); 
  var distractorIdx = headers.indexOf("distractor"); 
  var clueIdx = headers.indexOf("clue"); 
  
  if (idIdx < 0 || sentenceIdx < 0) return null; 
  
  var sentences = []; 
  var distractors = []; 
  var clues = []; 
  var gameId = ""; 
  
  for (var i = 1; i < lines.length; i++) { 
    if (!lines[i].trim()) continue; 
    var cols = parseCSVRow(lines[i]); 
    if (i === 1) gameId = cols[idIdx] || "unknown"; 
    sentences.push(cols[sentenceIdx] || ""); 
    if (distractorIdx >= 0) distractors.push(cols[distractorIdx] || ""); 
    if (clueIdx >= 0) clues.push(cols[clueIdx] || ""); 
  } 
  return { gameId: gameId, sentences: sentences, distractors: distractors, clues: clues }; 
}

function shuffle(arr) { 
  var a = arr.slice(); 
  for (var i = a.length - 1; i > 0; i--) { 
    var j = Math.floor(Math.random() * (i + 1)); 
    var tmp = a[i]; 
    a[i] = a[j]; 
    a[j] = tmp; 
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
  fetch(TRACKING_URL + "?" + params.toString(), { method: "GET", mode: "no-cors" })
    .catch(function() {}); 
}

// React App
var e = React.createElement;

// Name Modal
function NameModal(props) { 
  var _s = React.useState(""); 
  var name = _s[0]; 
  var setName = _s[1];

  function submit(ev) { 
    ev.preventDefault(); 
    if (name.trim()) props.onSubmit(name.trim()); 
  }

  return e("div", { 
    role: "dialog", "aria-modal": "true", "aria-labelledby": "name-modal-title", 
    style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } 
  }, 
    e("div", { style: { background: "#fff", borderRadius: 12, padding: 32, maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }, 
      e("h2", { id: "name-modal-title", style: { marginTop: 0, fontSize: 20 } }, "What's your name?"), 
      e("p", { style: { color: "#555", marginBottom: 16 } }, "Your teacher will use this to see how you're going."), 
      e("form", { onSubmit: submit }, 
        e("input", { 
          type: "text", value: name, 
          onChange: function(ev) { setName(ev.target.value); }, 
          placeholder: "Type your name here...", autoFocus: true, "aria-label": "Your name", 
          style: { width: "100%", padding: "10px 14px", fontSize: 16, border: "2px solid #6c63ff", borderRadius: 8, boxSizing: "border-box", marginBottom: 16, outline: "none" } 
        }), 
        e("button", { 
          type: "submit", disabled: !name.trim(), 
          style: { width: "100%", padding: "12px", fontSize: 16, fontWeight: 700, background: name.trim() ? "#6c63ff" : "#ccc", color: "#fff", border: "none", borderRadius: 8, cursor: name.trim() ? "pointer" : "not-allowed" } 
        }, "Let's go!") 
      ) 
    ) 
  ); 
}

// PIN Modal
function PinModal(props) { 
  var _s = React.useState(""); 
  var pin = _s[0];
  var setPin = _s[1]; 
  var _e = React.useState(false); 
  var error = _e[0];
  var setError = _e[1];

  function submit(ev) { 
    ev.preventDefault(); 
    if (pin === PIN) {
      props.onSuccess(); 
    } else { 
      setError(true); 
      setPin(""); 
    } 
  }

  return e("div", { 
    role: "dialog", "aria-modal": "true", "aria-labelledby": "pin-modal-title", 
    style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } 
  }, 
    e("div", { style: { background: "#fff", borderRadius: 12, padding: 32, maxWidth: 360, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } }, 
      e("h2", { id: "pin-modal-title", style: { marginTop: 0, fontSize: 20 } }, "Teacher Access"), 
      e("p", { style: { color: "#555" } }, "Enter your PIN to view the session summary."), 
      e("form", { onSubmit: submit }, 
        e("input", { 
          type: "password", value: pin, 
          onChange: function(ev) { setPin(ev.target.value); setError(false); }, 
          placeholder: "PIN", autoFocus: true, "aria-label": "Teacher PIN", 
          style: { width: "100%", padding: "10px 14px", fontSize: 18, letterSpacing: 4, border: error ? "2px solid #e53e3e" : "2px solid #6c63ff", borderRadius: 8, boxSizing: "border-box", marginBottom: 8, outline: "none" } 
        }), 
        error && e("p", { role: "alert", style: { color: "#e53e3e", margin: "0 0 12px" } }, "Incorrect PIN. Try again."), 
        e("div", { style: { display: "flex", gap: 10, marginTop: 8 } }, 
          e("button", { type: "submit", style: { flex: 1, padding: "12px", fontSize: 15, fontWeight: 700, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" } }, "Unlock"), 
          e("button", { type: "button", onClick: props.onCancel, style: { flex: 1, padding: "12px", fontSize: 15, background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, cursor: "pointer" } }, "Cancel") 
        ) 
      ) 
    ) 
  ); 
}

// Teacher Panel
function TeacherPanel(props) { 
  var sessionStart = props.sessionStart; 
  var _rows = React.useState([]); 
  var rows = _rows[0]; 
  var setRows = _rows[1]; 
  var _loading = React.useState(true); 
  var loading = _loading[0];
  var setLoading = _loading[1]; 
  var _lastRefresh = React.useState(null); 
  var lastRefresh = _lastRefresh[0]; 
  var setLastRefresh = _lastRefresh[1];

  function fetchRows() { 
    if (!TRACKING_CSV_URL || TRACKING_CSV_URL === "PASTE_YOUR_CSV_URL_HERE") { 
      setLoading(false); 
      return; 
    }
    fetch(TRACKING_CSV_URL + "&t=" + Date.now()) 
      .then(function(r) { return r.text(); }) 
      .then(function(csv) { 
        var lines = csv.trim().split("\n"); 
        if (lines.length < 2) { 
          setRows([]); 
          setLoading(false); 
          return; 
        } 
        var headers = parseCSVRow(lines[0]).map(function(h) { return h.toLowerCase().trim(); }); 
        var tsIdx = headers.indexOf("timestamp");
        var nameIdx = headers.indexOf("name"); 
        var statusIdx = headers.indexOf("status"); 
        var parsed = []; 
        for (var i = 1; i < lines.length; i++) { 
          if (!lines[i].trim()) continue; 
          var cols = parseCSVRow(lines[i]); 
          var ts = tsIdx >= 0 ? new Date(cols[tsIdx]).getTime() : 0; 
          if (ts >= sessionStart) { 
            parsed.push({ 
              name: nameIdx >= 0 ? cols[nameIdx] : "?", 
              status: statusIdx >= 0 ? cols[statusIdx] : "?" 
            }); 
          } 
        } 
        setRows(parsed); 
        setLoading(false);
        setLastRefresh(new Date()); 
      })
      .catch(function() { setLoading(false); }); 
  }

  React.useEffect(function() { 
    fetchRows(); 
    var interval = setInterval(fetchRows, REFRESH_INTERVAL); 
    return function() { clearInterval(interval); }; 
  }, [sessionStart]);

  // Compute stats 
  var studentMap = {}; 
  rows.forEach(function(r) { 
    if (!studentMap[r.name]) studentMap[r.name] = [];
    studentMap[r.name].push(r.status); 
  }); 
  var students = Object.keys(studentMap); 
  var totalStudents = students.length; 
  var completed = students.filter(function(n) { 
    return studentMap[n].some(function(s) { return s === "completed"; });
  }).length; 
  var firstTryMasters = students.filter(function(n) { 
    var statuses = studentMap[n]; 
    return statuses[0] === "completed"; 
  }).length;
  var successRate = totalStudents > 0 ? Math.round((firstTryMasters / totalStudents) * 100) : 0;

  var trafficLight = successRate >= 80 ? "#38a169" : successRate >= 50 ? "#dd6b20" : "#e53e3e"; 
  var trafficLabel = successRate >= 80 ? "Ready to move on" : successRate >= 50 ? "Some students need support" : "Re-model recommended";

  var csvNotSet = !TRACKING_CSV_URL || TRACKING_CSV_URL === "PASTE_YOUR_CSV_URL_HERE";

  return e("div", { style: { padding: 24, maxWidth: 700, margin: "0 auto" } }, 
    e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } }, 
      e("h2", { style: { margin: 0, fontSize: 22, color: "#2d3748" } }, "Session Summary"), 
      e("button", { onClick: props.onReset, style: { padding: "8px 18px", fontSize: 14, fontWeight: 600, background: "#fff", color: "#e53e3e", border: "2px solid #e53e3e", borderRadius: 8, cursor: "pointer" } }, "Reset Session") 
    ),
    csvNotSet && e("div", {
      style: { background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: 16, marginBottom: 20, color: "#856404" }
    },
      e("strong", null, "Setup needed: "),
      "Update TRACKING_CSV_URL in app.js with your published Google Sheets CSV URL."
    ),
    e("div", {
      style: { background: trafficLight, borderRadius: 12, padding: "18px 24px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", gap: 16 }
    },
      e("span", { style: { fontSize: 36 } }, successRate >= 80 ? "✅" : successRate >= 50 ? "⚠️" : "❌"),
      e("div", null,
        e("div", { style: { fontSize: 28, fontWeight: 800 } }, successRate + "% first-try success"),
        e("div", { style: { fontSize: 15, opacity: 0.9 } }, trafficLabel)
      )
    ),
    e("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 } },
      e("div", { style: { background: "#f7f7f7", borderRadius: 10, padding: 16, textAlign: "center" } },
        e("div", { style: { fontSize: 28, fontWeight: 800, color: "#6c63ff" } }, totalStudents),
        e("div", { style: { fontSize: 13, color: "#555" } }, "Students active")
      ),
      e("div", { style: { background: "#f7f7f7", borderRadius: 10, padding: 16, textAlign: "center" } },
        e("div", { style: { fontSize: 28, fontWeight: 800, color: "#38a169" } }, completed),
        e("div", { style: { fontSize: 13, color: "#555" } }, "Completed")
      ),
      e("div", { style: { background: "#f7f7f7", borderRadius: 10, padding: 16, textAlign: "center" } },
        e("div", { style: { fontSize: 28, fontWeight: 800, color: "#dd6b20" } }, firstTryMasters),
        e("div", { style: { fontSize: 13, color: "#555" } }, "First-try masters")
      )
    ),
    students.length > 0 && e("div", null,
      e("h3", { style: { fontSize: 16, marginBottom: 10, color: "#4a5568" } }, "Students"),
      e("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        students.map(function(name) {
          var statuses = studentMap[name];
          var done = statuses.some(function(s) { return s === "completed"; });
          var firstTry = statuses[0] === "completed";
          return e("div", {
            key: name,
            style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }
          },
            e("span", { style: { fontWeight: 600 } }, name),
            e("span", {
              style: { fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: firstTry ? "#c6f6d5" : done ? "#bee3f8" : "#fed7d7", color: firstTry ? "#276749" : done ? "#2b6cb0" : "#9b2c2c" }
            }, firstTry ? "First try!" : done ? "Completed" : "In progress")
          );
        })
      )
    ),
    loading && e("p", { style: { color: "#888", textAlign: "center" } }, "Loading..."),
    lastRefresh && e("p", { style: { color: "#aaa", fontSize: 12, textAlign: "right", marginTop: 16 } },
      "Last refreshed: " + lastRefresh.toLocaleTimeString()
    )
  ); 
}

// Sentence Card
function SentenceCard(props) { 
  var sentence = props.sentence; 
  var index = props.index; 
  var isDragging = props.isDragging; 
  var onDragStart = props.onDragStart; 
  var onDragOver = props.onDragOver; 
  var onDrop = props.onDrop; 
  var onDragEnd = props.onDragEnd; 
  var onKeyDown = props.onKeyDown;

  return e("div", { 
    draggable: true, 
    onDragStart: function() { onDragStart(index); }, 
    onDragOver: function(ev) { ev.preventDefault(); onDragOver(index); }, 
    onDrop: function() { onDrop(index); }, 
    onDragEnd: onDragEnd, 
    onKeyDown: function(ev) { onKeyDown(ev, index); }, 
    tabIndex: 0, role: "listitem", "aria-label": "Sentence " + (index + 1) + ": " + sentence + ". Use arrow keys to reorder.", 
    style: { background: isDragging ? "#e9e6ff" : "#fff", border: isDragging ? "2px solid #6c63ff" : "2px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "grab", display: "flex", alignItems: "center", gap: 14, boxShadow: isDragging ? "0 4px 16px rgba(108,99,255,0.15)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.15s, border-color 0.15s", userSelect: "none", outline: "none" } 
  }, 
    e("span", { "aria-hidden": "true", style: { fontSize: 20, color: "#aaa", flexShrink: 0 } }, "⠿"), 
    e("span", { style: { fontSize: 16, lineHeight: 1.5, color: "#2d3748" } }, sentence) 
  ); 
}

// Student Activity
function StudentActivity(props) { 
  var config = props.config; 
  var studentName = props.studentName;

  var correctOrder = config.sentences; 
  var _order = React.useState(function() { return shuffle(correctOrder); }); 
  var order = _order[0]; 
  var setOrder = _order[1]; 
  var _dragging = React.useState(null); 
  var dragging = _dragging[0]; 
  var setDragging = _dragging[1]; 
  var _over = React.useState(null); 
  var over = _over[0]; 
  var setOver = _over[1]; 
  var _attempts = React.useState(0); 
  var attempts = _attempts[0]; 
  var setAttempts = _attempts[1]; 
  var _clueIdx = React.useState(null); 
  var clueIdx = _clueIdx[0]; 
  var setClueIdx = _clueIdx[1]; 
  var _status = React.useState("idle"); 
  var status = _status[0]; 
  var setStatus = _status[1]; 
  var _feedback = React.useState(null); 
  var feedback = _feedback[0]; 
  var setFeedback = _feedback[1]; 
  var _shakeKey = React.useState(0); 
  var shakeKey = _shakeKey[0]; 
  var setShakeKey = _shakeKey[1];

  function isCorrect(ord) { 
    return ord.every(function(s, i) { return s === correctOrder[i]; }); 
  }

  function handleCheck() { 
    var newAttempts = attempts + 1;
    setAttempts(newAttempts); 
    if (isCorrect(order)) { 
      setStatus("success");
      setFeedback(null); 
      var firstTry = newAttempts === 1;
      sendTrackingData(studentName, config.gameId, newAttempts, "completed", firstTry ? "first_try" : "multi_attempt"); 
      if (firstTry && typeof InteractivesTelemetry !== "undefined") {
        InteractivesTelemetry.track("first_try_mastered", { gameId: config.gameId }); 
      } 
      if (typeof InteractivesTelemetry !== "undefined") {
        InteractivesTelemetry.track("paragraph_completed", { gameId: config.gameId, attempts: newAttempts }); 
      } 
    } else { 
      setStatus("error");
      setShakeKey(function(k) { return k + 1; });
      sendTrackingData(studentName, config.gameId, newAttempts, "incorrect", ""); 
      if (typeof InteractivesTelemetry !== "undefined") {
        InteractivesTelemetry.track("paragraph_attempt", { gameId: config.gameId, attempt: newAttempts, correct: false }); 
      } 
      if (config.distractors && config.distractors[0]) { 
        var wrong = order.findIndex(function(s, i) { return s !== correctOrder[i]; }); 
        if (wrong >= 0 && config.distractors[wrong]) {
          setFeedback(config.distractors[wrong]); 
          if (typeof InteractivesTelemetry !== "undefined") { 
            InteractivesTelemetry.track("distractor_used", { gameId: config.gameId, index: wrong }); 
          } 
        } 
      } 
    } 
  }

  function handleClue(idx) { 
    setClueIdx(idx); 
    if (typeof InteractivesTelemetry !== "undefined") {
      InteractivesTelemetry.track("clue_used", { gameId: config.gameId, index: idx }); 
    } 
  }

  function handleReset() { 
    setOrder(shuffle(correctOrder));
    setAttempts(0); 
    setStatus("idle"); 
    setFeedback(null); 
    setClueIdx(null);
    setDragging(null); 
    setOver(null); 
  }

  function handleDragStart(idx) { setDragging(idx); } 
  function handleDragOver(idx) { setOver(idx); } 
  function handleDragEnd() { setDragging(null); setOver(null); } 
  
  function handleDrop(idx) { 
    if (dragging === null || dragging === idx) return; 
    var newOrder = order.slice(); 
    var item = newOrder.splice(dragging, 1)[0];
    newOrder.splice(idx, 0, item); 
    setOrder(newOrder); 
    setDragging(null);
    setOver(null); 
    setStatus("idle"); 
    setFeedback(null); 
  }

  function handleKeyDown(ev, idx) { 
    if (ev.key === "ArrowUp" && idx > 0) {
      ev.preventDefault(); 
      var newOrder = order.slice(); 
      var tmp = newOrder[idx]; 
      newOrder[idx] = newOrder[idx - 1]; 
      newOrder[idx - 1] = tmp; 
      setOrder(newOrder); 
      setStatus("idle"); 
    } 
    if (ev.key === "ArrowDown" && idx < order.length - 1) { 
      ev.preventDefault(); 
      var newOrder = order.slice(); 
      var tmp = newOrder[idx]; 
      newOrder[idx] = newOrder[idx + 1]; 
      newOrder[idx + 1] = tmp; 
      setOrder(newOrder); 
      setStatus("idle"); 
    } 
  }

  if (status === "success") { 
    return e("div", { style: { textAlign: "center", padding: 40, maxWidth: 600, margin: "0 auto" } }, 
      e("div", { style: { fontSize: 64, marginBottom: 16 } }, "🎉"), 
      e("h2", { style: { color: "#38a169", fontSize: 28, marginBottom: 8 } }, attempts === 1 ? "First try! Amazing!" : "Well done!" ), 
      e("p", { style: { color: "#555", fontSize: 16, marginBottom: 24 } }, "You got it " + (attempts === 1 ? "on your first try!" : "in " + attempts + " attempts.") ), 
      e("button", { onClick: handleReset, style: { padding: "12px 32px", fontSize: 16, fontWeight: 700, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" } }, "Try again") 
    ); 
  }

  return e("div", { style: { maxWidth: 680, margin: "0 auto", padding: "0 16px 40px" } }, 
    e("p", { style: { color: "#555", fontSize: 15, marginBottom: 20, textAlign: "center" } }, "Drag the sentences into the correct order to form a well-structured paragraph." ), 
    e("div", { role: "list", "aria-label": "Sentences to reorder", key: shakeKey },
      order.map(function(sentence, idx) { 
        return e(SentenceCard, { 
          key: sentence, sentence: sentence, index: idx, 
          isDragging: dragging === idx || over === idx, 
          onDragStart: handleDragStart, onDragOver: handleDragOver, 
          onDrop: handleDrop, onDragEnd: handleDragEnd, onKeyDown: handleKeyDown 
        }); 
      }) 
    ), 
    status === "error" && e("div", { role: "alert", style: { background: "#fff5f5", border: "1px solid #fc8181", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#c53030", fontSize: 14 } }, 
      feedback ? e("span", null, feedback) : e("span", null, "Not quite right. Try rearranging the sentences.") 
    ),
    clueIdx !== null && config.clues && config.clues[clueIdx] && e("div", { style: { background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#2b6cb0", fontSize: 14 } }, 
      e("strong", null, "Clue: "), config.clues[clueIdx]
    ), 
    e("div", { style: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" } }, 
      e("button", { onClick: handleCheck, style: { padding: "12px 32px", fontSize: 16, fontWeight: 700, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", minWidth: 140 } }, "Check my answer"),
      config.clues && config.clues.some(function(c) { return c; }) && e("button", { onClick: function() { handleClue(0); }, style: { padding: "12px 24px", fontSize: 15, background: "#fff", color: "#6c63ff", border: "2px solid #6c63ff", borderRadius: 10, cursor: "pointer" } }, "Show clue") 
    ), 
    attempts > 0 && e("p", { style: { textAlign: "center", color: "#888", marginTop: 12, fontSize: 14 } }, "Attempts: " + attempts ) 
  ); 
}

// No Config Message
function NoConfigMessage() { 
  return e("div", { style: { maxWidth: 480, margin: "60px auto", padding: 40, background: "#fff", borderRadius: 16, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" } },
    e("div", { style: { fontSize: 48, marginBottom: 16 } }, "🔗"), 
    e("h2", { style: { color: "#2d3748", marginBottom: 12, fontSize: 22 } }, "You need a teacher-generated link" ), 
    e("p", { style: { color: "#555", fontSize: 16, lineHeight: 1.6 } }, "To use this activity, ask your teacher to share their activity link with you." ) 
  ); 
}

// Teacher Setup
function TeacherSetup() { 
  var _sentences = React.useState(["","","","",""]); 
  var sentences = _sentences[0]; 
  var setSentences = _sentences[1]; 
  var _distractors = React.useState(["","","","",""]); 
  var distractors = _distractors[0]; 
  var setDistractors = _distractors[1]; 
  var _clues = React.useState(["","","","",""]); 
  var clues = _clues[0]; 
  var setClues = _clues[1]; 
  var _gameId = React.useState("game-" + Date.now()); 
  var gameId = _gameId[0]; 
  var _link = React.useState(null); 
  var link = _link[0]; 
  var setLink = _link[1]; 
  var _copied = React.useState(false);
  var copied = _copied[0]; 
  var setCopied = _copied[1];

  function updateSentence(idx, val) { var a = sentences.slice(); a[idx] = val; setSentences(a); } 
  function updateDistractor(idx, val) { var a = distractors.slice(); a[idx] = val; setDistractors(a); } 
  function updateClue(idx, val) { var a = clues.slice(); a[idx] = val; setClues(a); } 
  function addRow() { 
    setSentences(sentences.concat([""]));
    setDistractors(distractors.concat([""])); 
    setClues(clues.concat([""]));
  } 
  function removeRow(idx) { 
    setSentences(sentences.filter(function(_, i) { return i !== idx; })); 
    setDistractors(distractors.filter(function(_, i) { return i !== idx; })); 
    setClues(clues.filter(function(_, i) { return i !== idx; })); 
  }

  function generateLink() { 
    var valid = sentences.filter(function(s) { return s.trim(); }); 
    if (valid.length < 2) { 
      alert("Please enter at least 2 sentences."); 
      return; 
    } 
    var csv = "id,sentence,distractor,clue\n" + sentences.map(function(s, i) { 
      return [gameId, s, distractors[i] || "", clues[i] || ""].map(function(v) {
        return '"' + v.replace(/"/g,'""') + '"'; 
      }).join(","); 
    }).join("\n"); 
    
    var encoded = btoa(unescape(encodeURIComponent(csv))); 
    var url = window.location.origin + window.location.pathname + "?config=" + encoded; 
    setLink(url); 
  }

  function copyLink() { 
    if (!link) return;
    navigator.clipboard.writeText(link).then(function() { 
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000); 
    }); 
  }

  var numRows = sentences.length;

  return e("div", { style: { maxWidth: 800, margin: "0 auto", padding: "0 16px 60px" } }, 
    e("p", { style: { color: "#555", marginBottom: 24, fontSize: 15 } }, "Enter sentences in the correct order. Add optional distractors (hints for wrong answers) and clues." ), 
    e("div", { style: { overflowX: "auto" } }, 
      e("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 } }, 
        e("thead", null, 
          e("tr", null, 
            e("th", { style: { textAlign: "left", padding: "8px 10px", color: "#6c63ff", width: 30 } }, "#"), 
            e("th", { style: { textAlign: "left", padding: "8px 10px", color: "#6c63ff" } }, "Sentence (correct order) *"), 
            e("th", { style: { textAlign: "left", padding: "8px 10px", color: "#6c63ff" } }, "Distractor (optional)"), 
            e("th", { style: { textAlign: "left", padding: "8px 10px", color: "#6c63ff" } }, "Clue (optional)"),
            e("th", { style: { width: 40 } }) 
          ) 
        ), 
        e("tbody", null,
          sentences.map(function(s, idx) { 
            return e("tr", { key: idx, style: { borderTop: "1px solid #eee" } }, 
              e("td", { style: { padding: "8px 10px", color: "#888", fontWeight: 700 } }, idx + 1), 
              e("td", { style: { padding: "6px 8px" } }, 
                e("input", { type: "text", value: s, onChange: function(ev) { updateSentence(idx, ev.target.value); }, placeholder: "Sentence " + (idx + 1), "aria-label": "Sentence " + (idx + 1), style: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" } }) 
              ), 
              e("td", { style: { padding: "6px 8px" } }, 
                e("input", { type: "text", value: distractors[idx] || "", onChange: function(ev) { updateDistractor(idx, ev.target.value); }, placeholder: "Optional hint...", "aria-label": "Distractor for sentence " + (idx + 1), style: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" } }) 
              ), 
              e("td", { style: { padding: "6px 8px" } }, 
                e("input", { type: "text", value: clues[idx] || "", onChange: function(ev) { updateClue(idx, ev.target.value); }, placeholder: "Optional clue...", "aria-label": "Clue for sentence " + (idx + 1), style: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" } }) 
              ),
              e("td", { style: { padding: "6px 8px", textAlign: "center" } },
                numRows > 2 && e("button", { onClick: function() { removeRow(idx); }, "aria-label": "Remove row " + (idx + 1), style: { background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: 18, padding: 4 } }, "×") 
              ) 
            ); 
          }) 
        ) 
      ) 
    ), 
    e("button", { onClick: addRow, style: { marginTop: 12, padding: "8px 20px", fontSize: 14, background: "#fff", color: "#6c63ff", border: "2px solid #6c63ff", borderRadius: 8, cursor: "pointer" } }, "+ Add sentence"), 
    e("div", { style: { marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" } }, 
      e("button", { onClick: generateLink, style: { padding: "12px 28px", fontSize: 15, fontWeight: 700, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" } }, "Generate activity link") 
    ),
    link && e("div", { style: { marginTop: 24, background: "#f0f4ff", border: "1px solid #c3d0ff", borderRadius: 10, padding: 20 } }, 
      e("p", { style: { fontSize: 13, color: "#555", marginBottom: 8 } }, "Share this link with your students:"), 
      e("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, 
        e("input", { type: "text", readOnly: true, value: link, "aria-label": "Generated activity link", style: { flex: 1, minWidth: 200, padding: "10px 12px", fontSize: 13, border: "1px solid #c3d0ff", borderRadius: 8, background: "#fff" } }), 
        e("button", { onClick: copyLink, style: { padding: "10px 20px", fontSize: 14, fontWeight: 600, background: copied ? "#38a169" : "#6c63ff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" } }, copied ? "Copied!" : "Copy link") 
      ) 
    ) 
  ); 
}

// App Root
function App() { 
  var params = new URLSearchParams(window.location.search); 
  var configParam = params.get("config"); 
  var isTeacherPage = params.get("teacher") === "1"; 
  var _tab = React.useState(isTeacherPage ? "teacher" : "student"); 
  var tab = _tab[0]; 
  var setTab = _tab[1]; 
  var _pinUnlocked = React.useState(false); 
  var pinUnlocked = _pinUnlocked[0]; 
  var setPinUnlocked = _pinUnlocked[1]; 
  var _showPinModal = React.useState(false); 
  var showPinModal = _showPinModal[0]; 
  var setShowPinModal = _showPinModal[1]; 
  var _studentName = React.useState(null); 
  var studentName = _studentName[0]; 
  var setStudentName = _studentName[1]; 
  var _sessionStart = React.useState(Date.now()); 
  var sessionStart = _sessionStart[0]; 
  var setSessionStart = _sessionStart[1];

  var _config = React.useState(null); 
  var config = _config[0]; 
  var setConfig = _config[1]; 
  var _configError = React.useState(false); 
  var configError = _configError[0]; 
  var setConfigError = _configError[1];

  React.useEffect(function() { 
    if (!configParam) return; 
    try { 
      var decoded = decodeURIComponent(escape(atob(configParam))); 
      var parsed = parseConfig(decoded); 
      if (parsed) setConfig(parsed); else setConfigError(true); 
    } catch (err) { 
      setConfigError(true); 
    } 
  }, []);

  function handleTabClick(newTab) { 
    if (newTab === "teacher" && !pinUnlocked) { 
      setShowPinModal(true); 
    } else { 
      setTab(newTab); 
    } 
  }

  function handlePinSuccess() { 
    setPinUnlocked(true);
    setShowPinModal(false); 
    setTab("teacher"); 
  }

  function handleReset() { 
    if (window.confirm("Reset the session? This will clear current stats and start fresh.")) {
      setSessionStart(Date.now()); 
    } 
  }

  var showStudentContent = tab === "student";

  return e("div", { style: { minHeight: "100vh", background: "#f4f3ff", fontFamily: "'Segoe UI', system-ui, sans-serif" } }, 
    showPinModal && e(PinModal, { onSuccess: handlePinSuccess, onCancel: function() { setShowPinModal(false); } }),
    // Header
    e("header", { style: { background: "#6c63ff", color: "#fff", padding: "0 24px" } },
      e("div", { style: { maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 } },
        e("h1", { style: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" } }, "Fix the Paragraph"),
        e("nav", { role: "tablist", "aria-label": "App sections", style: { display: "flex", gap: 4 } },
          e("button", {
            role: "tab",
            "aria-selected": tab === "student",
            onClick: function() { setTab("student"); },
            style: {
              padding: "8px 18px", fontSize: 14, fontWeight: 600, border: "none",
              borderRadius: 8, cursor: "pointer",
              background: tab === "student" ? "rgba(255,255,255,0.25)" : "transparent",
              color: "#fff"
            }
          }, "Activity"),
          e("button", {
            role: "tab",
            "aria-selected": tab === "teacher",
            onClick: function() { handleTabClick("teacher"); },
            style: {
              padding: "8px 18px", fontSize: 14, fontWeight: 600, border: "none",
              borderRadius: 8, cursor: "pointer",
              background: tab === "teacher" ? "rgba(255,255,255,0.25)" : "transparent",
              color: "#fff"
            }
          }, "Teacher")
        )
      )
    ),
    // Name modal for students
    tab === "student" && config && !studentName && e(NameModal, { onSubmit: setStudentName }),
    // Tab panels
    e("main", { style: { maxWidth: 800, margin: "0 auto", paddingTop: 32 } },
      tab === "student" && e("div", { role: "tabpanel" },
        configError
          ? e("div", { style: { textAlign: "center", padding: 40, color: "#e53e3e" } }, "Could not load the activity. The link may be invalid.")
          : config
            ? e(StudentActivity, { config: config, studentName: studentName || "anonymous" })
            : e(NoConfigMessage, null)
      ),
      tab === "teacher" && pinUnlocked && e("div", { role: "tabpanel" },
        e("div", { style: { padding: "0 24px" } },
          e("div", { style: { borderBottom: "2px solid #e2e8f0", marginBottom: 28, display: "flex", gap: 0 } })
        ),
        e(TeacherTabContent, { sessionStart: sessionStart, onReset: handleReset, configParam: configParam })
      )
    )
  ); 
}

// Teacher Tab Content
function TeacherTabContent(props) { 
  var _sub = React.useState("session"); 
  var sub = _sub[0]; 
  var setSub = _sub[1];

  return e("div", null, 
    e("div", { style: { padding: "0 24px", borderBottom: "2px solid #e2e8f0", display: "flex", gap: 4, marginBottom: 0 } }, 
      e("button", { onClick: function() { setSub("session"); }, style: { padding: "10px 20px", fontWeight: 600, fontSize: 14, border: "none", borderBottom: sub === "session" ? "3px solid #6c63ff" : "3px solid transparent", background: "transparent", color: sub === "session" ? "#6c63ff" : "#555", cursor: "pointer" } }, "Session Summary"), 
      e("button", { onClick: function() { setSub("setup"); }, style: { padding: "10px 20px", fontWeight: 600, fontSize: 14, border: "none", borderBottom: sub === "setup" ? "3px solid #6c63ff" : "3px solid transparent", background: "transparent", color: sub === "setup" ? "#6c63ff" : "#555", cursor: "pointer" } }, "Create Activity") 
    ), 
    sub === "session" ? e(TeacherPanel, { sessionStart: props.sessionStart, onReset: props.onReset }) : e(TeacherSetup, null) 
  ); 
}

// Mount
var root = ReactDOM.createRoot(document.getElementById("root"));
root.render(e(App, null));
