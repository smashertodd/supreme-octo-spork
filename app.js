const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';
const TEACHER_PIN = '@pple';
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

let activities = [];
let currentActivity = null;
let isTeacher = false;
let studentName = '';
let attemptCount = 0;
let isGapFill = false;

// Inject Beautiful Sunrise Theme & Layout Rules
const style = document.createElement('style');
style.textContent = `
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        background: linear-gradient(135deg, #ce0058, #182b78) !important;
        color: #1e293b;
        min-height: 100vh;
        margin: 0;
    }
    
    .glass-panel {
        background: rgba(255, 255, 255, 0.95) !important;
        border-radius: 16px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
        border: none !important;
    }

    #main-activity-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        align-items: start;
    }

    #left-sticky-column {
        position: sticky;
        top: 2rem;
        max-height: 85vh;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        #main-activity-grid { grid-template-columns: 1fr; }
        #left-sticky-column { position: relative; top: 0; max-height: none; overflow-y: visible; }
    }

    /* Chips */
    .draggable-chip {
        cursor: grab;
        user-select: none;
        touch-action: none;
        width: fit-content;
        max-width: 100%;
        display: inline-block;
        color: #000000 !important;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.1s;
    }
    .draggable-chip:active { cursor: grabbing; transform: scale(0.95); }

    /* Drop Zones */
    .drop-zone-block {
        min-height: 3.5rem;
        border: 2px dashed #94a3b8;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.8);
        transition: all 0.2s ease;
    }
    
    .drop-zone-inline {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 130px;
        min-height: 40px;
        border: 2px dashed #94a3b8;
        margin: 0 6px;
        vertical-align: middle;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        transition: all 0.2s ease;
    }

    .drag-over { background-color: #e0e7ff !important; border-color: #6366f1 !important; transform: scale(1.02); }
    .drop-zone-active { border-color: #ec4899 !important; background-color: #fce7f3 !important; }

    /* Seamless look when filled */
    .drop-zone.filled {
        border: none !important;
        background: transparent !important;
        min-width: auto !important;
        min-height: auto !important;
        padding: 0 !important;
        margin: 0 4px !important;
    }
    .drop-zone.filled .draggable-chip {
        border-radius: 16px; /* Turns into a pill shape when dropped */
        padding: 4px 12px;
    }

    .loading-spinner {
        border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid #ffffff;
        border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    // Force clean scrolling 
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    checkRole();
});

function checkRole() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role') === 'teacher') {
        const pin = prompt('Enter Teacher PIN:');
        if (pin === TEACHER_PIN) {
            isTeacher = true;
            initTeacherView();
        } else {
            alert('Incorrect PIN');
            window.location.search = '';
        }
    } else {
        initStudentAuth();
    }
}

// ==========================================
// STUDENT LOGIN
// ==========================================
function initStudentAuth() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-md mx-auto glass-panel p-8 mt-20 text-center relative z-10">
            <h1 class="text-4xl font-bold text-pink-600 mb-2">Fix the Paragraph</h1>
            <p class="text-gray-500 mb-8">Student Access</p>
            
            <input type="text" id="studentName" placeholder="Enter your full name"
                   class="w-full p-4 border-2 border-gray-200 rounded-xl mb-6 text-lg focus:border-pink-500 focus:outline-none transition">
            
            <button onclick="startStudent()"
                    class="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Activity
            </button>
            
            <!-- TEACHER LOGIN LINK RESTORED HERE -->
            <div class="mt-8 pt-6 border-t border-gray-100">
                <a href="?role=teacher" class="text-sm font-medium text-gray-400 hover:text-pink-600 transition flex justify-center items-center gap-2">
                    <span>👨‍🏫</span> Teacher Dashboard
                </a>
            </div>
        </div>
    `;
}

