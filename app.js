const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];
const TEACHER_PIN = "@pple";

let libraryData = [];
let studentName = "";
let currentActivity = null;

// --- Core Startup ---
document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    loadLibrary();
    
    // Hide old tab buttons (we use the neon toggle now!)
    const tabStudent = document.getElementById('tab-student');
    if(tabStudent) tabStudent.style.display = 'none';
    const tabTeacher = document.getElementById('tab-teacher');
    if(tabTeacher) tabTeacher.style.display = 'none';
    const tabBar = document.getElementById('tab-bar');
    if(tabBar) tabBar.style.display = 'none'; 
});

// --- Inject Styles ---
function injectStyles() {
  if (document.getElementById('paragraph-builder-styles')) return;
  const style = document.createElement('style');
  style.id = 'paragraph-builder-styles';
  style.innerHTML = `
    /* --- ORIGINAL STYLES --- */
    .legend-box { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 16px; background: rgba(30, 41, 59, 0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
    .legend-tag { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; font-weight: 600; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
    .hint-btn-small { background: rgba(255,255,255,0.7); border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .hint-btn-small:hover { background: #fff; transform: scale(1.1); }
    .paragraph-builder { line-height: 2.2; font-size: 1.1rem; background: rgba(255,255,255,0.05); padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: left; color: #f8fafc; }
    .paragraph-slot { display: inline-block; min-width: 140px; height: 1.8rem; vertical-align: middle; margin: 4px; border: 2px dashed rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); border-radius: 4px; transition: all 0.2s; }
    .paragraph-slot.drag-over { border-color: #f9a8d4; background: rgba(249, 168, 212, 0.1); transform: scale(1.02); }
    .paragraph-slot.filled { border: none !important; background: transparent !important; margin: 0 4px; min-width: auto; height: auto; display: inline; }
    .sentence-chip.in-paragraph { display: inline; padding: 4px 8px; border-radius: 4px; border: none !important; box-shadow: none !important; font-weight: 500; color: #0f172a !important; cursor: pointer; transition: background 0.2s; }
    
    /* NO MORE GREEN OUTLINE OR JAGGED BORDERS! */
    .sentence-chip.locked, .gap-chip.locked { pointer-events: none; outline: none !important; }
    
    /* Gap Fill Specific Styles */
    .gap-fill-box { line-height: 2.8; font-size: 1.15rem; background: rgba(255,255,255,0.05); padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: left; color: #f8fafc; }
    .gap-slot { display: inline-flex; align-items: center; justify-content: center; min-width: 110px; height: 34px; vertical-align: middle; margin: 0 6px; border: 2px dashed rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); border-radius: 4px; transition: all 0.2s; padding: 0 4px; }
    .gap-slot.drag-over { border-color: #f9a8d4; background: rgba(249, 168, 212, 0.1); transform: scale(1.05); }
    .gap-slot.filled { border: none !important; background: transparent !important; margin: 0 4px; min-width: auto; height: auto; display: inline; }
    .gap-chip { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; color: #0f172a !important; cursor: pointer; transition: background 0.2s; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: none !important; margin: 0 !important; }
    .hint-btn-inline { background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-left: 4px; vertical-align: middle; transition: transform 0.2s; padding: 0; }
    .hint-btn-inline:hover { transform: scale(1.2); }
    
    /* Loading Spinner Animation */
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    /* Sticky Pool, Auto-Width Chips, Gap Row Bleed Style */
    #choice-pool { min-height: 150px; padding-bottom: 20px; position: sticky; top: 2rem; align-self: start; max-height: 85vh; overflow-y: auto; }
    .sentence-chip:not(.in-paragraph) { display: block; width: fit-content; max-width: 100%; border-radius: 8px; /* Fixed: Not circle */ }
    .gap-row { display: flex; align-items: center; flex-wrap: wrap; padding: 8px 12px; border-radius: 8px; transition: all 0.3s ease; border: 1px solid transparent; }

    /* --- NEW UPGRADES (Scrollbars, Shimmer, Shake, Glow-Up, Spacing) --- */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: rgba(30, 30, 46, 0.5); border-radius: 5px; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #ec4899, #8b5cf6); border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #f472b6, #a78bfa); }

    #btn-check { position: relative; overflow: hidden; border: none; margin-top: 30px !important; }
    #btn-check::after {
        content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
        background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
        transform: rotate(30deg); animation: shimmer 3s infinite linear; pointer-events: none;
    }
    @keyframes shimmer { 0% { transform: translateX(-100%) rotate(30deg); } 100% { transform: translateX(100%) rotate(30deg); } }

    @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-6px);} 75% {transform: translateX(6px);} }
    .shake-error { animation: shake 0.4s ease-in-out; background-color: #fca5a5 !important; color: #7f1d1d !important; }

    #results-table { width: 100%; border-collapse: collapse; margin-top: 15px; color: #e2e8f0; font-size: 0.95rem; }
    #results-table th { background: rgba(139, 92, 246, 0.2); padding: 12px; text-align: left; border-bottom: 2px solid #ec4899; color: #f9a8d4; }
    #results-table td { padding: 12px; border-bottom: 1px solid rgba(139, 92, 246, 0.2); transition: background 0.2s; }
    #results-table tbody tr:hover { background: rgba(236, 72, 153, 0.15); }
    
    .sentence-chip, .gap-chip {
        height: auto !important;
        white-space: normal !important;
        text-align: left !important;
        line-height: 1.5 !important;
        padding: 12px 16px !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }
    
    .paragraph-slot, .gap-slot {
        height: auto !important;
        min-height: 46px !important;
        max-width: 100% !important;
        white-space: normal !important;
        display: inline-block;
        vertical-align: middle;
        box-sizing: border-box !important;
    }
    
    #text-container { overflow-x: hidden !important; }
  `;
  document.head.appendChild(style);
}

