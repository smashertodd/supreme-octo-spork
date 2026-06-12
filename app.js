// =========================================================================
// Fix the Paragraph - FULL APP CODE (v5 - Clean Interface & Flowing Text)
// =========================================================================

// === 🛑 STEP 1: PASTE YOUR 3 GOOGLE LINKS HERE 🛑 ===
const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TEACHER_PIN = "@pple"; 
// ====================================================

// --- 🎨 COLOURS ---
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

// Global State
let activities = [];
let currentActivityIndex = 0;
let draggedItem = null;
let currentStudentName = "";
let attemptCount = 1;
let startTime = 0;

// --- INITIALISATION & BUTTON HOOKUP ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Hook up the Start button
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.addEventListener("click", startApp);
    }

    // 2. Hook up your beautiful top-right Teacher Login button
    // It looks for the ID, but if that fails, it finds any button with "Teacher" in the text
    const teacherBtn = document.getElementById("teacher-login-btn");
    if (teacherBtn) {
        teacherBtn.addEventListener("click", window.teacherLogin);
    } else {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.innerText.includes('Teacher')) {
                btn.addEventListener('click', window.teacherLogin);
            }
        });
    }
});

// Teacher Login Function
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

function startApp() {
    const nameInputEl = document.getElementById("student-name");
    if (!nameInputEl) return;
    
    const nameInput = nameInputEl.value.trim();
    if (!nameInput) {
        Swal.fire({ icon: 'warning', title: 'Hold up!', text: 'Please enter your name.', background: '#1e1b4b', color: '#fff' });
        return;
    }
    currentStudentName = nameInput;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("loading-screen").classList.remove("hidden");
    loadActivities();
}

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
        error: function() {
            Swal.fire('Error', 'Could not load the database.', 'error');
        }
    });
}

function parseActivities(data) {
    let parsed = [];
    let currentActivity = null;

    let currentTitle = "";
    let currentType = "";
    let currentOverallHint = "";
    let currentStatus = "";

    data.forEach(row => {
        if (row.Title && row.Title.trim() !== "") currentTitle = row.Title.trim();
        if (row.Type && row.Type.trim() !== "") currentType = row.Type.trim();
        if (row.Overall_Hint && row.Overall_Hint.trim() !== "") currentOverallHint = row.Overall_Hint.trim();
        if (row.Status && row.Status.trim() !== "") currentStatus = row.Status.trim();

        if (!currentTitle || currentStatus.toLowerCase() !== 'active') return;

        let rowData = {
            Title: currentTitle,
            Type: currentType,
            Text: row.Text ? row.Text.trim() : "",
            Label: row.Label ? row.Label.trim() : "",
            Hint: row.Hint ? row.Hint.trim() : "",
            Overall_Hint: currentOverallHint,
            Status: row.Status ? row.Status.trim() : ""
        };

        if (!currentActivity || currentActivity.title !== currentTitle) {
            currentActivity = { title: currentTitle, data: [] };
            parsed.push(currentActivity);
        }
        currentActivity.data.push(rowData);
    });
    return parsed;
}