async function startStudent() {
    const nameInput = document.getElementById('studentName').value.trim();
    if (!nameInput) { alert('Please enter your name'); return; }
    studentName = nameInput;

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-md mx-auto mt-20 text-center relative z-10">
            <div class="loading-spinner"></div>
            <p class="text-white text-xl mt-4 font-medium drop-shadow-md">Loading activities...</p>
        </div>
    `;

    await loadActivities();
    renderActivityList();
}

async function loadActivities() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const csvText = await response.text();
        activities = parseCSV(csvText);
    } catch (error) {
        console.error('Error loading activities:', error);
        alert('Failed to load activities. Please refresh the page.');
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const parsedActivities = [];
    let currentAct = null;
    let currentTitle = '';
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCSVRow(lines[i]);
        const rowData = {};
        headers.forEach((header, index) => {
            rowData[header] = row[index] ? row[index].trim() : '';
        });
        if (rowData.Title && rowData.Title !== currentTitle) {
            currentTitle = rowData.Title;
            currentAct = {
                title: currentTitle,
                type: rowData.Type || '',
                overallHint: rowData.Overall_Hint || '',
                data: []
            };
            parsedActivities.push(currentAct);
        }
        if (currentAct && (rowData.Text || rowData.Label)) {
            currentAct.data.push(rowData);
        }
    }
    return parsedActivities.filter(a => a.data.length > 0);
}

function parseCSVRow(row) {
    const result = [];
    let insideQuotes = false;
    let currentValue = '';
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (insideQuotes && row[i+1] === '"') { currentValue += '"'; i++; } 
            else { insideQuotes = !insideQuotes; }
        } else if (char === ',' && !insideQuotes) {
            result.push(currentValue); currentValue = '';
        } else { currentValue += char; }
    }
    result.push(currentValue);
    return result;
}

// ==========================================
// ACTIVITY LIST
// ==========================================
function renderActivityList() {
    const app = document.getElementById('app');
    let html = `
        <div class="max-w-4xl mx-auto glass-panel p-8 mt-10 relative z-10">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-pink-600">Available Activities</h2>
                <div class="text-gray-500 font-medium">Logged in as: <span class="text-pink-500">${studentName}</span></div>
            </div>
            <div class="grid gap-4">
    `;
    activities.forEach((activity, index) => {
        html += `
            <button onclick="startActivity(${index})"
                    class="text-left p-5 border-2 border-transparent bg-gray-50 rounded-xl hover:border-pink-400 hover:bg-pink-50 hover:shadow-md transition duration-200">
                <div class="font-bold text-xl text-gray-800">${activity.title}</div>
                <div class="text-sm text-gray-500 mt-1">${activity.type}</div>
            </button>
        `;
    });
    html += `</div></div>`;
    app.innerHTML = html;
}

// ==========================================
// MAIN ACTIVITY VIEW
// ==========================================
function startActivity(index) {
    currentActivity = activities[index];
    attemptCount = 0;
    isGapFill = currentActivity.data.some(row => row.Text && row.Text.includes('___'));
    const app = document.getElementById('app');

    let html = `
        <div class="max-w-[1400px] w-[95%] mx-auto mt-6 relative h-full pb-32 z-10">
            
            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-4xl font-bold text-white drop-shadow-lg">${currentActivity.title}</h2>
                    <button onclick="renderActivityList()" class="px-5 py-2 glass-panel text-gray-800 font-bold hover:bg-gray-100 transition shadow-lg rounded-full">← All activities</button>
                </div>
                <p class="text-pink-100 text-lg drop-shadow-md">
                    ${isGapFill ? 'Drag the correct words/phrases into the gaps. Watch out for distractors!' : 'Drag the paragraph parts into the correct structural order. Watch out for distractors!'}
                </p>
                ${currentActivity.overallHint ? `<button onclick="alert('Overall Hint: ${currentActivity.overallHint.replace(/'/g, "\\'")}')" class="mt-4 px-4 py-2 bg-yellow-300 text-yellow-900 rounded-lg font-bold hover:bg-yellow-400 shadow-lg transition transform hover:scale-105">💡 Need an overall hint?</button>` : ''}
            </div>

            <!-- ID TARGETED GRID CONTAINER -->
            <div id="main-activity-grid">
                <!-- LEFT COLUMN -->
                <div id="left-sticky-column" class="glass-panel p-6">
                    <h3 class="font-bold text-xl mb-4 text-gray-800 text-center border-b border-gray-200 pb-3">Choices</h3>
                    <div id="choices-container" class="flex flex-col gap-3 items-center min-h-[200px]">
                        <!-- Choices injected here -->
                    </div>
                </div>
                
                <!-- RIGHT COLUMN -->
                <div class="glass-panel p-8">
                    <h3 class="font-bold text-xl mb-6 text-gray-800 border-b border-gray-200 pb-3">Paragraph Labels</h3>
                    <div id="paragraph-container" class="text-gray-800 min-h-[400px]">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>

            <!-- Fixed Check Button -->
            <div class="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900/80 to-transparent flex justify-center z-50 pointer-events-none">
                <button onclick="checkAnswers()" class="pointer-events-auto px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full text-2xl hover:scale-105 shadow-[0_10px_25px_rgba(236,72,153,0.5)] transition-all duration-300">Check Answer</button>
            </div>
        </div>
    `;
    app.innerHTML = html;
    
    if (isGapFill) { renderGapFill(); } 
    else { renderParagraphBuilder(); }
    
    renderChoices();
}

function renderChoices() {
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    let choices = [];
    if (isGapFill) {
        choices = currentActivity.data.map(row => ({
            text: row.Label || row.Text || '[Missing]',
            type: row.Status === 'Distractor' ? 'distractor' : 'correct'
        }));
    } else {
        choices = currentActivity.data.map(row => ({
            text: row.Text,
            type: row.Status === 'Distractor' ? 'distractor' : 'correct'
        }));
    }
    choices = choices.sort(() => Math.random() - 0.5);
    choices.forEach((choice, index) => {
        const color = COLORS[index % COLORS.length];
        const div = document.createElement('div');
        div.className = 'draggable-chip';
        div.style.backgroundColor = color;
        div.draggable = true;
        div.dataset.text = choice.text;
        div.innerText = choice.text;
        container.appendChild(div);
    });
    setupDragAndDrop();
}

function renderParagraphBuilder() {
    const container = document.getElementById('paragraph-container');
    container.innerHTML = '';
    const parts = currentActivity.data.filter(row => row.Status !== 'Distractor');
    
    parts.forEach((part, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex gap-4 mb-4 items-stretch';
        const labelDiv = document.createElement('div');
        labelDiv.className = 'w-56 bg-gray-50 p-4 rounded-xl font-bold text-gray-700 flex flex-col justify-center items-center text-center border-2 border-gray-200 shadow-sm';
        labelDiv.innerHTML = `
            ${part.Label || `Part ${index + 1}`}
            ${part.Hint ? `<button class="mt-2 text-2xl hover:scale-110 transition" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>` : ''}
        `;
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone drop-zone-block flex-1 flex items-center justify-center p-3';
        dropZone.dataset.expected = part.Text;
        dropZone.dataset.index = index;
        
        rowDiv.appendChild(labelDiv);
        rowDiv.appendChild(dropZone);
        container.appendChild(rowDiv);
    });
}

function renderGapFill() {
    const container = document.getElementById('paragraph-container');
    container.innerHTML = '';
    const parts = currentActivity.data.filter(row => row.Status !== 'Distractor');

    const isCategorisation = currentActivity.type && 
        (currentActivity.type.toLowerCase().includes('categorise') || 
         currentActivity.type.toLowerCase().includes('categorize'));

    if (isCategorisation) {
        // CATEGORISATION MODE (Blocky Layout with colour-bleed)
        container.className = 'flex flex-col gap-4';
        parts.forEach((part, index) => {
            const partDiv = document.createElement('div');
            partDiv.className = 'gap-fill-part p-4 rounded-xl transition-colors duration-300 border border-transparent';
            partDiv.dataset.index = index;
            let html = part.Text.replace('___', `<span class="drop-zone drop-zone-inline" data-expected="${part.Label}" data-index="${index}"></span>`);
            if (part.Hint) {
                html += `<button class="ml-3 text-2xl align-middle hover:scale-110 transition" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>`;
            }
            partDiv.innerHTML = `<div class="text-lg leading-relaxed text-gray-800">${html}</div>`;
            container.appendChild(partDiv);
        });
    } else {
        // STANDARD GAP-FILL MODE (Inline paragraph)
        container.className = 'text-xl leading-[2.5] font-medium text-gray-800 bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-inner';
        let fullHtml = '';
        parts.forEach((part, index) => {
            let replacedText = part.Text.replace('___', `<span class="drop-zone drop-zone-inline" data-expected="${part.Label}" data-index="${index}"></span>`);
            if (part.Hint) {
                 replacedText += `<button class="text-2xl ml-1 mr-2 align-middle hover:scale-110 transition" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>`;
            }
            fullHtml += replacedText + ' ';
        });
        container.innerHTML = fullHtml;
    }
    setupDragAndDrop();
}

function updateGapStyles() {
    // 1. Manage .filled class for removing borders on inline gaps
    document.querySelectorAll('.drop-zone').forEach(zone => {
        if (zone.children.length > 0) zone.classList.add('filled');
        else zone.classList.remove('filled');
    });

    // 2. Manage colour-bleed for Categorisation layout
    if (!isGapFill) return;
    const parts = document.querySelectorAll('.gap-fill-part');
    parts.forEach(part => {
        const dropZone = part.querySelector('.drop-zone');
        if (dropZone && dropZone.children.length > 0) {
            const chip = dropZone.children[0];
            part.style.backgroundColor = chip.style.backgroundColor;
            part.style.borderColor = 'rgba(0,0,0,0.1)';
        } else {
            part.style.backgroundColor = 'transparent';
            part.style.borderColor = 'transparent';
        }
    });
}

// ==========================================
// DRAG AND DROP
// ==========================================
function setupDragAndDrop() {
    const chips = document.querySelectorAll('.draggable-chip');
    const dropZones = document.querySelectorAll('.drop-zone');
    const choicesContainer = document.getElementById('choices-container');

    chips.forEach(chip => {
        chip.addEventListener('dragstart', handleDragStart);
        chip.addEventListener('dragend', handleDragEnd);
        chip.addEventListener('touchstart', handleTouchStart, {passive: false});
        chip.addEventListener('touchmove', handleTouchMove, {passive: false});
        chip.addEventListener('touchend', handleTouchEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    choicesContainer.addEventListener('dragover', e => e.preventDefault());
    choicesContainer.addEventListener('drop', e => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const chip = document.querySelector(`[data-text="${data.replace(/"/g, '\\"')}"]`);
        if (chip && chip.parentElement !== choicesContainer) {
            choicesContainer.appendChild(chip);
            updateGapStyles();
        }
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.text);
    e.target.style.opacity = '0.4';
}
function handleDragEnd(e) {
    e.target.style.opacity = '1';
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
}
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');

    const data = e.dataTransfer.getData('text/plain');
    const chip = document.querySelector(`[data-text="${data.replace(/"/g, '\\"')}"]`);

    if (chip) {
        if (zone.children.length > 0) {
            document.getElementById('choices-container').appendChild(zone.children[0]);
        }
        zone.appendChild(chip);
        updateGapStyles();
    }
}

