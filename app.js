config
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRKly71NfPLDm2CF3oeBf91jUOTkXuSJJWiWMEHQ/exec";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";

// CONFIG - teacher PIN
const TEACHER_PIN = "9999";

// ============================================================
// Utilities
// ============================================================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sendTrackingData(name, gameId, attempt, status, details) {
  const params = new URLSearchParams({
    name,
    gameId,
    attempt,
    status,
    details: JSON.stringify(details),
  });
  fetch(TRACKING_URL + "?" + params.toString()).catch(() => {});
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

// ============================================================
// Modal - Student Name
// ============================================================

function NameModal({ onConfirm }) {
  const [name, setName] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0) onConfirm(trimmed);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, padding: 32, maxWidth: 400, width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <h2 id="name-modal-title" style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
          Welcome!
        </h2>
        <p style={{ marginBottom: 20, color: "#4a5568" }}>Enter your name to get started.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="student-name" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Your name
          </label>
          <input
            id="student-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            style={{
              width: "100%", padding: "10px 14px", fontSize: 16,
              border: "2px solid #cbd5e0", borderRadius: 8, marginBottom: 16,
            }}
          />
          <button
            type="submit"
            disabled={name.trim().length === 0}
            style={{
              width: "100%", padding: "12px", background: "#3b82f6", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600,
              cursor: name.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: name.trim().length === 0 ? 0.5 : 1,
            }}
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Modal - Teacher PIN
// ============================================================