// --- CSV Loading ---
function loadLibrary() {
    fetch(LIBRARY_CSV_URL)
        .then(response => response.text())
        .then(csvText => {
            libraryData = parseCSV(csvText);
            libraryData = processInheritance(libraryData);
            console.log("Library Loaded:", libraryData);
        })
        .catch(err => {
            console.error("Error loading CSV:", err);
            alert("Failed to load activity library. Check console.");
        });
}

function parseCSV(text) {
    const rows = text.split('\n').filter(r => r.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVRow(rows[i]);
        if (cols.length === headers.length) {
            const rowObj = {};
            headers.forEach((h, idx) => rowObj[h] = cols[idx].trim());
            data.push(rowObj);
        }
    }
    return data;
}

function parseCSVRow(row) {
    const cols = [];
    let inQuotes = false;
    let col = '';
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && row[i+1] === '"') { col += '"'; i++; }
        else if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { cols.push(col); col = ''; }
        else { col += char; }
    }
    cols.push(col);
    return cols;
}

function processInheritance(data) {
    let currentTitle = "", currentType = "", currentOverallHint = "", currentStatus = "";
    data.forEach(row => {
        if (row.Title) currentTitle = row.Title; else row.Title = currentTitle;
        if (row.Type) currentType = row.Type; else row.Type = currentType;
        if (row.Overall_Hint) currentOverallHint = row.Overall_Hint; else row.Overall_Hint = currentOverallHint;
        
        if (row.Status && row.Status.toLowerCase() === 'distractor') {
            // Keep as distractor
        } else if (row.Status) {
            currentStatus = row.Status;
        } else {
            row.Status = currentStatus;
        }
    });
    return data;
}

// --- View Navigation ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function studentSignIn() {
    const nameInput = document.getElementById('student-name').value.trim();
    if (!nameInput) {
        alert("Please enter your name!");
        return;
    }
    studentName = nameInput;
    renderActivityList();
    switchScreen('activity-list');
}

function promptTeacherLogin() {
    const pin = prompt("Enter Teacher PIN:");
    if (pin === TEACHER_PIN) {
        switchScreen('teacher-dashboard');
        refreshTeacherData();
        // Start auto-refresh
        window.teacherInterval = setInterval(refreshTeacherData, 15000);
    } else if (pin !== null) {
        alert("Incorrect PIN");
    }
}

function exitTeacherMode() {
    clearInterval(window.teacherInterval);
    switchScreen('student-login');
}

