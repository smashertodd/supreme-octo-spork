// app.js - Fix the Paragraph Mini App (Vanilla JS Edition)

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
var TRACKING_URL    = "https://script.google.com/macros/s/AKfycbyL4Ws4DK4UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91jUOTkXuSJJWiWMEHQ/exec";
var LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
var TRACKING_CSV_URL= "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
var PIN              = "9999";
var REFRESH_INTERVAL = 15000;

// ─── STATE ──────────────────────────────────────────────────────────────────
var state = {
  tab:          "student",   // "student" | "teacher"
  pinUnlocked:  false,
  studentName:  "",
  currentAct:   null,        // { gameId, title, sentences[] }
  sessionStart: Date.now(),
  // activity state
  pool:         [],
  slots:        [],
  attempts:     0,
  actStatus:    "idle",      // "idle" | "error" | "success"
  dragging:     null,        // { source:"pool"|"slot", index, item }
  // teacher state
  teacherRows:  [],
  teacherTimer: null
};

// ─── UTILITIES ──────────────────────────────────────────────────────────────
function parseCSVRow(row) {
  var result = [], insideQuote = false, current = "";
  for (var i = 0; i < row.length; i++) {
    var ch = row[i];
    if (ch === '"' && !insideQuote) { insideQuote = true; continue; }
    if (ch === '"' && insideQuote)  { insideQuote = false; continue; }
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

function el(tag, attrs, children) {
  var elem = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      if (k === "className")      { elem.className = attrs[k]; }
      else if (k === "style" && typeof attrs[k] === "object") {
        Object.assign(elem.style, attrs[k]);
      }
      else if (k.startsWith("on")) {
        elem.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      }
      else { elem.setAttribute(k, attrs[k]); }
    });
  }
  if (children) {
    (Array.isArray(children) ? children : [children]).forEach(function(c) {
      if (c == null) return;
      elem.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
  }
  return elem;
}

function sendTrackingData(name, gameId, attempt, status, details) {
  var params = new URLSearchParams();
  params.append("name",    name    || "anonymous");
  params.append("gameId",  gameId  || "unknown");
  params.append("attempt", String(attempt));
  params.append("status",  status);
  params.append("details", details || "");
  fetch(TRACKING_URL + "?" + params.toString(), { method: "GET", mode: "no-cors" }).catch(function(){});
}

// ─── RENDER ENGINE ──────────────────────────────────────────────────────────
function render() {
  var root = document.getElementById("root");
  root.innerHTML = "";
  root.appendChild(buildApp());
}

// ─── APP SHELL ──────────────────────────────────────────────────────────────
function buildApp() {
  var wrap = el("div", {});

  // ── PIN MODAL ──
  if (state.showPin) {
    wrap.appendChild(buildPinModal());
    return wrap;
  }

  // ── NAME MODAL (student tab, no name yet) ──
  if (state.tab === "student" && !state.studentName) {
    wrap.appendChild(buildNameModal());
    return wrap;
  }

  // ── NAV BAR ──
  wrap.appendChild(buildNavBar());

  // ── MAIN CONTENT ──
  var main = el("main", {});
  if (state.tab === "student") {
    if (!state.currentAct) {
      main.appendChild(buildLibraryScreen());
    } else {
      main.appendChild(buildStudentActivity());
    }
  } else {
    main.appendChild(buildTeacherPanel());
  }
  wrap.appendChild(main);
  return wrap;
}

// ─── NAV BAR ────────────────────────────────────────────────────────────────
function buildNavBar() {
  var studentBtn = el("button", {
    className: "tab-btn " + (state.tab === "student" ? "tab-active" : ""),
    onClick: function() { state.tab = "student"; render(); }
  }, "Student View");

  var teacherBtn = el("button", {
    className: "tab-btn " + (state.tab === "teacher" ? "tab-active" : ""),
    onClick: function() {
      if (!state.pinUnlocked) { state.showPin = true; render(); return; }
      state.tab = "teacher";
      render();
      startTeacherRefresh();
    }
  }, "Teacher View");

  return el("div", {
    style: {
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "16px 24px", display: "flex",
      justifyContent: "space-between", alignItems: "center"
    }
  }, [
    el("div", { style: { fontWeight: "800", color: "var(--accent)", fontSize: "18px" } }, "Fix the Paragraph"),
    el("div", { className: "tab-bar", style: { borderBottom: "none", margin: "0", padding: "0" } }, [studentBtn, teacherBtn])
  ]);
}

// ─── NAME MODAL ─────────────────────────────────────────────────────────────
function buildNameModal() {
  var input = el("input", {
    className: "text-input",
    type: "text",
    placeholder: "Type your name...",
    autofocus: "true"
  });

  var btn = el("button", {
    className: "btn-primary btn-full",
    onClick: function() {
      var v = input.value.trim();
      if (!v) return;
      state.studentName = v;
      render();
    }
  }, "Let's Go!");

  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") btn.click();
  });

  return el("div", { className: "modal-backdrop" }, [
    el("div", { className: "modal-box" }, [
      el("h2", { className: "modal-heading" }, "Fix the Paragraph"),
      el("p",  { className: "modal-subtext" }, "Enter your name to begin."),
      input,
      btn
    ])
  ]);
}