// --- ACTIVITY RENDERER (THE 4 BRAINS) ---
function loadActivity(index) {
    if (index >= activities.length) {
        Swal.fire({ title: '🎉 All Done!', text: 'You have completed all activities.', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899' });
        return;
    }

    currentActivityIndex = index;
    attemptCount = 1;
    startTime = Date.now();
    const activity = activities[index];

    // Set Title & Overall Hint
    document.getElementById("activity-title").innerText = activity.title;
    const overallHintBtn = document.getElementById("overall-hint-btn");
    const overallHintText = activity.data[0].Overall_Hint;
    if (overallHintText) {
        overallHintBtn.classList.remove('hidden');
        overallHintBtn.onclick = () => Swal.fire({title: '💡 Activity Hint', text: overallHintText, background: '#1e1b4b', color: '#fff'});
    } else {
        overallHintBtn.classList.add('hidden');
    }

    // Determine Mode
    const typeLower = (activity.data[0].Type || "").toLowerCase();
    const hasGaps = activity.data.some(r => r.Text && r.Text.includes('___'));
    const isCategorisation = typeLower.includes('categor');
    const isDetective = typeLower.includes('detect');

    const leftPanel = document.getElementById("left-panel");
    const rightPanel = document.getElementById("right-panel");
    leftPanel.innerHTML = "";
    rightPanel.innerHTML = "";

    if (isDetective) {
        renderDetectiveActivity(activity.data, leftPanel, rightPanel);
    } else if (hasGaps && isCategorisation) {
        renderCategorisationActivity(activity.data, leftPanel, rightPanel);
    } else if (hasGaps && !isCategorisation) {
        renderFlowingGapFillActivity(activity.data, leftPanel, rightPanel);
    } else {
        renderParagraphBuilderActivity(activity.data, leftPanel, rightPanel);
    }

    document.getElementById("check-btn").onclick = () => checkAnswers(activity);
}

// 🧠 BRAIN 1: Paragraph Builder
function renderParagraphBuilderActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => {
        if (row.Text) items.push({ text: row.Text, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Text });
    });
    items = items.sort(() => Math.random() - 0.5);

    items.forEach((item, i) => {
        let chip = createDraggableChip(item.text, item.expected, i);
        leftPanel.appendChild(chip);
    });

    const structureBox = document.createElement("div");
    structureBox.className = "bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md w-full h-full";
    let activeIndex = 0;
    data.forEach((row) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        
        let rowDiv = document.createElement('div');
        rowDiv.className = "flex w-full gap-3";

        let labelBox = document.createElement('div');
        labelBox.className = "w-1/3 flex items-center justify-between p-3 rounded-xl text-gray-900 font-bold shadow-sm";
        labelBox.style.backgroundColor = COLORS[activeIndex % COLORS.length];
        labelBox.innerHTML = `<span>${row.Label || 'Part ' + (activeIndex + 1)}</span>`;
        if (row.Hint) {
            labelBox.innerHTML += `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="text-gray-900 hover:text-white transition-colors">💡</button>`;
        }

        let dropzone = document.createElement('div');
        dropzone.className = "dropzone flex-1 min-h-[60px] border-2 border-dashed border-white/30 rounded-xl bg-black/20 flex items-center p-2 transition-all";
        dropzone.dataset.expected = row.Text;
        dropzone.dataset.mode = 'block';
        dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('border-pink-400', 'bg-pink-500/10'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-pink-400', 'bg-pink-500/10'));
        dropzone.addEventListener('drop', e => handleDrop(e, dropzone));

        rowDiv.appendChild(labelBox);
        rowDiv.appendChild(dropzone);
        structureBox.appendChild(rowDiv);
        activeIndex++;
    });
    rightPanel.appendChild(structureBox);
}

// 🧠 BRAIN 2: Categorisation (Blocky Colour Bleed)
function renderCategorisationActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => {
        if (row.Label) items.push({ text: row.Label, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Label });
    });
    items = items.sort(() => Math.random() - 0.5);

    items.forEach((item, i) => {
        let chip = createDraggableChip(item.text, item.expected, i);
        leftPanel.appendChild(chip);
    });

    const structureBox = document.createElement("div");
    structureBox.className = "flex flex-col gap-4 w-full h-full";
    
    data.forEach((row, index) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        
        let block = document.createElement('div');
        block.className = "text-block w-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors duration-500 shadow-lg backdrop-blur-md";
        block.dataset.index = index;

        let hintHtml = row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-auto text-yellow-300 hover:scale-110 transition-transform">💡</button>` : '';
        
        let innerHtml = '';
        const parts = row.Text.split('___');
        parts.forEach((part, i) => {
            innerHtml += `<span class="text-white text-lg">${part}</span>`;
            if (i < parts.length - 1) {
                innerHtml += `<div class="dropzone inline-block min-w-[150px] min-h-[50px] border-2 border-dashed border-white/40 rounded-xl bg-black/20 mx-2 align-middle transition-all" data-expected="${row.Label}" data-parent-index="${index}" data-mode="block"></div>`;
            }
        });

        block.innerHTML = `<div class="flex-1 flex items-center flex-wrap">${innerHtml}</div>${hintHtml}`;
        
        block.querySelectorAll('.dropzone').forEach(dz => {
            dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-pink-400'); });
            dz.addEventListener('dragleave', () => dz.classList.remove('border-pink-400'));
            dz.addEventListener('drop', e => handleDrop(e, dz));
        });
        
        structureBox.appendChild(block);
    });
    rightPanel.appendChild(structureBox);
}

