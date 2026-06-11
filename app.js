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

function forceRemoveOverflows() {
    let currentElement = document.getElementById('app');
    while (currentElement && currentElement !== document.body) {
        currentElement.style.setProperty('overflow', 'visible', 'important');
        currentElement.style.setProperty('overflow-y', 'visible', 'important');
        currentElement = currentElement.parentElement;
    }
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
}

// Inject CSS for Dark Mode Drop Zones and Layout
const style = document.createElement('style');
style.textContent = `
    #main-activity-grid {
        display: grid !important;
        grid-template-columns: 320px 1fr !important;
        gap: 1.5rem !important;
        align-items: start !important;
    }
    #left-sticky-column {
        position: sticky !important;
        top: 2rem !important;
        align-self: start !important;
        height: max-content !important;
        max-height: 85vh;
        overflow-y: auto;
    }
    @media (max-width: 768px) {
        #main-activity-grid { grid-template-columns: 1fr !important; }
        #left-sticky-column { position: relative !important; top: 0 !important; max-height: none; overflow-y: visible; }
    }
    
    .draggable-chip {
        cursor: grab;
        user-select: none;
        touch-action: none;
        width: fit-content;
        max-width: 100%;
        display: inline-block;
        color: #000000 !important;
        border-radius: 9999px;
    }
    .draggable-chip:active { cursor: grabbing; }
    
    .drop-zone { min-height: 2.5rem; transition: all 0.3s ease; }
    .drop-zone.drag-over { background-color: rgba(51, 65, 85, 0.8) !important; border-color: #cbd5e1 !important; transform: scale(1.02); }
    .drop-zone-active { border-color: #ec4899 !important; background-color: rgba(236, 72, 153, 0.1) !important; }

    .drop-zone.filled {
        border-color: transparent !important;
        background-color: transparent !important;
    }
    .loading-spinner {
        border: 4px solid rgba(255,255,255,0.1);
        border-top: 4px solid #ec4899;
        border-radius: 50%;
        width: 40px; height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    forceRemoveOverflows();
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

function initStudentAuth() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-md mx-auto bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-8 mt-20 text-center relative z-10">
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 mb-6">Fix the Paragraph</h1>
            <input type="text" id="studentName" placeholder="Enter your full name"
                   class="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg mb-6 text-lg text-white placeholder-slate-400 focus:border-pink-500 focus:outline-none">
            <button onclick="startStudent()"
                    class="w-full bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300 shadow-lg">
                Start Activity
            </button>
            
            <div class="mt-6 pt-4 border-t border-slate-700/50">
                <a href="?role=teacher" class="text-sm text-slate-400 hover:text-pink-400 flex justify-center items-center gap-2 transition">
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
        <div class="max-w-md mx-auto mt-20 text-center">
            <div class="loading-spinner"></div>
            <p class="text-slate-300 text-xl mt-4">Loading activities...</p>
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
    let currentAct = null; let currentTitle = ''; let currentType = ''; let currentOverallHint = '';
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCSVRow(lines[i]);
        const rowData = {};
        headers.forEach((header, index) => { rowData[header] = row[index] ? row[index].trim() : ''; });
        if (rowData.Title && rowData.Title !== currentTitle) {
            currentTitle = rowData.Title; currentType = rowData.Type || ''; currentOverallHint = rowData.Overall_Hint || '';
            currentAct = { title: currentTitle, type: currentType, overallHint: currentOverallHint, data: [] };
            parsedActivities.push(currentAct);
        }
        if (currentAct && (rowData.Text || rowData.Label)) { currentAct.data.push(rowData); }
    }
    return parsedActivities.filter(a => a.data.length > 0);
}

function parseCSVRow(row) {
    const result = []; let insideQuotes = false; let currentValue = '';
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (insideQuotes && row[i+1] === '"') { currentValue += '"'; i++; } else { insideQuotes = !insideQuotes; }
        } else if (char === ',' && !insideQuotes) { result.push(currentValue); currentValue = ''; } else { currentValue += char; }
    }
    result.push(currentValue); return result;
}

function renderActivityList() {
    forceRemoveOverflows();
    const app = document.getElementById('app');
    let html = `
        <div class="max-w-4xl mx-auto bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl p-8 mt-10 border border-slate-700">
            <h2 class="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">Available Activities</h2>
            <div class="grid gap-4">
    `;
    activities.forEach((activity, index) => {
        html += `
            <button onclick="startActivity(${index})"
                    class="text-left p-5 border border-slate-600 bg-slate-900/50 rounded-xl hover:border-pink-500 hover:bg-slate-800 transition duration-300 group">
                <div class="font-bold text-xl text-slate-200 group-hover:text-pink-400 transition">${activity.title}</div>
                <div class="text-sm text-slate-400 mt-1">${activity.type}</div>
            </button>
        `;
    });
    html += `</div></div>`;
    app.innerHTML = html;
}

function startActivity(index) {
    currentActivity = activities[index];
    attemptCount = 0;
    isGapFill = currentActivity.data.some(row => row.Text && row.Text.includes('___'));
    const app = document.getElementById('app');

    // EXACTLY matching your screenshot's header layout and gradient borders!
    let html = `
        <div class="max-w-7xl mx-auto mt-6 relative h-full mb-24 text-slate-200">
            <!-- Header Block matching screenshot -->
            <div class="bg-slate-800/60 backdrop-blur-md rounded-t-xl p-6 mb-6 shadow-lg" style="border-top: 4px solid; border-image: linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6) 1;">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">${currentActivity.title}</h2>
                    <button onclick="renderActivityList()" class="px-4 py-2 bg-slate-700/50 hover:bg-slate-600 border border-slate-500 text-slate-200 rounded-lg transition">← All activities</button>
                </div>
                <p class="text-slate-300 text-lg">
                    ${isGapFill ? 'Drag the correct words/phrases into the gaps. Watch out for distractors!' : 'Drag the paragraph parts into the correct structural order. Watch out for distractors!'}
                </p>
                ${currentActivity.overallHint ? `<button onclick="alert('Overall Hint: ${currentActivity.overallHint.replace(/'/g, "\\'")}')" class="mt-4 px-4 py-2 bg-indigo-900/50 border border-indigo-500 text-indigo-300 rounded font-bold hover:bg-indigo-800 shadow transition">💡 Need an overall hint?</button>` : ''}
            </div>

            <!-- Grid Container -->
            <div id="main-activity-grid">
                <!-- Left Sticky Choices -->
                <div id="left-sticky-column" class="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-slate-700">
                    <h3 class="font-bold text-xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400 text-center">Choices</h3>
                    <div id="choices-container" class="flex flex-col gap-3 items-center min-h-[100px]"></div>
                </div>
                
                <!-- Right Content Panel -->
                <div class="bg-slate-800/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-slate-700">
                    <h3 class="font-bold text-xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">Activity Space</h3>
                    <div id="paragraph-container" class="bg-slate-900/50 p-6 rounded-lg border border-slate-700 min-h-[400px]">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>
            
            <!-- Bottom Check Bar -->
            <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-700 flex justify-center z-50">
                <button onclick="checkAnswers()" class="px-10 py-3 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-bold rounded-lg text-xl shadow-lg transition">Check Answer</button>
            </div>
        </div>
    `;
    app.innerHTML = html;
    forceRemoveOverflows();
    if (isGapFill) { renderGapFill(); } else { renderParagraphBuilder(); }
    renderChoices();
}

function renderChoices() {
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    let choices = isGapFill ? currentActivity.data.map(row => ({ text: row.Label || row.Text || '[Missing]', type: row.Status === 'Distractor' ? 'distractor' : 'correct' })) : currentActivity.data.map(row => ({ text: row.Text, type: row.Status === 'Distractor' ? 'distractor' : 'correct' }));
    
    choices = choices.sort(() => Math.random() - 0.5);
    choices.forEach((choice, index) => {
        const color = COLORS[index % COLORS.length];
        const div = document.createElement('div');
        div.className = 'draggable-chip p-3 rounded-lg shadow font-bold text-center border border-slate-400/50 hover:scale-105 transition-transform';
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
        labelDiv.className = 'w-48 bg-slate-800 p-3 rounded-lg font-bold text-slate-300 flex flex-col justify-center items-center text-center border border-slate-600';
        labelDiv.innerHTML = `${part.Label || `Part ${index + 1}`} ${part.Hint ? `<button class="mt-2 text-xl hover:scale-110 transition" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>` : ''}`;
        
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone flex-1 border-2 border-dashed border-slate-500 rounded-lg p-3 bg-slate-800/50 flex items-center justify-center';
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
    const isCategorisation = currentActivity.type && (currentActivity.type.toLowerCase().includes('categorise') || currentActivity.type.toLowerCase().includes('categorize'));
         
    if (isCategorisation) {
        container.className = 'flex flex-col gap-3';
        parts.forEach((part, index) => {
            const partDiv = document.createElement('div');
            partDiv.className = 'gap-fill-part p-3 rounded-lg transition-colors duration-300 border border-transparent';
            partDiv.dataset.index = index;
            // Snappy inline boxes styled for dark mode
            let html = part.Text.replace('___', `<span class="drop-zone inline-flex w-auto min-w-[8rem] h-[2.5rem] border-2 border-dashed border-slate-500 bg-slate-800/80 align-middle mx-2 justify-center items-center rounded" data-expected="${part.Label}" data-index="${index}"></span>`);
            if (part.Hint) { html += `<button class="hint-btn ml-2 text-xl" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>`; }
            partDiv.innerHTML = html;
            container.appendChild(partDiv);
        });
    } else {
        container.className = 'text-xl leading-loose text-slate-200';
        let fullHtml = '<p class="inline-block">';
        parts.forEach((part, index) => {
            let replacedText = part.Text.replace('___', `<span class="drop-zone inline-flex w-auto min-w-[8rem] h-[2.5rem] border-2 border-dashed border-slate-500 bg-slate-800/80 align-middle mx-2 justify-center items-center rounded" data-expected="${part.Label}" data-index="${index}"></span>`);
            if (part.Hint) { replacedText += `<button class="hint-btn text-xl ml-1 mr-2" onclick="alert('Hint: ${part.Hint.replace(/'/g, "\\'")}')">💡</button>`; }
            fullHtml += replacedText + ' ';
        });
        fullHtml += '</p>';
        container.innerHTML = fullHtml;
    }
    setupDragAndDrop();
}

