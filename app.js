/* =============================================================
   Fix the Paragraph — app.js
   React 18 + Tailwind (CDN) + Babel Standalone
   All telemetry via InteractivesTelemetry.track()
   WCAG 2.1 Level AA compliant
   ============================================================= */

const { useState, useEffect, useRef, useCallback, useReducer } = React;

// ─── Telemetry helper ────────────────────────────────────────
function track(event, payload = {}) {
  try {
    if (window.InteractivesTelemetry?.track) {
      window.InteractivesTelemetry.track(event, payload);
    }
  } catch (_) {}
}

// ─── Default library ─────────────────────────────────────────
const DEFAULT_LIBRARY = [
  {
    id: "p1",
    title: "Punctuation Practice",
    errorType: "Punctuation",
    difficulty: "Easy",
    original: "the cat sat on the mat it was a sunny day the cat was happy",
    corrected: "The cat sat on the mat. It was a sunny day. The cat was happy.",
    pieces: [
      { id: "s1", text: "The cat sat on the mat." },
      { id: "s2", text: "It was a sunny day." },
      { id: "s3", text: "The cat was happy." },
    ],
    clue: "Look for where sentences begin and end.",
  },
  {
    id: "p2",
    title: "Capital Letters",
    errorType: "Capitalisation",
    difficulty: "Easy",
    original: "my name is jane. i live in auckland. i go to school on monday.",
    corrected: "My name is Jane. I live in Auckland. I go to school on Monday.",
    pieces: [
      { id: "s1", text: "My name is Jane." },
      { id: "s2", text: "I live in Auckland." },
      { id: "s3", text: "I go to school on Monday." },
    ],
    clue: "Proper nouns and sentence starts need capitals.",
  },
  {
    id: "p3",
    title: "Sentence Order",
    errorType: "Structure",
    difficulty: "Medium",
    original: "She opened the door. First she found her keys. Then she went inside.",
    corrected: "First she found her keys. Then she went inside. She opened the door.",
    pieces: [
      { id: "s1", text: "First she found her keys." },
      { id: "s2", text: "Then she went inside." },
      { id: "s3", text: "She opened the door." },
    ],
    clue: "Think about the logical sequence of events.",
  },
];