// 🧠 BRAIN 3: Flowing Gap-Fill (Inline Paragraph)
function renderFlowingGapFillActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => {
        if (row.Label) items.push({ text: row.Label, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Label });
    });
    items = items.sort(() => Math.random() - 0.5);

    items.forEach((item, i) => {
        let chip = createDraggableChip(item.text, item.expected, i);
        leftPanel.appendChild(chip);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'text-white text-xl leading-loose p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-full h-full';
    wrapper.style.lineHeight = '2.8'; 

    data.forEach((row) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        
        let hintHtml = row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-2 inline-block text-yellow-300 hover:scale-110 transition-transform">💡</button>` : '';

        const span = document.createElement('span');
        if (row.Text.includes('___')) {
            const parts = row.Text.split('___');
            parts.forEach((part, i) => {
                const textNode = document.createElement('span');
                textNode.innerHTML = part;
                span.appendChild(textNode);

                if (i < parts.length - 1) {
                    const dropzone = document.createElement('div');
                    dropzone.className = "dropzone inline-flex items-center justify-center min-w-[120px] h-[40px] border-2 border-dashed border-white/40 rounded-full bg-black/20 mx-2 px-3 align-middle transition-all";
                    dropzone.dataset.expected = row.Label;
                    dropzone.dataset.mode = 'flowing';
                    
                    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('border-pink-400'); });
                    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-pink-400'));
                    dropzone.addEventListener('drop', e => handleDrop(e, dropzone));
                    
                    span.appendChild(dropzone);
                }
            });
            if(hintHtml) {
                const hSpan = document.createElement('span');
                hSpan.innerHTML = hintHtml;
                span.appendChild(hSpan);
            }
            span.innerHTML += ' '; 
        } else {
            span.innerHTML = row.Text + hintHtml + ' ';
        }
        wrapper.appendChild(span);
    });
    rightPanel.appendChild(wrapper);
}

// 🧠 BRAIN 4: Detective Mode
function renderDetectiveActivity(data, leftPanel, rightPanel) {
    leftPanel.innerHTML = `
        <div class="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shadow-xl h-full flex flex-col justify-center">
            <h3 class="text-2xl text-pink-300 font-bold mb-4 flex items-center justify-center gap-2">🔍 Detective Mode</h3>
            <p class="text-white text-lg">Click the words in the text to highlight <strong>${data[0].Label}</strong>.</p>
        </div>
    `;

    const textBox = document.createElement('div');
    textBox.className = "bg-white/5 border border-white/10 rounded-2xl p-8 text-xl text-white leading-loose backdrop-blur-md shadow-xl w-full h-full";
    textBox.style.lineHeight = "2.5";

    data.forEach((row) => {
        if (!row.Text) return;
        const p = document.createElement('p');
        p.className = "mb-4";
        let processedText = row.Text.replace(/\[\[(.*?)\]\]/g, `<span class="detective-word cursor-pointer px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-pink-500/50" data-target="true">$1</span>`);
        
        processedText = processedText.split(' ').map(word => {
            if (word.includes('detective-word')) return word;
            return `<span class="detective-word cursor-pointer px-1 rounded transition-colors hover:bg-white/10" data-target="false">${word}</span>`;
        }).join(' ');

        p.innerHTML = processedText;
        if(row.Hint) {
            p.innerHTML += `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" class="ml-2 text-yellow-300 hover:scale-110 transition-transform">💡</button>`;
        }
        textBox.appendChild(p);
    });

    rightPanel.appendChild(textBox);

    document.querySelectorAll('.detective-word').forEach(word => {
        word.addEventListener('click', function() {
            if (this.dataset.target === "true") {
                this.classList.remove('hover:border-pink-500/50');
                this.classList.add('bg-green-500', 'text-white', 'shadow-[0_0_10px_#22c55e]');
                this.dataset.found = "true";
            } else {
                this.classList.add('bg-red-500/50', 'text-white');
                setTimeout(() => this.classList.remove('bg-red-500/50', 'text-white'), 1000);
            }
        });
    });
}