function updateGapColors() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        if (zone.children.length > 0) { zone.classList.add('filled'); } else { zone.classList.remove('filled'); }
    });
    if (!isGapFill) return;
    const parts = document.querySelectorAll('.gap-fill-part');
    parts.forEach(part => {
        const dropZone = part.querySelector('.drop-zone');
        if (dropZone && dropZone.children.length > 0) {
            const chip = dropZone.children[0];
            // Adds the colour bleed effect softly in dark mode
            part.style.backgroundColor = chip.style.backgroundColor;
            part.style.color = '#000000'; // Dark text so it reads well on pastel bleed
        } else {
            part.style.backgroundColor = 'transparent';
            part.style.color = ''; // Reverts to light text
        }
    });
}

function setupDragAndDrop() {
    const chips = document.querySelectorAll('.draggable-chip');
    const dropZones = document.querySelectorAll('.drop-zone');
    const choicesContainer = document.getElementById('choices-container');
    
    chips.forEach(chip => {
        chip.addEventListener('dragstart', handleDragStart); chip.addEventListener('dragend', handleDragEnd);
        chip.addEventListener('touchstart', handleTouchStart, {passive: false}); chip.addEventListener('touchmove', handleTouchMove, {passive: false}); chip.addEventListener('touchend', handleTouchEnd);
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver); zone.addEventListener('dragleave', handleDragLeave); zone.addEventListener('drop', handleDrop);
    });
    
    choicesContainer.addEventListener('dragover', e => e.preventDefault());
    choicesContainer.addEventListener('drop', e => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const chip = document.querySelector(`[data-text="${data.replace(/"/g, '\\"')}"]`);
        if (chip && chip.parentElement !== choicesContainer) { choicesContainer.appendChild(chip); updateGapColors(); }
    });
}

