const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';

const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

let activities = {};
let currentUser = null;
let currentActivity = null;
let currentAttempt = 1;
let hintsUsed = [];
let teacherAuthenticated = false;

document.addEventListener('DOMContentLoaded', init);

function init() {
    fetchLibraryData();

    document.getElementById('start-btn').addEventListener('click', startActivity);
    document.getElementById('check-btn').addEventListener('click', checkAnswer);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('show-hint-btn').addEventListener('click', showOverallHint);
    
    document.getElementById('teacher-login-btn').addEventListener('click', handleTeacherLogin);
    document.getElementById('refresh-data-btn').addEventListener('click', loadTrackingData);
    
    // NEON TOGGLE LOGIC
    document.getElementById('teacher-toggle').addEventListener('change', (e) => {
        if(e.target.checked) {
            // Show Teacher
            document.getElementById('sign-in-screen').classList.add('hidden-section');
            document.getElementById('game-area').classList.add('hidden-section');
            document.getElementById('teacher-dashboard').classList.remove('hidden-section');
            if(teacherAuthenticated) loadTrackingData();
        } else {
            // Hide Teacher, go back to appropriate student view
            document.getElementById('teacher-dashboard').classList.add('hidden-section');
            if(currentUser && currentActivity) {
                document.getElementById('game-area').classList.remove('hidden-section');
            } else {
                document.getElementById('sign-in-screen').classList.remove('hidden-section');
            }
        }
    });

    setInterval(() => {
        if (teacherAuthenticated && !document.getElementById('teacher-dashboard').classList.contains('hidden-section')) {
            loadTrackingData();
        }
    }, 15000);
}

async function fetchLibraryData() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const csvText = await response.text();
        parseLibraryCSV(csvText);
        populateActivityDropdown();
        document.getElementById('loading').classList.add('hidden-section');
        // Only show sign-in if teacher toggle is OFF
        if(!document.getElementById('teacher-toggle').checked) {
            document.getElementById('sign-in-screen').classList.remove('hidden-section');
        }
    } catch (error) {
        showError("Failed to load activities. Please check your connection.");
    }
}

function parseLibraryCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const titleIdx = headers.indexOf('Title');
    const typeIdx = headers.indexOf('Type');
    const textIdx = headers.indexOf('Text');
    const labelIdx = headers.indexOf('Label');
    const hintIdx = headers.indexOf('Hint');
    const overallHintIdx = headers.indexOf('Overall_Hint');
    const statusIdx = headers.indexOf('Status');

    let currentTitle = "";
    let currentType = "";
    let currentOverallHint = "";

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        let row = [];
        let inQuotes = false;
        let currentCell = '';
        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        row.push(currentCell.trim());

        const title = row[titleIdx] || currentTitle;
        const type = row[typeIdx] || currentType;
        const text = row[textIdx];
        const label = row[labelIdx];
        const hint = row[hintIdx];
        const overallHint = row[overallHintIdx] || currentOverallHint;
        const status = row[statusIdx];

        if (row[titleIdx]) currentTitle = row[titleIdx];
        if (row[typeIdx]) currentType = row[typeIdx];
        if (row[overallHintIdx]) currentOverallHint = row[overallHintIdx];

        if (!title || (!text && !label && !status)) continue;

        if (!activities[title]) {
            activities[title] = {
                title: title,
                type: type,
                overallHint: overallHint,
                parts: []
            };
        }

        if (status && status.toLowerCase() === 'distractor') {
            activities[title].parts.push({
                isDistractor: true,
                label: label,
                hint: hint
            });
        } else if (text || label) {
            activities[title].parts.push({
                isDistractor: false,
                text: text,
                label: label,
                hint: hint
            });
        }
    }
}

function populateActivityDropdown() {
    const select = document.getElementById('activity-selector');
    Object.keys(activities).forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        select.appendChild(option);
    });
}

function startActivity() {
    const name = document.getElementById('student-name').value.trim();
    const activityTitle = document.getElementById('activity-selector').value;

    if (!name || !activityTitle) {
        alert("Please enter your name and select an activity.");
        return;
    }

    currentUser = name;
    currentActivity = activities[activityTitle];
    currentAttempt = 1;
    hintsUsed = [];

    document.getElementById('sign-in-screen').classList.add('hidden-section');
    document.getElementById('game-area').classList.remove('hidden-section');
    
    document.getElementById('student-display-name').textContent = `Student: ${currentUser}`;
    document.getElementById('activity-title').textContent = currentActivity.title;
    
    const hintEl = document.getElementById('overall-hint');
    const hintBtn = document.getElementById('show-hint-btn');
    if (currentActivity.overallHint) {
        hintEl.textContent = "Overall Hint: " + currentActivity.overallHint;
        hintEl.classList.add('hidden');
        hintBtn.classList.remove('hidden');
        hintBtn.textContent = 'Show Hint';
    } else {
        hintEl.classList.add('hidden');
        hintBtn.classList.add('hidden');
    }

    document.getElementById('feedback').className = '';
    document.getElementById('feedback').textContent = '';

    renderActivity();
}