// --- DRAG AND DROP UTILS ---
function createDraggableChip(text, expected, index) {
    let chip = document.createElement("div");
    chip.className = "draggable-chip cursor-grab p-4 mb-3 text-center text-gray-900 font-bold shadow-md transition-all flex items-center justify-center min-h-[50px]";
    chip.style.backgroundColor = COLORS[index % COLORS.length];
    chip.style.borderRadius = "12px"; // Soft corners
    
    chip.innerText = text;
    chip.draggable = true;
    chip.dataset.expected = expected;
    chip.dataset.color = COLORS[index % COLORS.length];
    
    chip.addEventListener("dragstart", (e) => {
        draggedItem = chip;
        e.dataTransfer.setData("text/plain", text);
        setTimeout(() => chip.classList.add("opacity-50"), 0);
    });
    chip.addEventListener("dragend", () => {
        draggedItem.classList.remove("opacity-50");
        draggedItem = null;
    });
    return chip;
}

function handleDrop(e, dropzone) {
    e.preventDefault();
    dropzone.classList.remove('border-pink-400', 'bg-pink-500/10');
    if (draggedItem) {
        if (dropzone.children.length > 0) {
            let existingChip = dropzone.children[0];
            resetChipAppearance(existingChip);
            document.getElementById("left-panel").appendChild(existingChip);
        }

        if (dropzone.dataset.mode === 'flowing') {
            draggedItem.classList.remove('mb-3', 'shadow-md');
            draggedItem.classList.add('m-0', 'px-4', 'py-1', 'min-h-[30px]');
            draggedItem.style.borderRadius = '9999px'; // Pill shape when dropped in text
        } else {
            draggedItem.classList.remove('mb-3', 'shadow-md');
            draggedItem.classList.add('w-full', 'h-full', 'm-0');
        }

        dropzone.appendChild(draggedItem);
        dropzone.style.border = 'none';

        if (dropzone.dataset.parentIndex) {
            let block = document.querySelector(`.text-block[data-index="${dropzone.dataset.parentIndex}"]`);
            if (block) {
                block.style.backgroundColor = draggedItem.dataset.color;
                block.style.color = "#111827"; 
                block.querySelectorAll('span').forEach(s => s.classList.replace('text-white', 'text-gray-900'));
            }
        }
    }
}

function resetChipAppearance(chip) {
    chip.classList.remove('w-full', 'h-full', 'm-0', 'px-4', 'py-1', 'min-h-[30px]', 'bg-green-400');
    chip.classList.add('mb-3', 'shadow-md', 'min-h-[50px]');
    chip.style.backgroundColor = chip.dataset.color;
    chip.style.borderRadius = "12px"; 
    chip.style.color = "#111827";
}

document.addEventListener("DOMContentLoaded", () => {
    const leftPanel = document.getElementById("left-panel");
    if(leftPanel) {
        leftPanel.addEventListener('dragover', e => e.preventDefault());
        leftPanel.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedItem) {
                resetChipAppearance(draggedItem);
                leftPanel.appendChild(draggedItem);
                
                document.querySelectorAll('.dropzone').forEach(dz => {
                    if(dz.children.length === 0) {
                        dz.style.border = ''; 
                        if (dz.dataset.parentIndex) {
                            let block = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                            if (block) {
                                block.style.backgroundColor = "";
                                block.style.color = "";
                                block.querySelectorAll('span').forEach(s => s.classList.replace('text-gray-900', 'text-white'));
                            }
                        }
                    }
                });
            }
        });
    }
});