function handleDragStart(e) { e.dataTransfer.setData('text/plain', e.target.dataset.text); e.target.style.opacity = '0.5'; }
function handleDragEnd(e) { e.target.style.opacity = '1'; document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over')); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault(); const zone = e.currentTarget; zone.classList.remove('drag-over');
    const data = e.dataTransfer.getData('text/plain'); const chip = document.querySelector(`[data-text="${data.replace(/"/g, '\\"')}"]`);
    if (chip) {
        if (zone.children.length > 0) { document.getElementById('choices-container').appendChild(zone.children[0]); }
        zone.innerHTML = ''; zone.appendChild(chip); updateGapColors();
    }
}

let activeTouchChip = null; let touchStartX = 0; let touchStartY = 0;
function handleTouchStart(e) {
    if (e.target.draggable === false) return;
    activeTouchChip = e.target; const touch = e.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY;
    const rect = activeTouchChip.getBoundingClientRect();
    activeTouchChip.style.width = rect.width + 'px'; activeTouchChip.style.height = rect.height + 'px';
    activeTouchChip.style.position = 'fixed'; activeTouchChip.style.zIndex = '1000';
    activeTouchChip.style.left = rect.left + 'px'; activeTouchChip.style.top = rect.top + 'px'; activeTouchChip.style.opacity = '0.8';
}
function handleTouchMove(e) {
    if (!activeTouchChip) return;
    e.preventDefault(); const touch = e.touches[0]; const dx = touch.clientX - touchStartX; const dy = touch.clientY - touchStartY;
    const rect = activeTouchChip.getBoundingClientRect();
    activeTouchChip.style.left = (rect.left + dx) + 'px'; activeTouchChip.style.top = (rect.top + dy) + 'px';
    touchStartX = touch.clientX; touchStartY = touch.clientY;
    document.querySelectorAll('.drop-zone').forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        if (touch.clientX >= zoneRect.left && touch.clientX <= zoneRect.right && touch.clientY >= zoneRect.top && touch.clientY <= zoneRect.bottom) { zone.classList.add('drop-zone-active'); } else { zone.classList.remove('drop-zone-active'); }
    });
}
function handleTouchEnd(e) {
    if (!activeTouchChip) return;
    const touch = e.changedTouches[0]; let droppedInZone = false;
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drop-zone-active'); const zoneRect = zone.getBoundingClientRect();
        if (touch.clientX >= zoneRect.left && touch.clientX <= zoneRect.right && touch.clientY >= zoneRect.top && touch.clientY <= zoneRect.bottom) {
            if (zone.children.length > 0) { document.getElementById('choices-container').appendChild(zone.children[0]); }
            activeTouchChip.style.position = 'static'; activeTouchChip.style.width = 'fit-content'; activeTouchChip.style.height = 'auto'; activeTouchChip.style.opacity = '1';
            zone.innerHTML = ''; zone.appendChild(activeTouchChip); droppedInZone = true;
        }
    });
    if (!droppedInZone) { activeTouchChip.style.position = 'static'; activeTouchChip.style.width = 'fit-content'; activeTouchChip.style.height = 'auto'; activeTouchChip.style.opacity = '1'; document.getElementById('choices-container').appendChild(activeTouchChip); }
    activeTouchChip = null; updateGapColors();
}