function showOverallHint() {
    document.getElementById('overall-hint').classList.remove('hidden');
    document.getElementById('show-hint-btn').classList.add('hidden');
    if (!hintsUsed.includes('Overall Hint')) hintsUsed.push('Overall Hint');
}

function renderActivity() {
    const container = document.getElementById('activity-container');
    container.innerHTML = '';
    
    const typeLower = currentActivity.type ? currentActivity.type.toLowerCase() : "";
    
    if (typeLower.includes('categorisation') || typeLower.includes('categorize')) {
        renderCategorisation(container);
    } else {
        renderStandardGapFill(container);
    }
    setupDragAndDrop();
}

// FORMAT 1: Categorisation (Colour Bleed, Left/Right Split)
function renderCategorisation(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col md:flex-row gap-8';
    
    // Left Pool
    const leftCol = document.createElement('div');
    leftCol.className = 'w-full md:w-1/3 flex flex-col gap-4 border-r border-indigo-500/30 pr-6';
    leftCol.id = 'category-pool';
    
    let labels = currentActivity.parts.map(p => ({ label: p.label, hint: p.hint }));
    labels = labels.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i && v.label);
    
    labels.forEach((item, index) => {
        const color = COLORS[index % COLORS.length];
        
        const legendBox = document.createElement('div');
        legendBox.className = 'p-4 rounded-lg bg-indigo-900/40 border border-indigo-400/30 flex flex-col items-center shadow-md';
        legendBox.id = `legend-${index}`;
        
        const labelEl = document.createElement('div');
        labelEl.className = 'draggable-chip'; 
        labelEl.textContent = item.label;
        labelEl.draggable = true;
        labelEl.dataset.label = item.label;
        labelEl.dataset.color = color;
        labelEl.style.backgroundColor = color;
        
        legendBox.appendChild(labelEl);
        
        if (item.hint) {
            const btn = document.createElement('button');
            btn.textContent = 'Hint';
            btn.className = 'mt-2 text-xs text-pink-300 hover:text-pink-200 underline';
            btn.onclick = () => {
                alert(`Hint for ${item.label}: ${item.hint}`);
                if (!hintsUsed.includes(item.label)) hintsUsed.push(item.label);
            };
            legendBox.appendChild(btn);
        }
        leftCol.appendChild(legendBox);
    });

    // Right Content
    const rightCol = document.createElement('div');
    rightCol.className = 'w-full md:w-2/3 flex flex-col gap-4';
    
    currentActivity.parts.forEach((part, index) => {
        if (part.isDistractor) return; 
        
        const block = document.createElement('div');
        block.className = 'p-4 rounded-lg bg-indigo-900/20 border border-indigo-500/20 flex items-start transition-colors duration-300 shadow-sm';
        
        const slot = document.createElement('div');
        slot.className = 'drop-slot mr-4 flex-shrink-0 bg-indigo-950/50';
        slot.dataset.correct = part.label;
        slot.dataset.index = index;
        slot.dataset.type = 'categorisation';
        
        const textEl = document.createElement('div');
        textEl.className = 'text-white flex-grow pt-1';
        textEl.textContent = part.text;
        
        block.appendChild(slot);
        block.appendChild(textEl);
        rightCol.appendChild(block);
    });

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);
    container.appendChild(wrapper);
}