function renderActivityList() {
    const container = document.getElementById('activities-container');
    container.innerHTML = '';
    
    const activities = [...new Set(libraryData.map(r => r.Title))];
    
    activities.forEach(title => {
        const btn = document.createElement('div');
        btn.className = 'activity-card';
        btn.innerHTML = `<h3>${title}</h3>`;
        btn.onclick = () => loadActivity(title);
        container.appendChild(btn);
    });
}

// --- Activity Engine ---
function loadActivity(title) {
    const activityRows = libraryData.filter(r => r.Title === title);
    if(activityRows.length === 0) return;
    
    currentActivity = { Title: title, rows: activityRows };
    window.currentAttempt = 0;
    
    document.getElementById('activity-title').innerText = title;
    
    const type = activityRows[0].Type ? activityRows[0].Type.toLowerCase() : "";
    const isCategorisation = type.includes("categorisation") || type.includes("categorize");
    
    const hasOverallHint = activityRows.some(r => r.Overall_Hint);
    const overallHintBtn = document.getElementById('btn-overall-hint');
    if (hasOverallHint) {
        overallHintBtn.style.display = 'inline-block';
        overallHintBtn.onclick = () => alert("Overall Hint: " + activityRows.find(r => r.Overall_Hint).Overall_Hint);
    } else {
        overallHintBtn.style.display = 'none';
    }

    const choicePool = document.getElementById('choice-pool');
    const textContainer = document.getElementById('text-container');
    choicePool.innerHTML = '';
    textContainer.innerHTML = '';

    let validChoices = [];
    let distractors = [];
    
    // --- Setup UI based on Type ---
    if (isCategorisation) {
        // CATEGORISATION MODE (Labels match Parts)
        document.getElementById('activity-instruction').innerText = "Drag the labels into the correct spaces to categorize the text.";
        
        const legendDiv = document.createElement('div');
        legendDiv.className = 'legend-box';
        
        const paragraphDiv = document.createElement('div');
        paragraphDiv.className = 'paragraph-builder';
        
        let labelIndex = 0;
        
        activityRows.forEach((row, i) => {
            if (row.Status && row.Status.toLowerCase() === 'distractor') {
                distractors.push({ id: `dist_${i}`, text: row.Label || row.Text, isDistractor: true });
                return;
            }
            
            const labelColor = COLORS[labelIndex % COLORS.length];
            
            const legendTag = document.createElement('div');
            legendTag.className = 'legend-tag';
            legendTag.style.backgroundColor = labelColor;
            legendTag.innerHTML = `${i+1}. ${row.Label}`;
            
            if (row.Hint) {
                const hintBtn = document.createElement('button');
                hintBtn.className = 'hint-btn-small';
                hintBtn.innerHTML = '💡';
                hintBtn.onclick = () => {
                    alert(`Hint for ${row.Label}: ${row.Hint}`);
                    logAttempt(studentName, title, window.currentAttempt+1, "Hint Used", `Hint for: ${row.Label}`);
                };
                legendTag.appendChild(hintBtn);
            }
            legendDiv.appendChild(legendTag);
            
            const gapRow = document.createElement('div');
            gapRow.className = 'gap-row';
            
            const slot = document.createElement('div');
            slot.className = 'paragraph-slot';
            slot.dataset.answer = `${i+1}. ${row.Label}`;
            slot.dataset.color = labelColor;
            gapRow.appendChild(slot);
            
            const textSpan = document.createElement('span');
            textSpan.style.marginLeft = '8px';
            textSpan.innerHTML = row.Text;
            gapRow.appendChild(textSpan);
            
            paragraphDiv.appendChild(gapRow);
            
            validChoices.push({
                id: `${i+1}. ${row.Label}`,
                text: `${i+1}. ${row.Label}`,
                color: labelColor
            });
            
            labelIndex++;
        });
        
        textContainer.appendChild(legendDiv);
        textContainer.appendChild(paragraphDiv);
        
    } else {
        // STANDARD GAP FILL MODE (Inline)
        document.getElementById('activity-instruction').innerText = "Drag the correct words into the gaps to complete the text.";
        
        const gapFillDiv = document.createElement('div');
        gapFillDiv.className = 'gap-fill-box';
        
        let htmlContent = "";
        let gapCount = 0;
        
        activityRows.forEach((row, i) => {
            if (row.Status && row.Status.toLowerCase() === 'distractor') {
                distractors.push({ id: `dist_${i}`, text: row.Label || row.Text, isDistractor: true });
                return;
            }

            const parts = row.Text.split('___');
            
            if (parts.length > 1) {
                htmlContent += parts[0];
                const labelColor = COLORS[gapCount % COLORS.length];
                const gapId = `gap_${i}`;
                
                let hintHtml = "";
                if (row.Hint) {
                    hintHtml = `<button class="hint-btn-inline" title="Click for hint" onclick="alert('Hint: ${row.Hint.replace(/'/g, "\\'")}'); logAttempt('${studentName}', '${title}', window.currentAttempt+1, 'Hint Used', 'Hint for gap ${gapCount+1}');">💡</button>`;
                }
                
                htmlContent += `<div class="gap-slot" data-answer="${row.Label}" data-color="${labelColor}" id="${gapId}"></div>${hintHtml}`;
                htmlContent += parts[1];
                
                validChoices.push({
                    id: row.Label,
                    text: row.Label,
                    color: labelColor
                });
                gapCount++;
            } else {
                htmlContent += row.Text + " ";
            }
        });
        
        gapFillDiv.innerHTML = htmlContent;
        textContainer.appendChild(gapFillDiv);
    }

    const allChoices = [...validChoices, ...distractors];
    allChoices.sort(() => Math.random() - 0.5);

    allChoices.forEach(choice => {
        const chip = document.createElement('div');
        chip.className = isCategorisation ? 'sentence-chip' : 'gap-chip';
        chip.draggable = true;
        chip.innerText = choice.text;
        chip.dataset.correct = choice.id;
        chip.dataset.isDistractor = choice.isDistractor || false;
        
        if(choice.color && !choice.isDistractor) {
            chip.style.backgroundColor = choice.color;
        } else {
            chip.style.backgroundColor = '#e2e8f0'; // Gray for distractors
        }
        
        setupDragEvents(chip);
        choicePool.appendChild(chip);
    });

    setupDropZones();

    document.getElementById('feedback-message').innerText = '';
    document.getElementById('btn-check').style.display = 'inline-block';
    document.getElementById('btn-retry').style.display = 'none';

    switchScreen('activity-play');
    logAttempt(studentName, title, 1, "Started", "");
}