function checkAnswers() {
    attemptCount++; let allCorrect = true; let missingAnswers = false; let details = [];
    
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach((zone, index) => {
        if (zone.children.length === 0) {
            missingAnswers = true; zone.classList.add('border-red-500', 'border-solid'); zone.classList.remove('border-slate-500', 'border-dashed');
        } else {
            const chip = zone.children[0]; const expected = zone.dataset.expected; const actual = chip.dataset.text;
            details.push(`${isGapFill ? 'Gap' : 'Part'} ${index+1}: ${actual === expected ? 'Correct' : 'Incorrect'}`);
            if (actual === expected) {
                chip.style.backgroundColor = '#86efac'; chip.draggable = false;
                zone.classList.remove('border-slate-500', 'border-dashed', 'border-red-500'); zone.classList.add('border-green-500', 'border-solid');
            } else {
                allCorrect = false; zone.classList.add('border-red-500', 'border-solid'); zone.classList.remove('filled', 'border-slate-500', 'border-dashed');
                document.getElementById('choices-container').appendChild(chip);
            }
        }
    });
    updateGapColors();
    
    if (missingAnswers) { alert('Please fill all slots before checking!'); return; }
    
    const status = allCorrect ? 'Completed' : 'Attempted';
    fetch(TRACKING_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName, gameId: currentActivity.title, attempt: attemptCount, status: status, details: details.join(' | ') })
    }).catch(err => console.error('Tracking Error:', err));
    
    if (allCorrect) { alert(`Congratulations! You completed the activity in ${attemptCount} attempt(s)!`); renderActivityList(); } else { alert('Some answers are incorrect. Incorrect items have been returned to the choices box. Try again!'); }
}