// ─── PIN MODAL ──────────────────────────────────────────────────────────────
function buildPinModal() {
  var errDiv = el("div", { className: "error-msg", style: { display: "none" } }, "Incorrect PIN");
  var input  = el("input", {
    className: "text-input pin-input",
    type: "password",
    placeholder: "****",
    autofocus: "true"
  });

  var unlockBtn = el("button", {
    className: "btn-primary",
    style: { flex: "1" },
    onClick: function() {
      if (input.value === PIN) {
        state.pinUnlocked = true;
        state.showPin     = false;
        state.tab         = "teacher";
        render();
        startTeacherRefresh();
      } else {
        errDiv.style.display = "block";
        input.value = "";
      }
    }
  }, "Unlock");

  var cancelBtn = el("button", {
    className: "btn-secondary",
    style: { flex: "1" },
    onClick: function() { state.showPin = false; render(); }
  }, "Cancel");

  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") unlockBtn.click();
  });

  return el("div", { className: "modal-backdrop" }, [
    el("div", { className: "modal-box" }, [
      el("h2", { className: "modal-heading" }, "Teacher Access"),
      el("p",  { className: "modal-subtext" }, "Enter PIN to view student progress."),
      input,
      errDiv,
      el("div", { className: "btn-row", style: { marginTop: "16px" } }, [unlockBtn, cancelBtn])
    ])
  ]);
}

// ─── LIBRARY SCREEN ─────────────────────────────────────────────────────────
function buildLibraryScreen() {
  var wrapper = el("div", { className: "app-wrapper" });

  var loadingDiv = el("div", { style: { textAlign: "center", marginTop: "60px", color: "var(--text-muted)" } }, "Loading Library...");
  wrapper.appendChild(loadingDiv);

  fetch(LIBRARY_CSV_URL + "&t=" + Date.now())
    .then(function(r) { return r.text(); })
    .then(function(csv) {
      var lines   = csv.trim().split("\n");
      var headers = parseCSVRow(lines[0]).map(function(h) { return h.toLowerCase().trim(); });
      var titleIdx = headers.indexOf("title");
      var library  = [];

      for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var cols  = parseCSVRow(lines[i]);
        var title = titleIdx >= 0 ? cols[titleIdx] : cols[0];
        if (!title) continue;
        var sentences = [];
        for (var j = 0; j < cols.length; j++) {
          if (j !== titleIdx && cols[j] && cols[j].trim()) {
            sentences.push(cols[j].trim());
          }
        }
        if (sentences.length >= 2) {
          library.push({ gameId: "lib-" + i, title: title, sentences: sentences });
        }
      }

      wrapper.innerHTML = "";

      // Header
      wrapper.appendChild(
        el("div", { className: "view-header", style: { justifyContent: "center" } }, [
          el("h2", { className: "game-title" }, "Activity Library")
        ])
      );

      if (library.length === 0) {
        wrapper.appendChild(el("p", { style: { textAlign: "center", color: "var(--text-muted)" } }, "No activities found. Add some rows to your Google Sheet!"));
        return;
      }

      var grid = el("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px"
        }
      });

      library.forEach(function(act) {
        var card = el("div", {
          className: "part-card",
          style: { cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", padding: "24px", textAlign: "center" },
          onClick: function() { selectActivity(act); }
        }, [
          el("div", { style: { fontSize: "18px", fontWeight: "700" } }, act.title),
          el("div", { style: { fontSize: "13px", color: "var(--text-muted)" } }, act.sentences.length + " sentences")
        ]);
        grid.appendChild(card);
      });

      wrapper.appendChild(grid);
    })
    .catch(function() {
      wrapper.innerHTML = "";
      wrapper.appendChild(el("p", { style: { textAlign: "center", color: "var(--error, red)" } }, "Could not load library. Check your CSV URL and sheet permissions."));
    });

  return wrapper;
}