// --- Drag and Drop Logic ---
let draggedItem = null;

function setupDragEvents(item) {
    item.addEventListener('dragstart', function(e) {
        draggedItem = item;
        setTimeout(() => item.style.opacity = '0.5', 0);
    });
    
    item.addEventListener('dragend', function() {
        setTimeout(() => item.style.opacity = '1', 0);
        draggedItem = null;
    });

    item.addEventListener('click', function() {
        if (item.classList.contains('locked')) return;
        if (item.parentElement.id !== 'choice-pool') {
            document.getElementById('choice-pool').appendChild(item);
            item.classList.remove('in-paragraph');
            const gapRow = item.closest('.gap-row');
            if (gapRow) gapRow.style.backgroundColor = 'transparent';
            item.parentElement.classList.remove('filled');
        }
    });
}

function setupDropZones() {
    const slots = document.querySelectorAll('.paragraph-slot, .gap-slot');
    const pool = document.getElementById('choice-pool');

    slots.forEach(slot => {
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', function(e) {
            e.preventDefault();
            slot.classList.remove('drag-over');
            if (!draggedItem) return;
            
            if (this.children.length > 0) {
                const existingChip = this.children[0];
                pool.appendChild(existingChip);
                existingChip.classList.remove('in-paragraph');
            }
            
            this.appendChild(draggedItem);
            this.classList.add('filled');
            draggedItem.classList.add('in-paragraph');

            // Color bleed for Categorisation mode
            const gapRow = this.closest('.gap-row');
            if (gapRow) {
                const color = draggedItem.style.backgroundColor;
                gapRow.style.backgroundColor = color.replace('rgb', 'rgba').replace(')', ', 0.15)');
            }
        });
    });

    pool.addEventListener('dragover', e => e.preventDefault());
    pool.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!draggedItem) return;
        
        const originalSlot = draggedItem.parentElement;
        if (originalSlot.classList.contains('paragraph-slot') || originalSlot.classList.contains('gap-slot')) {
            const gapRow = originalSlot.closest('.gap-row');
            if (gapRow) gapRow.style.backgroundColor = 'transparent';
            originalSlot.classList.remove('filled');
        }
        
        this.appendChild(draggedItem);
        draggedItem.classList.remove('in-paragraph');
    });
}

