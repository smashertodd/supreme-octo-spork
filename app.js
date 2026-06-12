// =========================================================================
// Fix the Paragraph - FULL APP CODE (v6 - Sync Fix & Wide Layout)
// =========================================================================

// === 🛑 STEP 1: PASTE YOUR 3 GOOGLE LINKS HERE 🛑 ===
const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TEACHER_PIN = "@pple"; 
// ====================================================

const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

let activities = [];
let currentActivityIndex = 0;
let draggedItem = null;
let currentStudentName = "";
let attemptCount = 1;
let startTime = 0;

// --- INITIALISATION & BULLETPROOF BUTTON HOOKUP ---
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.addEventListener("click", window.startApp);
    }

    const teacherBtn = document.getElementById("teacher-login-btn");
    if (teacherBtn) {
        teacherBtn.addEventListener("click", window.teacherLogin);
    }
});

// Bulletproof Start App Function
window.startApp = function() {
    const nameInputEl = document.getElementById("student-name");
    
    if (!nameInputEl || !nameInputEl.value.trim()) {
        Swal.fire({ icon: 'warning', title: 'Hold up!', text: 'Please enter your name.', background: '#1e1b4b', color: '#fff' });
        return;
    }
    
    currentStudentName = nameInputEl.value.trim();
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("loading-screen").classList.remove("hidden");
    loadActivities();
};

window.teacherLogin = function() {
    Swal.fire({
        title: 'Teacher Login',
        input: 'password',
        inputPlaceholder: 'Enter PIN',
        background: '#1e1b4b',
        color: '#fff',
        confirmButtonColor: '#ec4899'
    }).then(result => {
        if (result.value === TEACHER_PIN) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app').classList.add('hidden');
            document.getElementById('teacher-dashboard').classList.remove('hidden');
            updateTeacherDashboard();
            setInterval(updateTeacherDashboard, 15000);
        } else if (result.value) {
            Swal.fire({icon: 'error', title: 'Oops...', text: 'Incorrect PIN', background: '#1e1b4b', color: '#fff'});
        }
    });
};

function loadActivities() {
    Papa.parse(LIBRARY_CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            activities = parseActivities(results.data);
            if (activities.length === 0) {
                document.getElementById("loading-screen").innerHTML = "<h2 class='text-white text-2xl'>No Active Games Found!</h2>";
                return;
            }
            document.getElementById("loading-screen").classList.add("hidden");
            document.getElementById("app").classList.remove("hidden");
            loadActivity(0);
        },
        error: function() { Swal.fire('Error', 'Could not load the database.', 'error'); }
    });
}

function parseActivities(data) {
    let parsed = [];
    let currentActivity = null;
    let currentTitle = "", currentType = "", currentOverallHint = "", currentStatus = "";

    data.forEach(row => {
        if (row.Title && row.Title.trim() !== "") currentTitle = row.Title.trim();
        if (row.Type && row.Type.trim() !== "") currentType = row.Type.trim();
        if (row.Overall_Hint && row.Overall_Hint.trim() !== "") currentOverallHint = row.Overall_Hint.trim();
        if (row.Status && row.Status.trim() !== "") currentStatus = row.Status.trim();

        if (!currentTitle || currentStatus.toLowerCase() !== 'active') return;

        let rowData = {
            Title: currentTitle, Type: currentType, Overall_Hint: currentOverallHint, Status: currentStatus,
            Text: row.Text ? row.Text.trim() : "",
            Label: row.Label ? row.Label.trim() : "",
            Hint: row.Hint ? row.Hint.trim() : ""
        };

        if (!currentActivity || currentActivity.title !== currentTitle) {
            currentActivity = { title: currentTitle, data: [] };
            parsed.push(currentActivity);
        }
        currentActivity.data.push(rowData);
    });
    return parsed;
}