function selectActivity(act) {
  state.currentAct = act;
  state.pool       = shuffle(act.sentences.map(function(s, i) { return { id: i, text: s }; }));
  state.slots      = new Array(act.sentences.length).fill(null);
  state.attempts   = 0;
  state.actStatus  = "idle";
  state.dragging   = null;
  render();
}

// ─── STUDENT ACTIVITY ───────────────────────────────────────────────────────
function buildStudentActivity() {
  var act          = state.currentAct;
  var correctOrder = act.sentences;

  if (state.actStatus === "success") {
    return el("div", { className: "app-wrapper" }, [
      el("div", { className: "create-card", style: { textAlign: "center", marginTop: "40px", alignItems: "center" } }, [
        el("div", { style: { fontSize: "64px", marginBottom: "16px" } }, "🎉"),
        el("h2", { className: "modal-heading", style: { color: "var(--success, green)" } },
          state.attempts === 1 ? "First try! Amazing!" : "Well done!"),
        el("p", { className: "modal-subtext", style: { marginBottom: "24px" } },
          "You ordered the paragraph perfectly in " + state.attempts + " attempt(s)."),
        el("button", { className: "btn-secondary", onClick: function() { state.currentAct = null; render(); } }, "Back to Library")
      ])
    ]);
  }

  var wrapper = el("div", { className: "app-wrapper" });

  // View header
  wrapper.appendChild(
    el("div", { className: "view-header" }, [
      el("button", { className: "btn-ghost btn-sm", onClick: function() { state.currentAct = null; render(); } }, "Back to Library"),
      el("div", { className: "player-info" }, "👤 " + state.studentName)
    ])
  );

  // Preview panel
  wrapper.appendChild(
    el("div", { className: "preview-panel" }, [
      el("h2", { className: "section-heading", style: { marginBottom: "8px" } }, act.title),
      el("p", { className: "game-instructions" }, "Drag the sentences into the correct order.")
    ])
  );

  // Pool
  wrapper.appendChild(buildPool());

  // Slots
  wrapper.appendChild(buildSlots(correctOrder));

  // Error feedback
  if (state.actStatus === "error") {
    wrapper.appendChild(
      el("div", { className: "feedback-box feedback-error", style: { marginBottom: "24px" } }, "Not quite right! Try swapping some sentences.")
    );
  }

  // Check button
  var checkBtn = el("button", {
    className: "btn-primary",
    onClick: handleCheck
  }, "Check My Answer");
  if (state.pool.length > 0) checkBtn.setAttribute("disabled", "true");

  wrapper.appendChild(
    el("div", { className: "btn-row", style: { justifyContent: "center" } }, [checkBtn])
  );

  return wrapper;
}