// Mobile Touch
let activeTouchChip = null;
let touchStartX = 0; let touchStartY = 0;
function handleTouchStart(e) {
    if (e.target.draggable === false) return;
    activeTouchChip = e.target;
    const touch = e.touches[0];
    touchStartX = touch.clientX; touchStartY = touch.clientY;
    
    const rect = activeTouchChip.getBoundingClientRect();
    activeTouchChip.style.width = rect.width + 'px';
    activeTouchChip.style.height = rect.height + 'px';
    activeTouchChip.style.position = 'fixed';
    activeTouchChip.style.zIndex = '1000';
    activeTouchChip.style.left = rect.left + 'px';
    activeTouchChip.style.top = rect.top + 'px';
    activeTouchChip.style.opacity = '0.9';
}
function handleTouchMove(e) {
    if (!activeTouchChip) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    
    const rect = activeTouchChip.getBoundingClientRect();
    activeTouchChip.style.left = (rect.left + dx) + 'px';
    activeTouchChip.style.top = (rect.top + dy) + 'px';
    
    touchStartX = touch.clientX; touchStartY = touch.clientY;
    
    document.querySelectorAll('.drop-zone').forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        if (touch.clientX >= zoneRect.left && touch.clientX <= zoneRect.right &&
            touch.clientY >= zoneRect.top && touch.clientY <= zoneRect.bottom) {
            zone.classList.add('drop-zone-active');
        } else {
            zone.classList.remove('drop-zone-active');
        }
    });
}
function handleTouchEnd(e) {
    if (!activeTouchChip) return;
    const touch = e.changedTouches[0];
    let droppedInZone = false;
    
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drop-zone-active');
        const zoneRect = zone.getBoundingClientRect();
        if (touch.clientX >= zoneRect.left && touch.clientX <= zoneRect.right &&
            touch.clientY >= zoneRect.top && touch.clientY <= zoneRect.bottom) {
            
            if (zone.children.length > 0) {
                document.getElementById('choices-container').appendChild(zone.children[0]);
            }
            activeTouchChip.style.position = 'static';
            activeTouchChip.style.width = 'fit-content';
            activeTouchChip.style.height = 'auto';
            activeTouchChip.style.opacity = '1';
            zone.appendChild(activeTouchChip);
            droppedInZone = true;
        }
    });
    
    if (!droppedInZone) {
        activeTouchChip.style.position = 'static';
        activeTouchChip.style.width = 'fit-content';
        activeTouchChip.style.height = 'auto';
        activeTouchChip.style.opacity = '1';
        document.getElementById('choices-container').appendChild(activeTouchChip);
    }
    activeTouchChip = null;
    updateGapStyles();
}