// Teacher Dashboard - Dark Mode Styled
function initTeacherView() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-6xl mx-auto p-8">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">Teacher Dashboard</h1>
                <div class="text-sm text-slate-400 flex items-center gap-4">
                    <span id="last-refresh">Last updated: Just now</span>
                    <button onclick="fetchTeacherData()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-500 transition shadow">Force Refresh</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 class="text-slate-400 font-medium mb-2">Total Students</h3>
                    <div id="stat-students" class="text-3xl font-bold text-blue-400">-</div>
                </div>
                <div class="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 class="text-slate-400 font-medium mb-2">Total Attempts</h3>
                    <div id="stat-attempts" class="text-3xl font-bold text-pink-400">-</div>
                </div>
                <div class="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 class="text-slate-400 font-medium mb-2">Completion Rate</h3>
                    <div id="stat-completion" class="text-3xl font-bold text-green-400">-</div>
                </div>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-slate-700">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900 text-slate-300 border-b border-slate-700">
                                <th class="p-4 font-semibold">Time</th>
                                <th class="p-4 font-semibold">Student Name</th>
                                <th class="p-4 font-semibold">Activity Title</th>
                                <th class="p-4 font-semibold text-center">Attempt</th>
                                <th class="p-4 font-semibold text-center">Status</th>
                                <th class="p-4 font-semibold">Details</th>
                            </tr>
                        </thead>
                        <tbody id="teacher-table-body" class="divide-y divide-slate-700/50">
                            <tr><td colspan="6" class="p-8 text-center text-slate-500">Loading student data...</td></tr>
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
        if (lines.length <= 1) { document.getElementById('teacher-table-body').innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500 italic">No student data recorded yet.</td></tr>`; return; }
        const dataRows = lines.slice(1).filter(line => line.trim().length > 0);
        dataRows.reverse();
        const uniqueStudents = new Set(); let completions = 0; let html = '';
        
        dataRows.forEach(row => {
            const cols = parseCSVRow(row);
            if (cols.length >= 5) {
                const dateRaw = cols[0]; const name = cols[1]; const gameId = cols[2]; const attempt = cols[3] || '1'; const status = cols[4]; const details = cols[5] || '';
                uniqueStudents.add(name); if (status.toLowerCase() === 'completed') completions++;
                
                let statusBadge = status.toLowerCase() === 'completed' ? '<span class="px-3 py-1 bg-green-900/50 text-green-400 border border-green-800 rounded-full text-sm font-medium">Completed</span>' : '<span class="px-3 py-1 bg-yellow-900/50 text-yellow-400 border border-yellow-800 rounded-full text-sm font-medium">Attempted</span>';
                const formattedTime = new Date(dateRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                let formattedDetails = details ? details.split(' | ').map(detail => {
                    if (detail.includes('Incorrect')) return `<span class="text-red-400">${detail}</span>`;
                    if (detail.includes('Correct')) return `<span class="text-green-400">${detail}</span>`;
                    return detail;
                }).join('<br>') : '';
                
                html += `
                    <tr class="hover:bg-slate-700/30 transition text-slate-300">
                        <td class="p-4 text-sm text-slate-400 whitespace-nowrap">${formattedTime}</td>
                        <td class="p-4 font-medium text-slate-200">${name}</td>
                        <td class="p-4 text-slate-300">${gameId}</td>
                        <td class="p-4 text-center font-bold text-slate-400">${attempt}</td>
                        <td class="p-4 text-center">${statusBadge}</td>
                        <td class="p-4 text-sm">${formattedDetails}</td>
                    </tr>
                `;
            }
        });
        document.getElementById('teacher-table-body').innerHTML = html;
        document.getElementById('stat-students').innerText = uniqueStudents.size;
        document.getElementById('stat-attempts').innerText = dataRows.length;
        document.getElementById('stat-completion').innerText = `${dataRows.length > 0 ? Math.round((completions / dataRows.length) * 100) : 0}%`;
        document.getElementById('last-refresh').innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) { console.error('Error fetching teacher data:', error); }
}