function buildPool() {
  var poolItems = state.pool.map(function(item, idx) {
    var card = el("div", {
      className: "part-card",
      draggable: "true"
    }, item.text);

    card.addEventListener("dragstart", function(e) {
      state.dragging = { source: "pool", index: idx, item: item };
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", function() { state.dragging = null; });

    return card;
  });

  return el("div", { className: "section-block" }, [
    el("div", { className: "section-label" }, "Sentence Pool"),
    el("div", { className: "pool-container" },
      poolItems.length > 0 ? poolItems : [el("span", { style: { color: "var(--text-muted)" } }, "All sentences placed!")]
    )
  ]);
}

function buildSlots(correctOrder) {
  var slotEls = state.slots.map(function(item, idx) {
    var slotDiv = el("div", { className: "drop-slot" });

    slotDiv.addEventListener("dragover", function(e) {
      e.preventDefault();
      slotDiv.classList.add("slot-drag-over");
    });
    slotDiv.addEventListener("dragleave", function() {
      slotDiv.classList.remove("slot-drag-over");
    });
    slotDiv.addEventListener("drop", function() {
      slotDiv.classList.remove("slot-drag-over");
      if (!state.dragging) return;
      var d       = state.dragging;
      var newPool = state.pool.slice();
      var newSlots= state.slots.slice();

      if (d.source === "pool") {
        newPool = newPool.filter(function(p) { return p.id !== d.item.id; });
      } else {
        newSlots[d.source === "slot" ? d.index : d.index] = null;
        newSlots[d.index] = null;
      }
      if (newSlots[idx]) { newPool.push(newSlots[idx]); }
      newSlots[idx]  = d.item;
      state.pool     = newPool;
      state.slots    = newSlots;
      state.dragging = null;
      state.actStatus= "idle";
      render();
    });

    if (item) {
      var card = el("div", {
        className: "part-card",
        draggable: "true"
      }, item.text);

      card.addEventListener("dragstart", function(e) {
        state.dragging = { source: "slot", index: idx, item: item };
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", function() { state.dragging = null; });
      card.addEventListener("click", function() {
        var newSlots = state.slots.slice();
        newSlots[idx] = null;
        state.slots   = newSlots;
        state.pool    = state.pool.concat([item]);
        state.actStatus = "idle";
        render();
      });
      slotDiv.appendChild(card);
    } else {
      slotDiv.appendChild(el("span", { style: { color: "var(--text-muted)", fontSize: "14px" } }, "Drop sentence " + (idx + 1) + " here"));
    }

    return slotDiv;
  });

  return el("div", { className: "section-block" }, [
    el("div", { className: "section-label" }, "Paragraph Order"),
    el("div", { className: "slots-container" }, slotEls)
  ]);
}

function handleCheck() {
  var correctOrder = state.currentAct.sentences;
  var isComplete   = state.slots.every(function(s) { return s !== null; });
  if (!isComplete) { alert("Please fill all slots before checking!"); return; }

  state.attempts++;
  var isCorrect = state.slots.every(function(s, i) { return s.text === correctOrder[i]; });

  if (isCorrect) {
    state.actStatus = "success";
    sendTrackingData(state.studentName, state.currentAct.title, state.attempts, "completed",
      state.attempts === 1 ? "first_try" : "multi_attempt");
  } else {
    state.actStatus = "error";
    sendTrackingData(state.studentName, state.currentAct.title, state.attempts, "incorrect", "");
  }
  render();
}

// ─── TEACHER PANEL ──────────────────────────────────────────────────────────
function startTeacherRefresh() {
  if (state.teacherTimer) clearInterval(state.teacherTimer);
  fetchTeacherRows();
  state.teacherTimer = setInterval(function() {
    if (state.tab === "teacher") fetchTeacherRows();
    else { clearInterval(state.teacherTimer); state.teacherTimer = null; }
  }, REFRESH_INTERVAL);
}

function fetchTeacherRows() {
  fetch(TRACKING_CSV_URL + "&t=" + Date.now())
    .then(function(r) { return r.text(); })
    .then(function(csv) {
      var lines  = csv.trim().split("\n");
      var parsed = [];
      for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var cols = parseCSVRow(lines[i]);
        var ts   = new Date(cols[0]).getTime() || 0;
        if (ts >= state.sessionStart && cols[1]) {
          parsed.push({ name: cols[1], status: cols[4], activity: cols[2] });
        }
      }
      state.teacherRows = parsed;
      if (state.tab === "teacher") render();
    }).catch(function(){});
}

function buildTeacherPanel() {
  var students = {};
  state.teacherRows.forEach(function(r) {
    if (!students[r.name]) students[r.name] = [];
    students[r.name].push(r.status);
  });

  var studentNames = Object.keys(students);
  var total        = studentNames.length;
  var completed    = studentNames.filter(function(n) { return students[n].indexOf("completed") >= 0; }).length;

  var rows = studentNames.length === 0
    ? [el("tr", {}, [el("td", { colSpan: "2", className: "no-results-msg" }, "Waiting for students to begin...")])]
    : studentNames.map(function(name) {
        var isDone = students[name].indexOf("completed") >= 0;
        return el("tr", {}, [
          el("td", { style: { fontWeight: "600" } }, name),
          el("td", {}, [el("span", { className: "badge " + (isDone ? "badge-success" : "badge-warn") }, isDone ? "Finished" : "Working...")])
        ]);
      });

  return el("div", { className: "app-wrapper" }, [
    el("div", { className: "view-header" }, [
      el("h2", { className: "game-title" }, "Session Progress"),
      el("button", {
        className: "btn-secondary",
        onClick: function() {
          state.sessionStart  = Date.now();
          state.teacherRows   = [];
          render();
          startTeacherRefresh();
        }
      }, "Reset Session")
    ]),
    el("div", { className: "stats-grid" }, [
      el("div", { className: "stat-card" }, [
        el("div", { className: "stat-num" }, String(total)),
        el("div", { className: "stat-label" }, "Active Students")
      ]),
      el("div", { className: "stat-card" }, [
        el("div", { className: "stat-num stat-green" }, String(completed)),
        el("div", { className: "stat-label" }, "Activities Finished")
      ])
    ]),
    el("div", { className: "table-wrap" }, [
      el("table", { className: "results-table" }, [
        el("thead", {}, [el("tr", {}, [el("th", {}, "Student Name"), el("th", {}, "Status")])]),
        el("tbody", {}, rows)
      ])
    ])
  ]);
}

// ─── BOOT ───────────────────────────────────────────────────────────────────
render();
