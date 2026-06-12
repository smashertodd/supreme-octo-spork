// =========================================================================
// Fix the Paragraph - FULL APP CODE (v5 - Clean Interface & Flowing Text)
// =========================================================================

const LIBRARY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv";
const TRACKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv";
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec";
const TEACHER_PIN = "@pple";

const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

let activities = [];
let currentActivityIndex = 0;
let draggedItem = null;
let currentStudentName = "";
let attemptCount = 1;
let startTime = 0;

document.addEventListener("DOMContentLoaded", () => {
    // START APP
    document.getElementById("btn-start").addEventListener("click", startApp);

    // TEACHER PIN MODAL LOGIC
    const teacherTab = document.getElementById("tab-teacher");
    const studentTab = document.getElementById("tab-student");
    const pinModal = document.getElementById("pin-modal");
    const pinInput = document.getElementById("pin-input");
    const pinError = document.getElementById("pin-error");

    teacherTab.addEventListener("click", () => {
        pinModal.classList.remove('hidden');
        pinInput.value = '';
        pinError.innerText = '';
        pinInput.focus();
    });

    document.getElementById("btn-pin-cancel").addEventListener("click", () => {
        pinModal.classList.add('hidden');
    });

    document.getElementById("btn-pin-submit").addEventListener("click", () => {
        if (pinInput.value === TEACHER_PIN) {
            pinModal.classList.add('hidden');
            document.getElementById('panel-student').style.display = 'none';
            document.getElementById('panel-teacher').style.display = 'block';
            teacherTab.classList.remove('active');
            studentTab.classList.add('active');
            updateTeacherDashboard();
            setInterval(updateTeacherDashboard, 15000);
        } else {
            pinError.innerText = "Incorrect PIN";
        }
    });

    studentTab.addEventListener("click", () => {
        document.getElementById('panel-teacher').style.display = 'none';
        document.getElementById('panel-student').style.display = 'block';
        studentTab.classList.remove('active');
        teacherTab.classList.add('active');
    });

    document.getElementById("btn-reset-session").addEventListener("click", updateTeacherDashboard);
});

function startApp() {
    const nameInput = document.getElementById("input-name").value.trim();
    if (!nameInput) {
        Swal.fire({ icon: 'warning', title: 'Hold up!', text: 'Please enter your name.', background: '#1e1b4b', color: '#fff' });
        return;
    }
    currentStudentName = nameInput;
    document.getElementById("screen-name").style.display = "none";
    document.getElementById("screen-loading").style.display = "block";
    loadActivities();
}