// ─── Shuffle helper ──────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Toast component ─────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const colours = {
    success: "bg-green-600 text-white",
    error:   "bg-red-600 text-white",
    info:    "bg-indigo-600 text-white",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${colours[type]}`}
    >
      {type === "success" && <span aria-hidden="true">✅</span>}
      {type === "error"   && <span aria-hidden="true">❌</span>}
      {type === "info"    && <span aria-hidden="true">ℹ️</span>}
      {message}
    </div>
  );
}

// ─── Modal component ─────────────────────────────────────────
function Modal({ title, children, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-lg font-bold">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Paragraph Editor (add / edit) ───────────────────────────
function ParagraphEditor({ initial, onSave, onCancel }) {
  const [title,      setTitle]      = useState(initial?.title      ?? "");
  const [errorType,  setErrorType]  = useState(initial?.errorType  ?? "Punctuation");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "Easy");
  const [original,   setOriginal]   = useState(initial?.original   ?? "");
  const [corrected,  setCorrected]  = useState(initial?.corrected  ?? "");
  const [clue,       setClue]       = useState(initial?.clue       ?? "");
  const [err,        setErr]        = useState("");

  function handleSave() {
    if (!title.trim() || !original.trim() || !corrected.trim()) {
      setErr("Title, original text, and corrected text are required.");
      return;
    }
    // Auto-split corrected text into pieces by sentence
    const sentences = corrected.match(/[^.!?]+[.!?]+/g) ?? [corrected];
    const pieces = sentences.map((s, i) => ({ id: `s${i + 1}`, text: s.trim() }));

    onSave({
      id:         initial?.id ?? `custom-${Date.now()}`,
      title:      title.trim(),
      errorType,
      difficulty,
      original:   original.trim(),
      corrected:  corrected.trim(),
      pieces,
      clue:       clue.trim(),
    });
  }

  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="flex flex-col gap-3">
      {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}

      <label className="text-sm font-medium">Title *
        <input className={`mt-1 ${inputCls}`} value={title} onChange={e => setTitle(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">Error Type
          <select className={`mt-1 ${inputCls}`} value={errorType} onChange={e => setErrorType(e.target.value)}>
            {["Punctuation","Capitalisation","Structure","Grammar","Spelling","Mixed"].map(t =>
              <option key={t}>{t}</option>
            )}
          </select>
        </label>
        <label className="text-sm font-medium">Difficulty
          <select className={`mt-1 ${inputCls}`} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            {["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}
          </select>
        </label>
      </div>

      <label className="text-sm font-medium">Original (broken) paragraph *
        <textarea rows={3} className={`mt-1 ${inputCls}`} value={original} onChange={e => setOriginal(e.target.value)} />
      </label>

      <label className="text-sm font-medium">Corrected paragraph *
        <textarea rows={3} className={`mt-1 ${inputCls}`} value={corrected} onChange={e => setCorrected(e.target.value)} />
        <span className="text-xs text-slate-500">Sentences will be auto-split on . ! ? for the drag tiles.</span>
      </label>

      <label className="text-sm font-medium">Clue (optional)
        <input className={`mt-1 ${inputCls}`} value={clue} onChange={e => setClue(e.target.value)} />
      </label>

      <div className="flex gap-2 justify-end mt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Save</button>
      </div>
    </div>
  );
}

// ─── Student Game View ───────────────────────────────────────
function StudentView({ paragraph, onComplete }) {
  const [tiles,      setTiles]      = useState(() => shuffle(paragraph.pieces));
  const [dropped,    setDropped]    = useState([]);
  const [attempts,   setAttempts]   = useState(0);
  const [clueShown,  setClueShown]  = useState(false);
  const [distractors,setDistractors]= useState(false);
  const [checked,    setChecked]    = useState(false);
  const [correct,    setCorrect]    = useState(false);
  const [startTime]                 = useState(Date.now());

  const dragItem  = useRef(null);
  const dragZone  = useRef(null); // "bank" | "answer"

  // Keyboard reorder in answer zone
  function moveInAnswer(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= dropped.length) return;
    const next = [...dropped];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setDropped(next);
  }

  function handleCheck() {
    const attempt = dropped.map(p => p.id).join(",");
    const correct_order = paragraph.pieces.map(p => p.id).join(",");
    const isCorrect = attempt === correct_order;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setChecked(true);
    setCorrect(isCorrect);

    track("paragraph_attempt", {
      paragraphId:   paragraph.id,
      paragraphTitle: paragraph.title,
      attemptNumber: newAttempts,
      correct:       isCorrect,
      clueUsed:      clueShown,
      distractorUsed: distractors,
    });

    if (isCorrect) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      track("paragraph_completed", {
        paragraphId:    paragraph.id,
        paragraphTitle: paragraph.title,
        attempts:       newAttempts,
        duration,
        clueUsed:       clueShown,
        distractorUsed: distractors,
      });
      if (newAttempts === 1) {
        track("first_try_mastered", { paragraphId: paragraph.id, paragraphTitle: paragraph.title });
      }
      if (onComplete) onComplete({ attempts: newAttempts, duration, clueUsed: clueShown });
    }
  }

  function handleReset() {
    setTiles(shuffle(paragraph.pieces));
    setDropped([]);
    setChecked(false);
    setCorrect(false);
  }

  function handleClue() {
    setClueShown(true);
    track("clue_used", { paragraphId: paragraph.id, paragraphTitle: paragraph.title });
  }

  // Drag handlers
  function onDragStart(e, piece, zone) {
    dragItem.current = piece;
    dragZone.current = zone;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDropToAnswer(e) {
    e.preventDefault();
    if (!dragItem.current) return;
    if (dragZone.current === "bank") {
      setTiles(t => t.filter(p => p.id !== dragItem.current.id));
      setDropped(d => [...d, dragItem.current]);
    }
    dragItem.current = null;
  }

  function onDropToBank(e) {
    e.preventDefault();
    if (!dragItem.current) return;
    if (dragZone.current === "answer") {
      setDropped(d => d.filter(p => p.id !== dragItem.current.id));
      setTiles(t => [...t, dragItem.current]);
    }
    dragItem.current = null;
  }

  function onDropReorder(e, targetPiece) {
    e.preventDefault();
    if (!dragItem.current || dragZone.current !== "answer") return;
    const fromIdx = dropped.findIndex(p => p.id === dragItem.current.id);
    const toIdx   = dropped.findIndex(p => p.id === targetPiece.id);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...dropped];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setDropped(next);
    dragItem.current = null;
  }

  const diffColour = { Easy: "bg-green-100 text-green-800", Medium: "bg-yellow-100 text-yellow-800", Hard: "bg-red-100 text-red-800" };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{paragraph.title}</h2>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">{paragraph.errorType}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${diffColour[paragraph.difficulty]}`}>{paragraph.difficulty}</span>
          </div>
        </div>
        <div className="text-sm text-slate-500">Attempts: <strong>{attempts}</strong></div>
      </div>

      {/* Original broken paragraph */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Broken paragraph</p>
        <p className="text-sm text-slate-700">{paragraph.original}</p>
      </div>

      {/* Clue */}
      {paragraph.clue && !clueShown && (
        <button
          onClick={handleClue}
          className="self-start text-sm text-indigo-600 underline hover:text-indigo-800"
        >💡 Show clue</button>
      )}
      {clueShown && paragraph.clue && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-900">
          <strong>Clue:</strong> {paragraph.clue}
        </div>
      )}

      {/* Tile bank */}
      <div>
        <p className="text-sm font-semibold mb-2 text-slate-600">Sentence tiles — drag into order below:</p>
        <div
          className="drop-zone flex flex-wrap gap-2 p-3 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 min-h-[3.5rem]"
          onDragOver={e => e.preventDefault()}
          onDrop={onDropToBank}
          aria-label="Sentence tile bank"
        >
          {tiles.length === 0 && (
            <span className="text-xs text-slate-400 self-center">All tiles placed ✓</span>
          )}
          {tiles.map(piece => (
            <div
              key={piece.id}
              draggable
              tabIndex={0}
              role="button"
              aria-label={`Tile: ${piece.text}. Press Enter to move to answer zone.`}
              className="piece-tile bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md hover:border-indigo-400"
              onDragStart={e => onDragStart(e, piece, "bank")}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTiles(t => t.filter(p => p.id !== piece.id));
                  setDropped(d => [...d, piece]);
                }
              }}
            >
              {piece.text}
            </div>
          ))}
        </div>
      </div>

      {/* Answer zone */}
      <div>
        <p className="text-sm font-semibold mb-2 text-slate-600">Your answer — drag to reorder:</p>
        <div
          className={`drop-zone flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed min-h-[4rem] ${
            checked
              ? correct
                ? "bg-green-50 border-green-400"
                : "bg-red-50 border-red-400"
              : "bg-white border-slate-300"
          }`}
          onDragOver={e => e.preventDefault()}
          onDrop={onDropToAnswer}
          aria-label="Answer zone"
        >
          {dropped.length === 0 && (
            <span className="text-xs text-slate-400 self-center">Drop tiles here</span>
          )}
          {dropped.map((piece, idx) => (
            <div
              key={piece.id}
              draggable
              tabIndex={0}
              role="listitem"
              aria-label={`Position ${idx + 1}: ${piece.text}. Use arrow keys to reorder, Backspace to return to bank.`}
              className="piece-tile bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm flex items-center gap-2 hover:border-indigo-400"
              onDragStart={e => onDragStart(e, piece, "answer")}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
              onDragLeave={e => e.currentTarget.classList.remove("drag-over")}
              onDrop={e => { e.currentTarget.classList.remove("drag-over"); onDropReorder(e, piece); }}
              onKeyDown={e => {
                if (e.key === "ArrowUp")    { e.preventDefault(); moveInAnswer(idx, idx - 1); }
                if (e.key === "ArrowDown")  { e.preventDefault(); moveInAnswer(idx, idx + 1); }
                if (e.key === "Backspace")  {
                  e.preventDefault();
                  setDropped(d => d.filter(p => p.id !== piece.id));
                  setTiles(t => [...t, piece]);
                }
              }}
            >
              <span className="text-slate-400 text-xs select-none">⠿</span>
              {piece.text}
            </div>
          ))}
        </div>

        {checked && (
          <p
            role="alert"
            className={`mt-2 text-sm font-semibold ${correct ? "text-green-700" : "text-red-700"}`}
          >
            {correct
              ? "✅ Correct! Well done."
              : "❌ Not quite — try reordering the tiles."}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCheck}
          disabled={dropped.length !== paragraph.pieces.length}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check answer
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Teacher Library Panel ────────────────────────────────────
function TeacherView({ library, setLibrary, setToast }) {

  const [editTarget, setEditTarget] = useState(null); // null | "new" | paragraph obj
  const fileRef = useRef(null);

  function handleSave(paragraph) {
    setLibrary(lib => {
      const exists = lib.find(p => p.id === paragraph.id);
      return exists
        ? lib.map(p => p.id === paragraph.id ? paragraph : p)
        : [...lib, paragraph];
    });
    setEditTarget(null);
    setToast({ message: "Paragraph saved!", type: "success" });
    track("paragraph_saved", { paragraphId: paragraph.id, paragraphTitle: paragraph.title });
  }

  function handleDelete(id) {
    if (!confirm("Delete this paragraph from the library?")) return;
    setLibrary(lib => lib.filter(p => p.id !== id));
    setToast({ message: "Paragraph deleted.", type: "info" });
    track("paragraph_deleted", { paragraphId: id });
  }

  function handleExport() {
    const json = JSON.stringify(library, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "fix-the-paragraph-library.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Library exported!", type: "success" });
    track("library_exported", { count: library.length });
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("Expected an array");
        data.forEach(p => {
          if (!p.id || !p.title || !p.pieces) throw new Error("Invalid paragraph structure");
        });
        const merge = [...library];
        data.forEach(p => {
          if (!merge.find(x => x.id === p.id)) merge.push(p);
        });
        setLibrary(merge);
        setToast({ message: `Imported ${data.length} paragraph(s).`, type: "success" });
        track("library_imported", { count: data.length });
      } catch (err) {
        setToast({ message: `Import failed: ${err.message}`, type: "error" });
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  const diffColour = { Easy: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", Hard: "bg-red-100 text-red-700" };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h2 className="text-lg font-bold">Paragraph Library</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setEditTarget("new")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >+ Add paragraph</button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100"
          >⬇ Export</button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100"
          >⬆ Import</button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} aria-label="Import library JSON file" />
        </div>
      </div>

      {/* Library cards */}
      {library.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">No paragraphs yet. Add one to get started!</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {library.map(p => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-sm">{p.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${diffColour[p.difficulty] ?? "bg-slate-100 text-slate-700"}`}>{p.difficulty}</span>
            </div>
            <p className="text-xs text-slate-500">{p.errorType} · {p.pieces?.length ?? 0} sentences</p>
            <p className="text-xs text-slate-400 line-clamp-2">{p.original}</p>
            <div className="flex gap-2 mt-auto pt-2">
              <button
                onClick={() => setEditTarget(p)}
                className="text-xs px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
              >Edit</button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add modal */}
      {editTarget && (
        <Modal
          title={editTarget === "new" ? "Add paragraph" : "Edit paragraph"}
          onClose={() => setEditTarget(null)}
        >
          <ParagraphEditor
            initial={editTarget === "new" ? null : editTarget}
            onSave={handleSave}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
function App() {
  const [tab,      setTab]     = useState("student");   // "student" | "teacher"
  const [library,  setLibrary] = useState(DEFAULT_LIBRARY);
  const [active,   setActive]  = useState(0);           // index into library
  const [toast,    setToast]   = useState(null);
  const [theme,    setTheme]   = useState("light");
  const [score,    setScore]   = useState({ completed: 0, firstTry: 0 });

  // Persist library to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ftp-library");
      if (saved) setLibrary(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("ftp-library", JSON.stringify(library)); } catch (_) {}
  }, [library]);

  // Theme
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  function handleComplete({ attempts, duration, clueUsed }) {
    setScore(s => ({
      completed: s.completed + 1,
      firstTry:  s.firstTry + (attempts === 1 ? 1 : 0),
    }));
    setToast({ message: attempts === 1 ? "🌟 First try! Amazing!" : "✅ Paragraph fixed!", type: "success" });
  }

  const currentParagraph = library[active] ?? library[0];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* App header */}
      <header className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight">Fix the Paragraph</h1>
          <p className="text-sm text-slate-500">Drag sentences into the correct order</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Progress stats */}
          {tab === "student" && (
            <div className="flex gap-3 text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <span>✅ <strong>{score.completed}</strong> done</span>
              <span>🌟 <strong>{score.firstTry}</strong> first try</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-lg"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Tab switcher */}
          <div role="tablist" aria-label="View" className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-100 text-sm font-medium">
            {["student", "teacher"].map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`tab-btn px-4 py-2 capitalize ${tab === t ? "active" : "hover:bg-slate-200"}`}
              >
                {t === "student" ? "🎓 Student" : "👩‍🏫 Teacher"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto">
        {tab === "student" && (
          <div className="flex flex-col gap-4">
            {/* Paragraph selector */}
            {library.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select paragraph">
                {library.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(i)}
                    aria-pressed={active === i}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      active === i
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Game card */}
            {currentParagraph && (
              <div key={`${currentParagraph.id}-${active}`} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
                <StudentView paragraph={currentParagraph} onComplete={handleComplete} />
              </div>
            )}
          </div>
        )}

        {tab === "teacher" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
            <TeacherView library={library} setLibrary={setLibrary} setToast={setToast} />
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── Mount ───────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