// --- Check Answer & Confetti ---
function checkAnswer() {
    const slots = document.querySelectorAll('.gap-slot, .paragraph-slot');
    let correctCount = 0;
    let totalGaps = slots.length;

    slots.forEach(slot => {
        const chip = slot.querySelector('.sentence-chip, .gap-chip');
        if (!chip) return;

        if (chip.dataset.correct === slot.dataset.answer) {
            correctCount++;
            chip.classList.add('locked');
        } else {
            // Shake and turn red!
            chip.classList.add('shake-error');
            setTimeout(() => chip.classList.remove('shake-error'), 400);
            
            document.getElementById('choice-pool').appendChild(chip);
            chip.classList.remove('in-paragraph');
            
            const gapRow = slot.closest('.gap-row');
            if (gapRow) gapRow.style.backgroundColor = 'transparent';
            slot.classList.remove('filled');
        }
    });

    const msg = document.getElementById('feedback-message');
    const btn = document.getElementById('btn-check');
    const retryBtn = document.getElementById('btn-retry');

    if (correctCount === totalGaps) {
        msg.innerHTML = "🎉 Perfect! You completed the activity correctly.";
        msg.style.color = "#4ade80";
        if(btn) btn.style.display = 'none';
        if(retryBtn) retryBtn.style.display = 'inline-block';
        
        // 🎇 FIRE THE CONFETTI CANNON!
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#ec4899', '#8b5cf6', '#4ade80', '#fde047']
            });
        }

        if (currentActivity) {
            const attempt = (window.currentAttempt || 0) + 1;
            logAttempt(studentName, currentActivity.Title, attempt, "Completed", "No incorrect distractors left");
        }
    } else {
        msg.innerHTML = "Not quite! Incorrect answers have been returned to the pool.";
        msg.style.color = "#fca5a5";
        window.currentAttempt = (window.currentAttempt || 0) + 1;
    }
}

function retryActivity() {
    loadActivity(currentActivity.Title);
}

// --- Tracking System ---
function logAttempt(name, gameId, attempt, status, details) {
    if (!name) return;
    const payload = { Name: name, Game_ID: gameId, Attempt: attempt, Status: status, Details: details };
    
    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.log("Tracking error:", err));
}

function refreshTeacherData() {
    const container = document.getElementById('teacher-data');
    container.innerHTML = '<p>Loading latest data...</p>';
    
    const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';

    fetch(TRACKING_CSV_URL + "&t=" + new Date().getTime())
        .then(response => response.text())
        .then(csvText => {
            const data = parseCSV(csvText);
            data.reverse(); 
            
            let tableHtml = '<table id="results-table"><thead><tr><th>Time</th><th>Student</th><th>Activity</th><th>Attempt</th><th>Status</th><th>Details</th></tr></thead><tbody>';
            
            data.forEach(row => {
                let statusClass = '';
                if (row.Status === 'Completed') statusClass = 'status-correct';
                else if (row.Status === 'Started') statusClass = 'status-partial';
                else statusClass = 'status-incorrect';

                tableHtml += `<tr>
                    <td>${row.Timestamp || ''}</td>
                    <td>${row.Name || ''}</td>
                    <td>${row.Game_ID || ''}</td>
                    <td>${row.Attempt || ''}</td>
                    <td class="${statusClass}">${row.Status || ''}</td>
                    <td>${row.Details || ''}</td>
                </tr>`;
            });
            
            tableHtml += '</tbody></table>';
            container.innerHTML = tableHtml;
        })
        .catch(err => {
            container.innerHTML = '<p style="color:red;">Error loading tracking data.</p>';
        });
}