// FORMAT 2: Standard Gap-Fill (Inline flow, no colour bleed)
function renderStandardGapFill(container) {
    // Top Pool
    const topPool = document.createElement('div');
    topPool.className = 'flex flex-wrap gap-4 mb-8 p-6 rounded-lg bg-indigo-900/40 border border-indigo-500/30 min-h-[80px] shadow-md';
    topPool.id = 'category-pool';
    
    let labels = currentActivity.parts.map(p => ({ label: p.label, hint: p.hint }));
    // Shuffle labels randomly
    labels = labels.sort(() => Math.random() - 0.5);
    
    labels.forEach((item, index) => {
        if(!item.label) return;
        const color = COLORS[index % COLORS.length];
        
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-col items-center';

        const labelEl = document.createElement('div');
        labelEl.className = 'draggable-chip';
        labelEl.textContent = item.label;
        labelEl.draggable = true;
        labelEl.dataset.label = item.label;
        labelEl.dataset.color = color;
        labelEl.style.backgroundColor = color;
        
        wrap.appendChild(labelEl);
        
        if (item.hint) {
            const btn = document.createElement('button');
            btn.textContent = 'Hint';
            btn.className = 'mt-1 text-xs text-pink-300 hover:text-pink-200 underline';
            btn.onclick = () => {
                alert(`Hint: ${item.hint}`);
                if (!hintsUsed.includes(item.label)) hintsUsed.push(item.label);
            };
            wrap.appendChild(btn);
        }
        topPool.appendChild(wrap);
    });

    container.appendChild(topPool);

    // Flowing Text Area
    const textContainer = document.createElement('div');
    textContainer.className = 'text-white p-8 rounded-lg bg-indigo-900/20 border border-indigo-500/20 leading-loose text-xl shadow-sm';
    
    currentActivity.parts.forEach((part, index) => {
        if (part.isDistractor) return;

        if (part.text && part.text.includes('___')) {
            const parts = part.text.split('___');
            
            const span1 = document.createElement('span');
            span1.textContent = parts[0];
            textContainer.appendChild(span1);
            
            const slot = document.createElement('span');
            slot.className = 'drop-slot mx-2 bg-indigo-950/50';
            slot.dataset.correct = part.label;
            slot.dataset.index = index;
            slot.dataset.type = 'inline';
            textContainer.appendChild(slot);
            
            const span2 = document.createElement('span');
            span2.textContent = parts[1] + " ";
            textContainer.appendChild(span2);

        } else if (part.text) {
            const span = document.createElement('span');
            span.textContent = part.text + " ";
            textContainer.appendChild(span);
        }
    });

    container.appendChild(textContainer);
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-chip');
    const slots = document.querySelectorAll('.drop-slot');
    const pool = document.getElementById('category-pool');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    slots.forEach(slot => {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            if (slot.children.length === 0) {
                slot.classList.add('drag-over');
            }
        });
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            const draggable = document.querySelector('.dragging');
            
            if (slot.children.length === 0 && draggable) {
                slot.appendChild(draggable);
                slot.style.border = 'none'; 
                
                // If categorisation, colour bleed the parent block
                if (slot.dataset.type === 'categorisation') {
                    const block = slot.parentElement;
                    block.style.backgroundColor = draggable.dataset.color;
                    block.style.color = '#111827'; // Dark text
                    block.querySelector('.text-white')?.classList.replace('text-white', 'text-gray-900');
                }
            }
        });
    });

    // Allow dragging back to pool
    if(pool) {
        pool.addEventListener('dragover', e => e.preventDefault());
        pool.addEventListener('drop', e => {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            if (draggable && draggable.parentElement.classList.contains('drop-slot')) {
                const oldSlot = draggable.parentElement;
                
                // Revert categorisation colour bleed
                if (oldSlot.dataset.type === 'categorisation') {
                    const block = oldSlot.parentElement;
                    block.style.backgroundColor = '';
                    block.style.color = '';
                    block.querySelector('.text-gray-900')?.classList.replace('text-gray-900', 'text-white');
                }
                
                oldSlot.style.border = '';
                
                // Put back in pool (find matching legend or just append to pool)
                if (oldSlot.dataset.type === 'categorisation') {
                    const matchBoxes = pool.querySelectorAll('div[id^="legend-"]');
                    let placed = false;
                    matchBoxes.forEach(box => {
                        if (!box.querySelector('.draggable-chip') && box.innerHTML.includes(draggable.dataset.label)) {
                            box.insertBefore(draggable, box.firstChild);
                            placed = true;
                        }
                    });
                    if(!placed) pool.appendChild(draggable);
                } else {
                    // Just put it back in the top flex box
                    const wraps = pool.querySelectorAll('div.flex-col');
                    let placed = false;
                    wraps.forEach(w => {
                        if(!w.querySelector('.draggable-chip') && w.innerHTML.includes(draggable.dataset.label)){
                            w.insertBefore(draggable, w.firstChild);
                            placed = true;
                        }
                    });
                    if(!placed) pool.appendChild(draggable);
                }
            }
        });
    }
}