function loadActivities() {
    Papa.parse(LIBRARY_CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            activities = parseActivities(results.data);
            if (activities.length === 0) {
                document.getElementById("screen-loading").innerHTML = "<h2 class='text-white text-2xl'>No Active Games Found!</h2>";
                return;
            }
            document.getElementById("screen-loading").style.display = "none";
            document.getElementById("screen-activity").style.display = "block";
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
            Title: currentTitle, Type: currentType, Text: row.Text ? row.Text.trim() : "",
            Label: row.Label ? row.Label.trim() : "", Hint: row.Hint ? row.Hint.trim() : "",
            Overall_Hint: currentOverallHint, Status: row.Status ? row.Status.trim() : ""
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
        Swal.fire({ title: '🎉 All Done!', text: 'You have completed all activities.', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899' });
        return;
    }
    currentActivityIndex = index; attemptCount = 1; startTime = Date.now();
    const activity = activities[index];
    
    document.getElementById("activity-title").innerText = activity.title;
    
    const overallHintBtn = document.getElementById("overall-hint-btn");
    if (activity.data[0].Overall_Hint) {
        overallHintBtn.style.display = "inline-block";
        overallHintBtn.onclick = () => Swal.fire({title: '💡 Activity Hint', text: activity.data[0].Overall_Hint, background: '#1e1b4b', color: '#fff'});
    } else {
        overallHintBtn.style.display = "none";
    }

    const typeLower = (activity.data[0].Type || "").toLowerCase();
    const hasGaps = activity.data.some(r => r.Text && r.Text.includes('___'));
    const isCategorisation = typeLower.includes('categor');
    const isDetective = typeLower.includes('detect');
    
    const leftPanel = document.getElementById("choice-pool");
    const rightPanel = document.getElementById("drop-zone");
    leftPanel.innerHTML = ""; rightPanel.innerHTML = "";

    if (isDetective) renderDetectiveActivity(activity.data, leftPanel, rightPanel);
    else if (hasGaps && isCategorisation) renderCategorisationActivity(activity.data, leftPanel, rightPanel);
    else if (hasGaps && !isCategorisation) renderFlowingGapFillActivity(activity.data, leftPanel, rightPanel);
    else renderParagraphBuilderActivity(activity.data, leftPanel, rightPanel);

    document.getElementById("btn-check").onclick = () => checkAnswers(activity);
}

// 🧠 BRAIN 1: Paragraph Builder
function renderParagraphBuilderActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => { if (row.Text) items.push({ text: row.Text, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Text }); });
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const structureBox = document.createElement("div");
    structureBox.style.display = "flex"; structureBox.style.flexDirection = "column"; structureBox.style.gap = "15px";
    let activeIndex = 0;

    data.forEach((row) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        let rowDiv = document.createElement('div');
        rowDiv.style.display = "flex"; rowDiv.style.gap = "15px"; rowDiv.style.width = "100%";
        
        let labelBox = document.createElement('div');
        labelBox.style.width = "33%"; labelBox.style.display = "flex"; labelBox.style.alignItems = "center"; labelBox.style.justifyContent = "space-between";
        labelBox.style.padding = "15px"; labelBox.style.borderRadius = "12px"; labelBox.style.color = "#111"; labelBox.style.fontWeight = "bold";
        labelBox.style.backgroundColor = COLORS[activeIndex % COLORS.length];
        labelBox.innerHTML = `<span>${row.Label || 'Part ' + (activeIndex + 1)}</span>`;
        if (row.Hint) labelBox.innerHTML += `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" style="background:none; border:none; cursor:pointer;">💡</button>`;
        
        let dropzone = document.createElement('div');
        dropzone.className = "dropzone gap-box";
        dropzone.style.flex = "1"; dropzone.style.minHeight = "60px"; dropzone.style.border = "2px dashed rgba(255,255,255,0.3)"; dropzone.style.borderRadius = "12px"; dropzone.style.padding = "10px";
        dropzone.dataset.expected = row.Text; dropzone.dataset.mode = 'block';
        
        dropzone.addEventListener('dragover', e => e.preventDefault());
        dropzone.addEventListener('drop', e => handleDrop(e, dropzone));
        
        rowDiv.appendChild(labelBox); rowDiv.appendChild(dropzone); structureBox.appendChild(rowDiv);
        activeIndex++;
    });
    rightPanel.appendChild(structureBox);
}

// 🧠 BRAIN 2: Categorisation (Blocky Colour Bleed)
function renderCategorisationActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => { if (row.Label) items.push({ text: row.Label, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Label }); });
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const structureBox = document.createElement("div");
    structureBox.style.display = "flex"; structureBox.style.flexDirection = "column"; structureBox.style.gap = "15px";

    data.forEach((row, index) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        let block = document.createElement('div');
        block.className = "text-block";
        block.style.background = "rgba(255,255,255,0.05)"; block.style.border = "1px solid rgba(255,255,255,0.1)"; block.style.borderRadius = "12px"; block.style.padding = "20px";
        block.dataset.index = index;
        
        let hintHtml = row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" style="background:none; border:none; cursor:pointer; float:right;">💡</button>` : '';
        let innerHtml = '';
        const parts = row.Text.split('___');
        parts.forEach((part, i) => {
            innerHtml += `<span style="color:#fff; font-size:1.1rem;">${part}</span>`;
            if (i < parts.length - 1) {
                innerHtml += `<div class="dropzone gap-box" style="display:inline-block; min-width:150px; min-height:40px; border:2px dashed rgba(255,255,255,0.4); border-radius:12px; margin:0 10px; vertical-align:middle;" data-expected="${row.Label}" data-parent-index="${index}" data-mode="block"></div>`;
            }
        });
        block.innerHTML = `<div>${innerHtml}</div>${hintHtml}`;
        block.querySelectorAll('.dropzone').forEach(dz => {
            dz.addEventListener('dragover', e => e.preventDefault());
            dz.addEventListener('drop', e => handleDrop(e, dz));
        });
        structureBox.appendChild(block);
    });
    rightPanel.appendChild(structureBox);
}