function loadActivity(index) {
    if (index >= activities.length) {
        Swal.fire({ title: '🎉 All Done!', text: 'You completed all activities.', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899' });
        return;
    }
    currentActivityIndex = index;
    attemptCount = 1;
    startTime = Date.now();
    const activity = activities[index];

    document.getElementById("activity-title").innerText = activity.title;
    const overallHintBtn = document.getElementById("overall-hint-btn");
    if (activity.data[0].Overall_Hint) {
        overallHintBtn.classList.remove('hidden');
        overallHintBtn.onclick = () => Swal.fire({title: '💡 Activity Hint', text: activity.data[0].Overall_Hint, background: '#1e1b4b', color: '#fff'});
    } else {
        overallHintBtn.classList.add('hidden');
    }

    const typeLower = (activity.data[0].Type || "").toLowerCase();
    const hasGaps = activity.data.some(r => r.Text && r.Text.includes('___'));
    const leftPanel = document.getElementById("left-panel");
    const rightPanel = document.getElementById("right-panel");
    leftPanel.innerHTML = ""; rightPanel.innerHTML = "";

    if (typeLower.includes('detect')) renderDetectiveActivity(activity.data, leftPanel, rightPanel);
    else if (hasGaps && typeLower.includes('categor')) renderCategorisationActivity(activity.data, leftPanel, rightPanel);
    else if (hasGaps) renderFlowingGapFillActivity(activity.data, leftPanel, rightPanel);
    else renderParagraphBuilderActivity(activity.data, leftPanel, rightPanel);

    document.getElementById("check-btn").onclick = () => checkAnswers(activity);
}

function renderParagraphBuilderActivity(data, leftPanel, rightPanel) {
    let items = data.filter(r => r.Text).map(r => ({ text: r.Text, expected: r.Text, isDist: r.Status.toLowerCase() === 'distractor' }));
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const box = document.createElement("div");
    box.className = "bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md w-full h-full";
    let activeIndex = 0;
    
    data.forEach(row => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        let rowDiv = document.createElement('div'); rowDiv.className = "flex w-full gap-3";
        let label = document.createElement('div');
        label.className = "w-1/3 flex items-center justify-between p-3 rounded-xl text-gray-900 font-bold shadow-sm";
        label.style.backgroundColor = COLORS[activeIndex % COLORS.length];
        label.innerHTML = `<span>${row.Label || 'Part ' + (activeIndex + 1)}</span>` + (row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')">💡</button>` : '');
        
        let dz = document.createElement('div');
        dz.className = "dropzone flex-1 min-h-[60px] border-2 border-dashed border-white/30 rounded-xl bg-black/20 flex items-center p-2 transition-all";
        dz.dataset.expected = row.Text; dz.dataset.mode = 'block';
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-pink-400'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('border-pink-400'));
        dz.addEventListener('drop', e => handleDrop(e, dz));

        rowDiv.appendChild(label); rowDiv.appendChild(dz); box.appendChild(rowDiv);
        activeIndex++;
    });
    rightPanel.appendChild(box);
}

function renderCategorisationActivity(data, leftPanel, rightPanel) {
    let items = data.filter(r => r.Label).map(r => ({ text: r.Label, expected: r.Label }));
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const box = document.createElement("div"); box.className = "flex flex-col gap-4 w-full h-full";
    
    data.forEach((row, index) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        let block = document.createElement('div');
        block.className = "text-block w-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors duration-500 shadow-lg backdrop-blur-md";
        block.dataset.index = index;
        
        let innerHtml = '';
        row.Text.split('___').forEach((part, i, arr) => {
            innerHtml += `<span class="text-white text-lg">${part}</span>`;
            if (i < arr.length - 1) innerHtml += `<div class="dropzone inline-block min-w-[150px] min-h-[50px] border-2 border-dashed border-white/40 rounded-xl bg-black/20 mx-2 align-middle transition-all" data-expected="${row.Label}" data-parent-index="${index}" data-mode="block"></div>`;
        });

        block.innerHTML = `<div class="flex-1 flex items-center flex-wrap">${innerHtml}</div>` + (row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="text-yellow-300">💡</button>` : '');
        block.querySelectorAll('.dropzone').forEach(dz => {
            dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-pink-400'); });
            dz.addEventListener('dragleave', () => dz.classList.remove('border-pink-400'));
            dz.addEventListener('drop', e => handleDrop(e, dz));
        });
        box.appendChild(block);
    });
    rightPanel.appendChild(box);
}

function renderFlowingGapFillActivity(data, leftPanel, rightPanel) {
    let items = data.filter(r => r.Label).map(r => ({ text: r.Label, expected: r.Label }));
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const wrap = document.createElement('div');
    wrap.className = 'text-white text-xl leading-loose p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-full h-full';
    wrap.style.lineHeight = '2.8'; 

    data.forEach(row => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        const span = document.createElement('span');
        
        if (row.Text.includes('___')) {
            row.Text.split('___').forEach((part, i, arr) => {
                span.innerHTML += `<span>${part}</span>`;
                if (i < arr.length - 1) {
                    const dz = document.createElement('div');
                    dz.className = "dropzone inline-flex items-center justify-center min-w-[120px] h-[40px] border-2 border-dashed border-white/40 rounded-full bg-black/20 mx-2 px-3 align-middle transition-all";
                    dz.dataset.expected = row.Label; dz.dataset.mode = 'flowing';
                    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-pink-400'); });
                    dz.addEventListener('dragleave', () => dz.classList.remove('border-pink-400'));
                    dz.addEventListener('drop', e => handleDrop(e, dz));
                    span.appendChild(dz);
                }
            });
            if(row.Hint) span.innerHTML += `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-2 text-yellow-300">💡</button>`;
            span.innerHTML += ' '; 
        } else {
            span.innerHTML = row.Text + (row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-2 text-yellow-300">💡</button>` : '') + ' ';
        }
        wrap.appendChild(span);
    });
    rightPanel.appendChild(wrap);
}

function renderDetectiveActivity(data, leftPanel, rightPanel) {
    leftPanel.innerHTML = `<div class="bg-white/10 p-6 rounded-2xl border border-white/20 text-center h-full flex flex-col justify-center"><h3 class="text-2xl text-pink-300 font-bold mb-4">🔍 Detective Mode</h3><p class="text-white text-lg">Highlight <strong>${data[0].Label}</strong>.</p></div>`;
    const box = document.createElement('div'); box.className = "bg-white/5 border border-white/10 rounded-2xl p-8 text-xl text-white leading-loose w-full h-full"; box.style.lineHeight = "2.5";

    data.forEach(row => {
        if (!row.Text) return;
        const p = document.createElement('p'); p.className = "mb-4";
        p.innerHTML = row.Text.replace(/\[\[(.*?)\]\]/g, `<span class="detective-word cursor-pointer px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-pink-500/50" data-target="true">$1</span>`).split(' ').map(w => w.includes('detective-word') ? w : `<span class="detective-word cursor-pointer px-1 rounded transition-colors hover:bg-white/10" data-target="false">${w}</span>`).join(' ') + (row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-2 text-yellow-300">💡</button>` : '');
        box.appendChild(p);
    });
    rightPanel.appendChild(box);

    document.querySelectorAll('.detective-word').forEach(w => w.addEventListener('click', function() {
        if (this.dataset.target === "true") { this.classList.add('bg-green-500', 'text-white', 'shadow-[0_0_10px_#22c55e]'); this.dataset.found = "true"; } 
        else { this.classList.add('bg-red-500/50', 'text-white'); setTimeout(() => this.classList.remove('bg-red-500/50', 'text-white'), 1000); }
    }));
}

function createDraggableChip(text, expected, index) {
    let chip = document.createElement("div");
    chip.className = "draggable-chip cursor-grab p-4 mb-3 text-center text-gray-900 font-bold shadow-md transition-all flex items-center justify-center min-h-[50px]";
    chip.style.backgroundColor = COLORS[index % COLORS.length];
    chip.style.borderRadius = "12px"; // NO CIRCLES, lovely rounded rectangles
    chip.innerText = text; chip.draggable = true; chip.dataset.expected = expected; chip.dataset.color = COLORS[index % COLORS.length];
    
    chip.addEventListener("dragstart", (e) => { draggedItem = chip; e.dataTransfer.setData("text/plain", text); setTimeout(() => chip.classList.add("opacity-50"), 0); });
    chip.addEventListener("dragend", () => { draggedItem.classList.remove("opacity-50"); draggedItem = null; });
    return chip;
}

function handleDrop(e, dz) {
    e.preventDefault(); dz.classList.remove('border-pink-400');
    if (draggedItem) {
        if (dz.children.length > 0) {
            let old = dz.children[0]; resetChipAppearance(old); document.getElementById("left-panel").appendChild(old);
        }
        if (dz.dataset.mode === 'flowing') {
            draggedItem.className = 'cursor-grab font-bold flex items-center justify-center m-0 px-4 py-1 min-h-[30px]';
            draggedItem.style.borderRadius = '9999px'; 
        } else {
            draggedItem.className = 'cursor-grab font-bold flex items-center justify-center w-full h-full m-0';
        }
        dz.appendChild(draggedItem); dz.style.border = 'none';
        if (dz.dataset.parentIndex) {
            let b = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
            if (b) { b.style.backgroundColor = draggedItem.dataset.color; b.style.color = "#111827"; b.querySelectorAll('span').forEach(s => s.classList.replace('text-white', 'text-gray-900')); }
        }
    }
}

function resetChipAppearance(chip) {
    chip.className = "draggable-chip cursor-grab p-4 mb-3 text-center text-gray-900 font-bold shadow-md transition-all flex items-center justify-center min-h-[50px]";
    chip.style.backgroundColor = chip.dataset.color; chip.style.borderRadius = "12px"; chip.style.color = "#111827";
}

document.addEventListener("DOMContentLoaded", () => {
    const lp = document.getElementById("left-panel");
    if(lp) {
        lp.addEventListener('dragover', e => e.preventDefault());
        lp.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedItem) {
                resetChipAppearance(draggedItem); lp.appendChild(draggedItem);
                document.querySelectorAll('.dropzone').forEach(dz => {
                    if(dz.children.length === 0) {
                        dz.style.border = ''; 
                        if (dz.dataset.parentIndex) {
                            let b = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                            if (b) { b.style.backgroundColor = ""; b.style.color = ""; b.querySelectorAll('span').forEach(s => s.classList.replace('text-gray-900', 'text-white')); }
                        }
                    }
                });
            }
        });
    }
});