// ==========================================
// CHECK ANSWERS & TRACKING
// ==========================================
function checkAnswers() {
    attemptCount++;
    let allCorrect = true;
    let missingAnswers = false;
    let details = [];
    
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach((zone, index) => {
        if (zone.children.length === 0) {
            missingAnswers = true;
            zone.style.borderColor = '#ef4444'; // Red border
        } else {
            const chip = zone.children[0];
            const expected = zone.dataset.expected;
            const actual = chip.dataset.text;
            
            details.push(`Gap ${parseInt(zone.dataset.index)+1}: ${actual === expected ? 'Correct' : 'Incorrect'}`);
            
            if (actual === expected) {
                chip.style.backgroundColor = '#86efac'; // Green
                chip.draggable = false;
                zone.classList.remove('filled'); // Brings back border space
                zone.style.border = '2px solid #22c55e'; // Green solid border
                zone.style.backgroundColor = 'transparent';
            } else {
                allCorrect = false;
                // Return incorrect chip
                document.getElementById('choices-container').appendChild(chip);
            }
        }
    });
    
    updateGapStyles();

    if (missingAnswers) { alert('Please fill all slots before checking!'); return; }
    
    const status = allCorrect ? 'Completed' : 'Attempted';
    
    fetch(TRACKING_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: studentName, gameId: currentActivity.title,
            attempt: attemptCount, status: status, details: details.join(' | ')
        })
    }).catch(err => console.error('Tracking Error:', err));
    
    if (allCorrect) {
        alert(`Congratulations! You completed the activity in ${attemptCount} attempt(s)!`);
        renderActivityList();
    } else {
        alert('Some answers are incorrect. Incorrect items have been returned to the choices box. Try again!');
    }
}