// --- CHECKING ANSWERS ---
function checkAnswers(activity) {
    const isDetective = activity.data[0].Type && activity.data[0].Type.toLowerCase() === 'detective';
    let allCorrect = true;
    let detailsArr = [];

    if (isDetective) {
        const targets = document.querySelectorAll('.detective-word[data-target="true"]');
        let foundCount = 0;
        targets.forEach(t => {
            if (t.dataset.found === "true") foundCount++;
        });
        allCorrect = foundCount === targets.length;
        detailsArr.push(`Found ${foundCount}/${targets.length}`);
    } else {
        const dropzones = document.querySelectorAll('.dropzone');
        dropzones.forEach(dz => {
            const expected = dz.dataset.expected;
            if (dz.children.length > 0) {
                const chip = dz.children[0];
                const actual = chip.dataset.expected;
                if (actual === expected) {
                    chip.style.backgroundColor = "#4ade80"; 
                    chip.style.color = "#111827";
                    detailsArr.push("Correct");
                } else {
                    allCorrect = false;
                    detailsArr.push("Incorrect");
                    resetChipAppearance(chip);
                    document.getElementById("left-panel").appendChild(chip);
                    dz.style.border = '';
                    if (dz.dataset.parentIndex) {
                        let block = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                        if (block) { block.style.backgroundColor = ""; block.querySelectorAll('span').forEach(s => s.classList.replace('text-gray-900', 'text-white')); }
                    }
                }
            } else {
                allCorrect = false;
                detailsArr.push("Empty");
            }
        });
    }

    const hasDistractors = activity.data.some(r => r.Status && r.Status.toLowerCase() === 'distractor');
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const timeStr = `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`;
    
    let distractorDetails = "";
    if (hasDistractors) {
        let leftPanelChips = document.getElementById("left-panel").children.length;
        distractorDetails = leftPanelChips > 0 ? `(Avoided ${leftPanelChips} distractor/s)` : `(Fell for distractors)`;
    }

    if (allCorrect) {
        Swal.fire({
            title: 'Nailed it! 🚀',
            text: `Perfect! Time: ${timeStr}`,
            icon: 'success',
            background: '#1e1b4b',
            color: '#fff',
            confirmButtonColor: '#ec4899'
        }).then(() => {
            sendTrackingData(currentStudentName, activity.title, attemptCount, "Completed", `Completed in ${timeStr}. ${distractorDetails}`);
            loadActivity(currentActivityIndex + 1);
        });
    } else {
        Swal.fire({
            title: 'Not quite! 🤔',
            text: 'Incorrect items have been returned to the left. Try again!',
            icon: 'error',
            background: '#1e1b4b',
            color: '#fff',
            confirmButtonColor: '#ec4899'
        });
        sendTrackingData(currentStudentName, activity.title, attemptCount, "Attempted", `Attempt ${attemptCount} failed.`);
        attemptCount++;
    }
}

// --- TRACKING ---
function sendTrackingData(name, gameId, attempt, status, details) {
    const url = `${TRACKING_URL}?name=${encodeURIComponent(name)}&game_id=${encodeURIComponent(gameId)}&attempt=${attempt}&status=${status}&details=${encodeURIComponent(details)}`;
    fetch(url).catch(e => console.error("Tracking Error:", e));
}

// --- TEACHER DASHBOARD ---
function updateTeacherDashboard() {
    Papa.parse(TRACKING_CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            const tbody = document.getElementById('tracking-data');
            tbody.innerHTML = '';
            
            let data = results.data.filter(row => row.Timestamp && row.Timestamp.trim() !== "");
            data.reverse();

            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/10 hover:bg-white/5 transition-colors";
                
                let statusBadge = '';
                if (row.Status === 'Completed') statusBadge = '<span class="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50">Completed</span>';
                else if (row.Status === 'Attempted') statusBadge = '<span class="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50">Attempting</span>';
                else statusBadge = `<span class="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/50">${row.Status || 'Unknown'}</span>`;

                tr.innerHTML = `
                    <td class="p-4 text-gray-300">${new Date(row.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td class="p-4 font-bold text-white">${row.Name}</td>
                    <td class="p-4 text-pink-300">${row.Game_ID}</td>
                    <td class="p-4 text-center text-gray-300">${row.Attempt}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-sm text-gray-400">${row.Details}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
}