function checkAnswers(activity) {
    let allCorrect = true, detailsArr = [];
    if ((activity.data[0].Type || "").toLowerCase() === 'detective') {
        const tgts = document.querySelectorAll('.detective-word[data-target="true"]');
        let found = 0; tgts.forEach(t => { if (t.dataset.found === "true") found++; });
        allCorrect = found === tgts.length; detailsArr.push(`Found ${found}/${tgts.length}`);
    } else {
        document.querySelectorAll('.dropzone').forEach(dz => {
            if (dz.children.length > 0) {
                const chip = dz.children[0];
                if (chip.dataset.expected === dz.dataset.expected) {
                    chip.style.backgroundColor = "#4ade80"; chip.style.color = "#111827"; detailsArr.push("Correct");
                } else {
                    allCorrect = false; detailsArr.push("Incorrect"); resetChipAppearance(chip); document.getElementById("left-panel").appendChild(chip); dz.style.border = '';
                    if (dz.dataset.parentIndex) {
                        let b = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                        if (b) { b.style.backgroundColor = ""; b.querySelectorAll('span').forEach(s => s.classList.replace('text-gray-900', 'text-white')); }
                    }
                }
            } else { allCorrect = false; detailsArr.push("Empty"); }
        });
    }

    const tTaken = Math.round((Date.now() - startTime) / 1000);
    const dDet = activity.data.some(r => r.Status && r.Status.toLowerCase() === 'distractor') ? (document.getElementById("left-panel").children.length > 0 ? `(Avoided distractors)` : `(Fell for distractors)`) : "";

    if (allCorrect) {
        Swal.fire({ title: 'Nailed it! 🚀', text: `Time: ${Math.floor(tTaken/60)}m ${tTaken%60}s`, icon: 'success', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899' }).then(() => {
            sendTrackingData(currentStudentName, activity.title, attemptCount, "Completed", `Time: ${Math.floor(tTaken/60)}m ${tTaken%60}s. ${dDet}`);
            loadActivity(currentActivityIndex + 1);
        });
    } else {
        Swal.fire({ title: 'Not quite! 🤔', text: 'Incorrect items returned. Try again!', icon: 'error', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899' });
        sendTrackingData(currentStudentName, activity.title, attemptCount, "Attempted", `Attempt ${attemptCount} failed.`); attemptCount++;
    }
}

function sendTrackingData(name, id, att, stat, det) {
    fetch(`${TRACKING_URL}?name=${encodeURIComponent(name)}&game_id=${encodeURIComponent(id)}&attempt=${att}&status=${stat}&details=${encodeURIComponent(det)}`).catch(e=>console.log(e));
}

function updateTeacherDashboard() {
    Papa.parse(TRACKING_CSV_URL, {
        download: true, header: true, complete: function(res) {
            const tb = document.getElementById('tracking-data'); tb.innerHTML = '';
            let data = res.data.filter(r => r.Timestamp && r.Timestamp.trim() !== ""); data.reverse();
            data.forEach(r => {
                let stat = r.Status === 'Completed' ? '<span class="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50">Completed</span>' : 
                          (r.Status === 'Attempted' ? '<span class="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50">Attempting</span>' : `<span class="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-xs font-bold">${r.Status}</span>`);
                tb.innerHTML += `<tr class="border-b border-white/10 hover:bg-white/5 transition-colors"><td class="p-4 text-gray-300">${new Date(r.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td><td class="p-4 font-bold text-white">${r.Name}</td><td class="p-4 text-pink-300">${r.Game_ID}</td><td class="p-4 text-center text-gray-300">${r.Attempt}</td><td class="p-4">${stat}</td><td class="p-4 text-sm text-gray-400">${r.Details}</td></tr>`;
            });
        }
    });
}