// ==========================================
// TEACHER DASHBOARD
// ==========================================
function initTeacherView() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-6xl mx-auto p-8 relative z-10">
            <div class="flex justify-between items-center mb-8 glass-panel p-6">
                <h1 class="text-3xl font-bold text-pink-600">👨‍🏫 Teacher Dashboard</h1>
                <div class="text-sm text-gray-500 flex items-center gap-4">
                    <span id="last-refresh" class="font-medium">Last updated: Just now</span>
                    <button onclick="fetchTeacherData()" class="px-4 py-2 bg-pink-100 text-pink-700 font-bold rounded-lg hover:bg-pink-200 transition shadow">
                        Force Refresh
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="glass-panel p-6 text-center">
                    <h3 class="text-gray-500 font-bold mb-2 uppercase tracking-wide">Total Students</h3>
                    <div id="stat-students" class="text-5xl font-bold text-blue-500">-</div>
                </div>
                <div class="glass-panel p-6 text-center">
                    <h3 class="text-gray-500 font-bold mb-2 uppercase tracking-wide">Total Attempts</h3>
                    <div id="stat-attempts" class="text-5xl font-bold text-pink-500">-</div>
                </div>
                <div class="glass-panel p-6 text-center">
                    <h3 class="text-gray-500 font-bold mb-2 uppercase tracking-wide">Completion Rate</h3>
                    <div id="stat-completion" class="text-5xl font-bold text-green-500">-</div>
                </div>
            </div>
            
            <div class="glass-panel overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50/50 text-gray-600 border-b border-gray-200">
                                <th class="p-4 font-bold">Time</th>
                                <th class="p-4 font-bold">Student Name</th>
                                <th class="p-4 font-bold">Activity Title</th>
                                <th class="p-4 font-bold text-center">Attempt</th>
                                <th class="p-4 font-bold text-center">Status</th>
                                <th class="p-4 font-bold">Details</th>
                            </tr>
                        </thead>
                        <tbody id="teacher-table-body" class="divide-y divide-gray-100">
                            <tr><td colspan="6" class="p-8 text-center text-gray-400 font-medium">Loading student tracking data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    fetchTeacherData();
    setInterval(fetchTeacherData, 15000);
}