function PinModal({ onConfirm, onCancel }) {
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === TEACHER_PIN) {
      onConfirm();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, padding: 32, maxWidth: 400, width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <h2 id="pin-modal-title" style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
          Teacher Access
        </h2>
        <p style={{ marginBottom: 20, color: "#4a5568" }}>Enter the teacher PIN to continue.</p>
        {error && (
          <p role="alert" style={{ color: "#e53e3e", marginBottom: 12, fontWeight: 600 }}>
            Incorrect PIN. Try again.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="teacher-pin" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            PIN
          </label>
          <input
            id="teacher-pin"
            ref={inputRef}
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            style={{
              width: "100%", padding: "10px 14px", fontSize: 16,
              border: "2px solid #cbd5e0", borderRadius: 8, marginBottom: 16,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: "12px", background: "#e2e8f0", color: "#2d3748",
                border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: "12px", background: "#3b82f6", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer",
              }}
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Toast
// ============================================================

function Toast({ message, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: "#2d3748", color: "#fff", padding: "12px 24px",
        borderRadius: 8, fontWeight: 600, zIndex: 2000, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {message}
    </div>
  );
}

// ============================================================
// Teacher Setup View
// ============================================================

function TeacherSetup({ library, onSave, onExport, onImport }) {
  const [title, setTitle] = React.useState("");
  const [paragraph, setParagraph] = React.useState("");
  const [distractors, setDistractors] = React.useState("");
  const [clue, setClue] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    const sentences = paragraph.split(".").map((s) => s.trim()).filter(Boolean);
    if (sentences.length < 2) {
      alert("Please enter a paragraph with at least 2 sentences.");
      return;
    }
    onSave({
      id: Date.now().toString(),
      title: title || "Untitled",
      sentences,
      distractors: distractors.split(".").map((s) => s.trim()).filter(Boolean),
      clue: clue || "",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#2d3748" }}>
        Create Activity
      </h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Water Cycle"
          style={{
            width: "100%", padding: "10px 14px", fontSize: 15,
            border: "2px solid #cbd5e0", borderRadius: 8,
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Paragraph (sentences separated by full stops)
        </label>
        <textarea
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
          placeholder="Water evaporates from the ocean. It rises into the atmosphere. Clouds form as water vapour cools."
          rows={5}
          style={{
            width: "100%", padding: "10px 14px", fontSize: 15,
            border: "2px solid #cbd5e0", borderRadius: 8, resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Distractor sentences (optional, separated by full stops)
        </label>
        <textarea
          value={distractors}
          onChange={(e) => setDistractors(e.target.value)}
          placeholder="The sun is very hot. Fish live in the sea."
          rows={3}
          style={{
            width: "100%", padding: "10px 14px", fontSize: 15,
            border: "2px solid #cbd5e0", borderRadius: 8, resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Clue (optional)
        </label>
        <input
          type="text"
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="e.g. Think about what happens first in the water cycle."
          style={{
            width: "100%", padding: "10px 14px", fontSize: 15,
            border: "2px solid #cbd5e0", borderRadius: 8,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 24px", background: saved ? "#38a169" : "#3b82f6", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          {saved ? "Saved!" : "Save to Library"}
        </button>
        <button
          onClick={onExport}
          style={{
            padding: "12px 24px", background: "#718096", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          Export Library
        </button>
        <label
          style={{
            padding: "12px 24px", background: "#718096", color: "#fff",
            borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          Import Library
          <input type="file" accept=".json" onChange={onImport} style={{ display: "none" }} />
        </label>
      </div>

      {library.length > 0 && (
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, color: "#2d3748" }}>
            Library ({library.length} activities)
          </h3>
          {library.map((item) => (
            <div key={item.id} style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "12px 16px", marginBottom: 8,
            }}>
              <strong>{item.title}</strong>
              <span style={{ color: "#718096", marginLeft: 8, fontSize: 13 }}>
                {item.sentences.length} sentences
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Session Summary View
// ============================================================

function SessionSummary({ gameId, resetTimestamp, onReset }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [lastRefresh, setLastRefresh] = React.useState(null);

  function fetchData() {
    if (!TRACKING_CSV_URL || TRACKING_CSV_URL === "PASTE_YOUR_CSV_URL_HERE") {
      setLoading(false);
      return;
    }
    fetch(TRACKING_CSV_URL + "&t=" + Date.now())
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseCSV(text);
        setRows(parsed);
        setLastRefresh(new Date());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [gameId, resetTimestamp]);

  const filtered = rows.filter((r) => {
    if (gameId && r.Game_ID !== gameId) return false;
    if (resetTimestamp && new Date(r.Timestamp) < new Date(resetTimestamp)) return false;
    return true;
  });

  const students = {};
  filtered.forEach((r) => {
    if (!students[r.Name]) students[r.Name] = { attempts: 0, completed: false, firstTry: false, clues: 0, distractors: 0 };
    const s = students[r.Name];
    if (r.Status === "attempt") s.attempts++;
    if (r.Status === "completed") { s.completed = true; if (s.attempts <= 1) s.firstTry = true; }
    if (r.Status === "clue_used") s.clues++;
    if (r.Status === "distractor_used") s.distractors++;
  });

  const names = Object.keys(students);
  const completions = names.filter((n) => students[n].completed).length;
  const firstTryMasters = names.filter((n) => students[n].firstTry).length;
  const totalAttempts = names.reduce((sum, n) => sum + students[n].attempts, 0);
  const successRate = names.length > 0 ? Math.round((firstTryMasters / names.length) * 100) : 0;

  const trafficLight = successRate >= 80 ? "#38a169" : successRate >= 50 ? "#d69e2e" : "#e53e3e";
  const trafficLabel = successRate >= 80 ? "Ready to move on" : successRate >= 50 ? "Some students need support" : "Re-model recommended";

  if (!TRACKING_CSV_URL || TRACKING_CSV_URL === "PASTE_YOUR_CSV_URL_HERE") {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
        <div style={{
          background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8,
          padding: 16, color: "#856404",
        }}>
          <strong>CSV URL not configured.</strong> Paste your Google Sheets Tracking CSV URL into <code>TRACKING_CSV_URL</code> in app.js.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#2d3748" }}>Session Summary</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchData}
            style={{
              padding: "8px 16px", background: "#3b82f6", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <button
            onClick={onReset}
            style={{
              padding: "8px 16px", background: "#e53e3e", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            }}
          >
            Reset Session
          </button>
        </div>
      </div>

      {lastRefresh && (
        <p style={{ color: "#718096", fontSize: 13, marginBottom: 16 }}>
          Last updated: {lastRefresh.toLocaleTimeString()} (auto-refreshes every 15s)
        </p>
      )}

      {loading ? (
        <p style={{ color: "#718096" }}>Loading...</p>
      ) : (
        <>
          <div style={{
            background: trafficLight, borderRadius: 12, padding: "16px 20px",
            marginBottom: 20, color: "#fff",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{successRate}% first-try success</div>
            <div style={{ fontSize: 15, marginTop: 4 }}>{trafficLabel}</div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12, marginBottom: 24,
          }}>
            {[
              { label: "Students", value: names.length },
              { label: "Completions", value: completions },
              { label: "First-try masters", value: firstTryMasters },
              { label: "Total attempts", value: totalAttempts },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#2d3748" }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {names.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#2d3748" }}>Students</h3>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f7fafc" }}>
                      {["Name", "Status", "Attempts", "Clues", "Distractors"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 13, color: "#718096", fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {names.map((name) => {
                      const s = students[name];
                      return (
                        <tr key={name} style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{name}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              background: s.firstTry ? "#c6f6d5" : s.completed ? "#bee3f8" : "#fed7d7",
                              color: s.firstTry ? "#276749" : s.completed ? "#2a69ac" : "#c53030",
                              padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                            }}>
                              {s.firstTry ? "First try!" : s.completed ? "Completed" : "In progress"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>{s.attempts}</td>
                          <td style={{ padding: "10px 12px" }}>{s.clues}</td>
                          <td style={{ padding: "10px 12px" }}>{s.distractors}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {names.length === 0 && (
            <p style={{ color: "#718096", textAlign: "center", padding: 24 }}>
              No student data yet. Students will appear here as they complete the activity.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Student Game View
// ============================================================

function GameView({ config, studentName }) {
  const [items, setItems] = React.useState(() => shuffle([...config.sentences, ...(config.distractors || [])]));
  const [dragIndex, setDragIndex] = React.useState(null);
  const [checked, setChecked] = React.useState(false);
  const [correct, setCorrect] = React.useState(false);
  const [showClue, setShowClue] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const [toast, setToast] = React.useState(null);

  function handleDragStart(i) { setDragIndex(i); }
  function handleDragOver(e, i) { e.preventDefault(); }
  function handleDrop(e, i) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(i, 0, moved);
    setItems(newItems);
    setDragIndex(null);
    setChecked(false);
    setCorrect(false);
  }

  function handleCheck() {
    const playerSentences = items.filter((s) => config.sentences.includes(s));
    const isCorrect = JSON.stringify(playerSentences) === JSON.stringify(config.sentences);
    const newAttempt = attempt + 1;
    setAttempt(newAttempt);
    setChecked(true);
    setCorrect(isCorrect);

    if (isCorrect) {
      sendTrackingData(studentName, config.id, newAttempt, "completed", { sentences: config.sentences.length });
      if (newAttempt === 1) {
        sendTrackingData(studentName, config.id, newAttempt, "first_try_mastered", {});
        setToast("First try! Amazing!");
      } else {
        setToast("Correct! Well done!");
      }
    } else {
      sendTrackingData(studentName, config.id, newAttempt, "attempt", { attempt: newAttempt });
      setToast("Not quite - keep trying!");
    }
  }

  function handleClue() {
    setShowClue(true);
    sendTrackingData(studentName, config.id, attempt, "clue_used", {});
  }

  function handleDistractor(sentence) {
    sendTrackingData(studentName, config.id, attempt, "distractor_used", { sentence });
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#2d3748" }}>
        {config.title}
      </h2>
      <p style={{ color: "#718096", marginBottom: 20 }}>
        Drag the sentences into the correct order to build the paragraph.
      </p>

      {showClue && config.clue && (
        <div style={{
          background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 8,
          padding: "12px 16px", marginBottom: 16, color: "#2c5282",
        }}>
          <strong>Clue:</strong> {config.clue}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        {items.map((sentence, i) => {
          const isDistractor = config.distractors && config.distractors.includes(sentence);
          const isInCorrectPos = checked && correct && !isDistractor;
          const isWrong = checked && !correct;

          return (
            <div
              key={sentence}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onClick={() => { if (isDistractor) handleDistractor(sentence); }}
              aria-label={`Sentence ${i + 1}: ${sentence}`}
              style={{
                background: isDistractor ? "#fff5f5" : "#fff",
                border: `2px solid ${isDistractor ? "#fc8181" : isInCorrectPos ? "#68d391" : "#e2e8f0"}`,
                borderRadius: 8, padding: "12px 16px", marginBottom: 8,
                cursor: "grab", userSelect: "none",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: dragIndex === i ? "0 4px 16px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ color: "#a0aec0", fontSize: 18 }}>&#9776;</span>
              <span style={{ flex: 1 }}>{sentence}</span>
              {isDistractor && (
                <span style={{ fontSize: 11, color: "#fc8181", fontWeight: 600 }}>DISTRACTOR</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={handleCheck}
          style={{
            padding: "12px 24px", background: "#3b82f6", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >
          Check Order
        </button>
        {config.clue && !showClue && (
          <button
            onClick={handleClue}
            style={{
              padding: "12px 24px", background: "#ed8936", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Show Clue
          </button>
        )}
      </div>

      {checked && (
        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 8,
          background: correct ? "#f0fff4" : "#fff5f5",
          border: `1px solid ${correct ? "#68d391" : "#fc8181"}`,
          color: correct ? "#276749" : "#c53030", fontWeight: 600,
        }}>
          {correct ? "Correct! Great work!" : "Not quite right. Try rearranging the sentences."}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// No Config Message
// ============================================================

function NoConfigMessage() {
  return (
    <div style={{
      maxWidth: 500, margin: "80px auto", padding: 32, textAlign: "center",
      background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#2d3748" }}>
        No activity loaded
      </h2>
      <p style={{ color: "#4a5568", lineHeight: 1.6 }}>
        You need a teacher-generated link to use this activity. Ask your teacher to share their link with you.
      </p>
    </div>
  );
}

// ============================================================
// App Root
// ============================================================

function App() {
  const [tab, setTab] = React.useState("student");
  const [pinUnlocked, setPinUnlocked] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [studentName, setStudentName] = React.useState(null);
  const [library, setLibrary] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("ftp_library") || "[]"); } catch { return []; }
  });
  const [toast, setToast] = React.useState(null);
  const [resetTimestamp, setResetTimestamp] = React.useState(() => localStorage.getItem("ftp_reset_ts") || null);

  const params = new URLSearchParams(window.location.search);
  const configParam = params.get("config");
  let gameConfig = null;
  if (configParam) {
    try { gameConfig = JSON.parse(atob(configParam)); } catch {}
  }

  function saveLibrary(newLib) {
    setLibrary(newLib);
    localStorage.setItem("ftp_library", JSON.stringify(newLib));
  }

  function handleSaveActivity(activity) {
    const newLib = [...library, activity];
    saveLibrary(newLib);
    setToast("Activity saved to library!");
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fix-the-paragraph-library.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Library exported!");
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        saveLibrary(data);
        setToast("Library imported successfully!");
      } catch {
        setToast("Import failed - invalid file.");
      }
    };
    reader.readAsText(file);
  }

  function handleTeacherTabClick() {
    if (pinUnlocked) {
      setTab("teacher");
    } else {
      setShowPinModal(true);
    }
  }

  function handlePinConfirm() {
    setPinUnlocked(true);
    setShowPinModal(false);
    setTab("teacher");
  }

  function handleReset() {
    const ts = new Date().toISOString();
    setResetTimestamp(ts);
    localStorage.setItem("ftp_reset_ts", ts);
    setToast("Session reset!");
  }

  const activeGame = gameConfig || (library.length > 0 ? library[library.length - 1] : null);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      {studentName === null && tab === "student" && (
        <NameModal onConfirm={setStudentName} />
      )}
      {showPinModal && (
        <PinModal onConfirm={handlePinConfirm} onCancel={() => setShowPinModal(false)} />
      )}

      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center", gap: 0,
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#2d3748", padding: "16px 0", marginRight: 24 }}>
          Fix the Paragraph
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {["student", "teacher"].map((t) => (
            <button
              key={t}
              onClick={t === "teacher" ? handleTeacherTabClick : () => setTab("student")}
              aria-current={tab === t ? "page" : undefined}
              style={{
                padding: "16px 18px", background: "none", border: "none",
                borderBottom: tab === t ? "3px solid #3b82f6" : "3px solid transparent",
                color: tab === t ? "#3b82f6" : "#718096",
                fontWeight: 600, fontSize: 15, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t === "teacher" ? "Teacher" : "Activity"}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ paddingTop: 16 }}>
        {tab === "student" && studentName && (
          activeGame ? (
            <GameView config={activeGame} studentName={studentName} />
          ) : (
            <NoConfigMessage />
          )
        )}
        {tab === "teacher" && pinUnlocked && (
          <div>
            <div style={{
              display: "flex", borderBottom: "1px solid #e2e8f0",
              background: "#fff", padding: "0 24px",
            }}>
              {["setup", "session"].map((st) => {
                const [subTab, setSubTab] = React.useState("setup");
                return null;
              })}
            </div>
            <TeacherContent
              library={library}
              onSave={handleSaveActivity}
              onExport={handleExport}
              onImport={handleImport}
              resetTimestamp={resetTimestamp}
              onReset={handleReset}
              activeGame={activeGame}
            />
          </div>
        )}
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// Teacher Content (sub-tabs: Setup / Session)
// ============================================================

function TeacherContent({ library, onSave, onExport, onImport, resetTimestamp, onReset, activeGame }) {
  const [subTab, setSubTab] = React.useState("setup");

  return (
    <div>
      <div style={{
        display: "flex", background: "#fff",
        borderBottom: "1px solid #e2e8f0", padding: "0 24px",
      }}>
        {["setup", "session"].map((st) => (
          <button
            key={st}
            onClick={() => setSubTab(st)}
            aria-current={subTab === st ? "page" : undefined}
            style={{
              padding: "12px 18px", background: "none", border: "none",
              borderBottom: subTab === st ? "3px solid #3b82f6" : "3px solid transparent",
              color: subTab === st ? "#3b82f6" : "#718096",
              fontWeight: 600, fontSize: 14, cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {st === "setup" ? "Setup" : "Session Summary"}
          </button>
        ))}
      </div>
      {subTab === "setup" && (
        <TeacherSetup
          library={library}
          onSave={onSave}
          onExport={onExport}
          onImport={onImport}
        />
      )}
      {subTab === "session" && (
        <SessionSummary
          gameId={activeGame ? activeGame.id : null}
          resetTimestamp={resetTimestamp}
          onReset={onReset}
        />
      )}
    </div>
  );
}

// ============================================================
// Mount
// ============================================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