// 🧠 BRAIN 3: Flowing Gap-Fill
function renderFlowingGapFillActivity(data, leftPanel, rightPanel) {
    let items = [];
    data.forEach(row => { if (row.Label) items.push({ text: row.Label, isDistractor: row.Status.toLowerCase() === 'distractor', expected: row.Label }); });
    items.sort(() => Math.random() - 0.5).forEach((item, i) => leftPanel.appendChild(createDraggableChip(item.text, item.expected, i)));

    const wrapper = document.createElement('div');
    wrapper.style.color = "#fff"; wrapper.style.fontSize = "1.2rem"; wrapper.style.lineHeight = "2.8"; wrapper.style.padding = "30px"; wrapper.style.background = "rgba(255,255,255,0.05)"; wrapper.style.borderRadius = "16px"; wrapper.style.border = "1px solid rgba(255,255,255,0.1)";
    
    data.forEach((row) => {
        if (row.Status.toLowerCase() === 'distractor' || !row.Text) return;
        let hintHtml = row.Hint ? `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" style="background:none; border:none; cursor:pointer; margin-left:10px;">💡</button>` : '';
        const span = document.createElement('span');
        
        if (row.Text.includes('___')) {
            const parts = row.Text.split('___');
            parts.forEach((part, i) => {
                const textNode = document.createElement('span'); textNode.innerHTML = part; span.appendChild(textNode);
                if (i < parts.length - 1) {
                    const dropzone = document.createElement('div');
                    dropzone.className = "dropzone gap-box";
                    dropzone.style.display = "inline-flex"; dropzone.style.alignItems = "center"; dropzone.style.justifyContent = "center"; dropzone.style.minWidth = "120px"; dropzone.style.height = "40px"; dropzone.style.border = "2px dashed rgba(255,255,255,0.4)"; dropzone.style.borderRadius = "9999px"; dropzone.style.margin = "0 10px"; dropzone.style.verticalAlign = "middle";
                    dropzone.dataset.expected = row.Label; dropzone.dataset.mode = 'flowing';
                    dropzone.addEventListener('dragover', e => e.preventDefault());
                    dropzone.addEventListener('drop', e => handleDrop(e, dropzone));
                    span.appendChild(dropzone);
                }
            });
            if(hintHtml) span.innerHTML += hintHtml;
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
    leftPanel.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:30px; border-radius:16px; text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center;"><h3 style="color:#f9a8d4; font-size:1.5rem; margin-bottom:15px;">🔍 Detective Mode</h3><p style="color:#fff;">Click the words in the text to highlight <strong>${data[0].Label}</strong>.</p></div>`;
    const textBox = document.createElement('div');
    textBox.style.background = "rgba(255,255,255,0.05)"; textBox.style.border = "1px solid rgba(255,255,255,0.1)"; textBox.style.borderRadius = "16px"; textBox.style.padding = "30px"; textBox.style.fontSize = "1.2rem"; textBox.style.color = "#fff"; textBox.style.lineHeight = "2.5";
    
    data.forEach((row) => {
        if (!row.Text) return;
        const p = document.createElement('p'); p.style.marginBottom = "20px";
        let processedText = row.Text.replace(/\[\[(.*?)\]\]/g, `<span class="detective-word" data-target="true">$1</span>`);
        processedText = processedText.split(' ').map(word => {
            if (word.includes('detective-word')) return word;
            return `<span class="detective-word" data-target="false">${word}</span>`;
        }).join(' ');
        p.innerHTML = processedText;
        if(row.Hint) p.innerHTML += `<button onclick="Swal.fire('Hint', '${row.Hint.replace(/'/g, "\\'")}', 'info')" style="background:none; border:none; cursor:pointer; margin-left:10px;">💡</button>`;
        textBox.appendChild(p);
    });
    rightPanel.appendChild(textBox);

    document.querySelectorAll('.detective-word').forEach(word => {
        word.addEventListener('click', function() {
            if (this.dataset.target === "true") {
                this.classList.add('correct');
                this.dataset.found = "true";
            } else {
                this.classList.add('incorrect');
                setTimeout(() => this.classList.remove('incorrect'), 1000);
            }
        });
    });
}

// --- DRAG AND DROP ---
function createDraggableChip(text, expected, index) {
    let chip = document.createElement("div");
    chip.className = "draggable-chip";
    chip.style.backgroundColor = COLORS[index % COLORS.length];
    chip.style.borderRadius = "12px"; // YOUR soft rectangle
    chip.style.padding = "15px"; chip.style.marginBottom = "10px"; chip.style.textAlign = "center"; chip.style.color = "#111"; chip.style.fontWeight = "bold"; chip.style.cursor = "grab";
    chip.innerText = text; chip.draggable = true;
    chip.dataset.expected = expected; chip.dataset.color = COLORS[index % COLORS.length];

    chip.addEventListener("dragstart", (e) => {
        draggedItem = chip; e.dataTransfer.setData("text/plain", text);
        setTimeout(() => chip.style.opacity = "0.5", 0);
    });
    chip.addEventListener("dragend", () => { draggedItem.style.opacity = "1"; draggedItem = null; });
    return chip;
}

function handleDrop(e, dropzone) {
    e.preventDefault();
    if (draggedItem) {
        if (dropzone.children.length > 0) {
            let existingChip = dropzone.children[0];
            resetChipAppearance(existingChip);
            document.getElementById("choice-pool").appendChild(existingChip);
        }
        
        if (dropzone.dataset.mode === 'flowing') {
            draggedItem.style.padding = "4px 15px"; draggedItem.style.margin = "0"; draggedItem.style.borderRadius = '9999px';
        } else {
            draggedItem.style.width = "100%"; draggedItem.style.height = "100%"; draggedItem.style.margin = "0"; draggedItem.style.padding = "10px"; draggedItem.style.borderRadius = "8px";
        }
        
        dropzone.appendChild(draggedItem);
        dropzone.style.border = 'none';

        if (dropzone.dataset.parentIndex) {
            let block = document.querySelector(`.text-block[data-index="${dropzone.dataset.parentIndex}"]`);
            if (block) {
                block.style.backgroundColor = draggedItem.dataset.color;
                block.querySelectorAll('span').forEach(s => s.style.color = '#111');
            }
        }
    }
}

function resetChipAppearance(chip) {
    chip.style.width = "auto"; chip.style.height = "auto"; chip.style.margin = "0 0 10px 0"; chip.style.padding = "15px";
    chip.style.borderRadius = "12px"; // Returns to soft rectangle
}

document.addEventListener("DOMContentLoaded", () => {
    const leftPanel = document.getElementById("choice-pool");
    if(leftPanel) {
        leftPanel.addEventListener('dragover', e => e.preventDefault());
        leftPanel.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedItem) {
                resetChipAppearance(draggedItem);
                leftPanel.appendChild(draggedItem);
                document.querySelectorAll('.dropzone').forEach(dz => {
                    if(dz.children.length === 0) {
                        dz.style.border = '2px dashed rgba(255,255,255,0.4)';
                        if (dz.dataset.parentIndex) {
                            let block = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                            if (block) {
                                block.style.backgroundColor = "transparent";
                                block.querySelectorAll('span').forEach(s => s.style.color = '#fff');
                            }
                        }
                    }
                });
            }
        });
    }
});