async function fetchTeacherData() {
    const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';
    try {
        const response = await fetch(TRACKING_CSV_URL + '&t=' + new Date().getTime());
        const csvText = await response.text();
        const lines = csvText.split('\n');
        if (lines.length <= 1) {
            document.getElementById('teacher-table-body').innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500 italic">No student data recorded yet.</td></tr>`;
            return;
        }
        const dataRows = lines.slice(1).filter(line => line.trim().length > 0);
        dataRows.reverse();
        const uniqueStudents = new Set();
        let completions = 0; let html = '';
        
        dataRows.forEach(row => {
            const cols = parseCSVRow(row);
            if (cols.length >= 5) {
                const dateRaw = cols[0]; const name = cols[1]; const gameId = cols[2];
                const attempt = cols[3] || '1'; const status = cols[4]; const details = cols[5] || '';
                
                uniqueStudents.add(name);
                if (status.toLowerCase() === 'completed') completions++;
                
                let statusBadge = status.toLowerCase() === 'completed'
                    ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold shadow-sm">Completed</span>'
                    : '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold shadow-sm">Attempted</span>';
                
                const formattedTime = new Date(dateRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                let formattedDetails = details.split(' | ').map(detail => {
                    if (detail.includes('Incorrect')) return `<span class="text-red-500 font-medium">${detail}</span>`;
                    if (detail.includes('Correct')) return `<span class="text-green-500 font-medium">${detail}</span>`;
                    return detail;
                }).join('<br>');
                
                html += `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="p-4 text-sm text-gray-500 whitespace-nowrap">${formattedTime}</td>
                        <td class="p-4 font-bold text-gray-800">${name}</td>
                        <td class="p-4 text-gray-600 font-medium">${gameId}</td>
                        <td class="p-4 text-center font-bold text-gray-600">${attempt}</td>
                        <td class="p-4 text-center">${statusBadge}</td>
                        <td class="p-4 text-sm text-gray-600">${formattedDetails}</td>
                    </tr>
                `;
            }
        });
        document.getElementById('teacher-table-body').innerHTML = html;
        document.getElementById('stat-students').innerText = uniqueStudents.size;
        document.getElementById('stat-attempts').innerText = dataRows.length;
        const rate = dataRows.length > 0 ? Math.round((completions / dataRows.length) * 100) : 0;
        document.getElementById('stat-completion').innerText = `${rate}%`;
        document.getElementById('last-refresh').innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) { console.error('Error fetching teacher data:', error); }
}