function checkAnswer() {
    const slots = document.querySelectorAll('.drop-slot');
    const pool = document.getElementById('category-pool');
    let allCorrect = true;
    let isComplete = true;

    slots.forEach(slot => {
        const chip = slot.querySelector('.draggable-chip');
        if (!chip) {
            isComplete = false;
            allCorrect = false;
        } else if (chip.dataset.label !== slot.dataset.correct) {
            allCorrect = false;
            // Throw incorrect back to pool
            chip.classList.add('shake');
            setTimeout(() => {
                chip.classList.remove('shake');
                
                // Revert styling
                if (slot.dataset.type === 'categorisation') {
                    const block = slot.parentElement;
                    block.style.backgroundColor = '';
                    block.querySelector('.text-gray-900')?.classList.replace('text-gray-900', 'text-white');
                }
                slot.style.border = '';
                
                // Return to pool
                const wraps = pool.querySelectorAll('div.flex-col, div[id^="legend-"]');
                let placed = false;
                wraps.forEach(w => {
                    if(!w.querySelector('.draggable-chip') && w.innerHTML.includes(chip.dataset.label)){
                        w.insertBefore(chip, w.firstChild);
                        placed = true;
                    }
                });
                if(!placed) pool.appendChild(chip);

            }, 500);
        }
    });

    const hasDistractors = currentActivity.parts.some(p => p.isDistractor);
    const feedback = document.getElementById('feedback');

    let statusStr = "";

    if (!isComplete && !hasDistractors) {
        feedback.textContent = "Please fill all slots before checking.";
        feedback.className = "text-yellow-400 text-xl font-bold";
        statusStr = "Incomplete";
    } else if (allCorrect) {
        feedback.textContent = "Perfect! Great job.";
        feedback.className = "text-green-400 text-xl font-bold drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]";
        statusStr = "Completed";
        document.getElementById('check-btn').classList.add('hidden');
    } else {
        feedback.textContent = "Not quite. Incorrect ones have returned to the pool.";
        feedback.className = "text-red-400 text-xl font-bold";
        statusStr = "Attempted (Partial)";
    }

    sendTrackingData(statusStr);
    currentAttempt++;
}

function sendTrackingData(status) {
    const hintStr = hintsUsed.length > 0 ? "Hints: " + hintsUsed.join(', ') : "No hints used";
    
    const params = new URLSearchParams({
        name: currentUser,
        game_id: currentActivity.title,
        attempt: currentAttempt,
        status: status,
        details: hintStr
    });

    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    }).catch(e => console.error('Tracking Error:', e));
}

function logout() {
    currentUser = null;
    currentActivity = null;
    document.getElementById('game-area').classList.add('hidden-section');
    document.getElementById('sign-in-screen').classList.remove('hidden-section');
    document.getElementById('student-name').value = '';
    document.getElementById('activity-selector').value = '';
    document.getElementById('check-btn').classList.remove('hidden');
}

function showError(msg) {
    const err = document.getElementById('error-message');
    err.textContent = msg;
    err.classList.remove('hidden-section');
}

// --- Teacher Dashboard Logic ---
function handleTeacherLogin() {
    const pin = document.getElementById('teacher-pin').value;
    if (pin === '@pple') {
        teacherAuthenticated = true;
        document.getElementById('teacher-auth').classList.add('hidden');
        document.getElementById('teacher-controls').classList.remove('hidden');
        document.getElementById('teacher-content').classList.remove('hidden');
        loadTrackingData();
    } else {
        alert("Incorrect PIN");
    }
}

async function loadTrackingData() {
    try {
        const response = await fetch(TRACKING_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        const tbody = document.getElementById('tracking-data-body');
        tbody.innerHTML = '';
        
        // Skip header (i=0) and print reversed (newest first)
        for (let i = lines.length - 1; i > 0; i--) {
            if (!lines[i].trim()) continue;
            
            let row = [];
            let inQuotes = false;
            let currentCell = '';
            for (let char of lines[i]) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) { row.push(currentCell.trim()); currentCell = ''; }
                else currentCell += char;
            }
            row.push(currentCell.trim());

            if (row.length < 6) continue;

            const tr = document.createElement('tr');
            tr.className = 'border-b border-indigo-500/20 hover:bg-indigo-900/30 transition-colors text-indigo-100';
            
            // Expected: Timestamp | Name | Game_ID (Title) | Attempt | Status | Details
            for (let j = 0; j < 6; j++) {
                const td = document.createElement('td');
                td.className = 'p-4';
                
                if (j === 0) { // Format Timestamp slightly nicer
                    const d = new Date(row[j]);
                    td.textContent = isNaN(d) ? row[j] : d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (j === 4) { // Color code status
                    const statusText = row[j];
                    const span = document.createElement('span');
                    span.textContent = statusText;
                    span.className = 'px-2 py-1 rounded-full text-sm font-semibold ';
                    if(statusText.includes('Completed')) span.className += 'bg-green-900/50 text-green-300';
                    else if(statusText.includes('Attempted')) span.className += 'bg-yellow-900/50 text-yellow-300';
                    else span.className += 'bg-gray-800 text-gray-300';
                    td.appendChild(span);
                } else {
                    td.textContent = row[j] || '-';
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    } catch (e) {
        console.error("Failed to load tracking data", e);
    }
}