function checkAnswers(activity) {
    const isDetective = activity.data[0].Type && activity.data[0].Type.toLowerCase() === 'detective';
    let allCorrect = true;

    if (isDetective) {
        const targets = document.querySelectorAll('.detective-word[data-target="true"]');
        let foundCount = 0;
        targets.forEach(t => { if (t.dataset.found === "true") foundCount++; });
        allCorrect = foundCount === targets.length;
    } else {
        const dropzones = document.querySelectorAll('.dropzone');
        dropzones.forEach(dz => {
            if (dz.children.length > 0) {
                const chip = dz.children[0];
                if (chip.dataset.expected === dz.dataset.expected) {
                    chip.style.backgroundColor = "#4ade80"; // Green for correct
                } else {
                    allCorrect = false;
                    resetChipAppearance(chip); document.getElementById("choice-pool").appendChild(chip);
                    dz.style.border = '2px dashed rgba(255,255,255,0.4)';
                    if (dz.dataset.parentIndex) {
                        let block = document.querySelector(`.text-block[data-index="${dz.dataset.parentIndex}"]`);
                        if (block) { block.style.backgroundColor = "transparent"; block.querySelectorAll('span').forEach(s => s.style.color = '#fff'); }
                    }
                }
            } else { allCorrect = false; }
        });
    }

    const hasDistractors = activity.data.some(r => r.Status && r.Status.toLowerCase() === 'distractor');
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const timeStr = `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`;
    let distractorDetails = hasDistractors ? `(Avoided distractors)` : ``;

    if (allCorrect) {
        Swal.fire({
            title: 'Nailed it! 🚀', text: `Perfect! Time: ${timeStr}`, icon: 'success', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899'
        }).then(() => {
            sendTrackingData(currentStudentName, activity.title, attemptCount, "Completed", `Completed in ${timeStr}. ${distractorDetails}`);
            loadActivity(currentActivityIndex + 1);
        });
    } else {
        Swal.fire({
            title: 'Not quite! 🤔', text: 'Incorrect items have been returned to the left. Try again!', icon: 'error', background: '#1e1b4b', color: '#fff', confirmButtonColor: '#ec4899'
        });
        sendTrackingData(currentStudentName, activity.title, attemptCount, "Attempted", `Attempt ${attemptCount} failed.`);
        attemptCount++;
    }
}

function sendTrackingData(name, gameId, attempt, status, details) {
    const url = `${TRACKING_URL}?name=${encodeURIComponent(name)}&game_id=${encodeURIComponent(gameId)}&attempt=${attempt}&status=${status}&details=${encodeURIComponent(details)}`;
    fetch(url).catch(e => console.error("Tracking Error:", e));
}

function updateTeacherDashboard() {
    Papa.parse(TRACKING_CSV_URL, {
        download: true, header: true,
        complete: function(results) {
            let html = '<table style="width:100%; text-align:left; border-collapse:collapse; color:#fff;">';
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.2);"><th style="padding:10px;">Time</th><th>Name</th><th>Game</th><th>Attempt</th><th>Status</th><th>Details</th></tr>';
            let data = results.data.filter(row => row.Timestamp && row.Timestamp.trim() !== "").reverse();
            data.forEach(row => {
                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px;">${new Date(row.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>${row.Name}</td><td style="color:#f9a8d4;">${row.Game_ID}</td><td>${row.Attempt}</td>
                    <td>${row.Status}</td><td style="font-size:0.9rem; color:#ccc;">${row.Details}</td>
                </tr>`;
            });
            html += '</table>';
            document.getElementById('teacher-results').innerHTML = html;
        }
    });
}
