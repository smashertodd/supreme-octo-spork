// ==========================================
// CONFIGURATION & SETUP
// ==========================================
const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';
const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

window.activities = [];
window.currentActivity = null;
window.appState = 'student';

let currentStudentName = localStorage.getItem('studentName') || '';

// ==========================================
// NEON CSS STYLES (Guarantees soft corners and glowing borders)
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    .draggable-chip {
        display: inline-block;
        padding: 12px 20px;
        margin: 8px;
        background: rgba(30, 30, 46, 0.9);
        color: #e2e8f0;
        border-radius: 8px !important; /* No circles! */
        cursor: grab;
        font-weight: 600;
        font-size: 1.05rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        user-select: none;
        border-left: 5px solid;
    }
    .draggable-chip:active { cursor: grabbing; transform: scale(0.95); }
    .drop-zone {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 150px;
        min-height: 45px;
        margin: 0 8px;
        border: 2px dashed rgba(165, 180, 252, 0.5);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.3);
        vertical-align: middle;
        transition: all 0.3s ease;
    }
    .drop-zone.drag-over {
        background: rgba(165, 180, 252, 0.2);
        border-color: #a5b4fc;
        box-shadow: 0 0 15px rgba(165, 180, 252, 0.4);
    }
    .drop-zone .draggable-chip {
        margin: 0;
        border: none !important;
        box-shadow: 0 0 10px rgba(255,255,255,0.2);
    }
    .drop-zone.filled {
        border: none;
        background: transparent;
        padding: 0;
    }
    .glass-panel {
        background: rgba(30, 30, 46, 0.6);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        width: 100%;
        box-sizing: border-box;
    }
`;
document.head.appendChild(style);

// ==========================================
// NEON MODAL SYSTEM (Replaces ugly alerts)
// ==========================================
function showNeonModal(titleText, bodyHTML, isInput = false, callback = null) {
    let overlay = document.getElementById('neon-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'neon-modal-overlay';
        overlay.style.cssText = `display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; padding: 20px; box-sizing: border-box;`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && !overlay.dataset.isInput) closeNeonModal();
        });
    }

    overlay.dataset.isInput = isInput ? "true" : "";

    let content = `
        <div id="neon-modal-box" style="background: rgba(30, 30, 46, 0.95); border: 2px solid ${isInput ? '#8b5cf6' : '#ec4899'}; box-shadow: 0 0 30px ${isInput ? 'rgba(139, 92, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)'}; border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; text-align: center; transform: scale(0.8); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <h3 style="margin-top: 0; color: ${isInput ? '#c4b5fd' : '#f9a8d4'}; text-shadow: 0 0 15px ${isInput ? '#8b5cf6' : '#ec4899'}; margin-bottom: 25px; font-size: 2.2rem;">${titleText}</h3>
            <div style="color: #e2e8f0; font-size: 1.2rem; line-height: 1.6; margin-bottom: ${isInput ? '30px' : '35px'};">${bodyHTML}</div>
            ${isInput ? `
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="closeNeonModal()" style="padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: white; cursor: pointer;">Cancel</button>
                    <button id="neon-modal-submit" style="padding: 12px 24px; border-radius: 8px; border: none; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; cursor: pointer; font-weight: bold; box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);">Submit</button>
                </div>
            ` : `<small style="display: block; color: #8b5cf6; font-size: 1rem; opacity: 0.9; font-style: italic; cursor: pointer;" onclick="closeNeonModal()">(Click anywhere to close)</small>`}
        </div>
    `;

    overlay.innerHTML = content;
    overlay.style.display = 'flex';

    if (isInput) {
        const inputField = overlay.querySelector('input');
        if (inputField) {
            setTimeout(() => inputField.focus(), 100);
            inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('neon-modal-submit').click(); });
        }
        document.getElementById('neon-modal-submit').onclick = () => {
            const val = inputField ? inputField.value : null;
            closeNeonModal();
            if (callback) callback(val);
        };
    }

    setTimeout(() => {
        overlay.style.opacity = '1';
        document.getElementById('neon-modal-box').style.transform = 'scale(1)';
    }, 10);
}

function closeNeonModal() {
    const overlay = document.getElementById('neon-modal-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        const box = document.getElementById('neon-modal-box');
        if (box) box.style.transform = 'scale(0.8)';
        setTimeout(() => overlay.style.display = 'none', 300);
        
        // Reset toggle if PIN was cancelled
        const toggle = document.getElementById('teacher-toggle-checkbox');
        if (toggle && window.appState !== 'teacher') toggle.checked = false;
    }
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadData() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const data = await response.text();
        window.activities = parseCSV(data);
        renderApp();
    } catch (error) {
        document.getElementById('app').innerHTML = '<h2 style="color: #fca5a5; text-align:center;">Failed to load activities. Please refresh.</h2>';
    }
}

function parseCSV(str) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const nextChar = str[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') { currentCell += '"'; i++; } 
            else { insideQuotes = !insideQuotes; }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const activitiesMap = {};
    let currentTitle = '';
    let currentType = '';
    let currentOverallHint = '';

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length && row.join('').trim() === '') continue;

        const rowObj = {};
        headers.forEach((header, index) => { rowObj[header] = row[index] || ''; });

        if (rowObj.title && rowObj.title.trim() !== '') {
            currentTitle = rowObj.title.trim();
            currentType = rowObj.type ? rowObj.type.trim() : '';
            currentOverallHint = rowObj.overall_hint ? rowObj.overall_hint.trim() : '';
        }

        if (!currentTitle) continue;

        if (!activitiesMap[currentTitle]) {
            activitiesMap[currentTitle] = {
                title: currentTitle,
                type: currentType,
                overallHint: currentOverallHint,
                items: []
            };
        }

        const isDistractor = (rowObj.status && rowObj.status.toLowerCase().includes('distractor')) || 
                             (rowObj.type && rowObj.type.toLowerCase().includes('distractor'));

        if ((rowObj.text && rowObj.text.trim() !== '') || (rowObj.label && rowObj.label.trim() !== '')) {
            activitiesMap[currentTitle].items.push({
                text: rowObj.text ? rowObj.text.trim() : '',
                label: rowObj.label ? rowObj.label.trim() : '',
                hint: rowObj.hint ? rowObj.hint.trim() : '',
                isDistractor: isDistractor,
                type: currentType
            });
        }
    }

    return Object.values(activitiesMap);
}

// ==========================================
// RENDER MAIN APP (Home Screen)
// ==========================================
function handleTeacherToggle(checkbox) {
    const knob = document.getElementById('toggle-knob');
    const bg = document.getElementById('toggle-bg');
    
    if (checkbox.checked) {
        bg.style.borderColor = '#ec4899';
        bg.style.backgroundColor = 'rgba(139, 92, 246, 0.4)';
        knob.style.transform = 'translateX(30px)';
        knob.style.backgroundColor = '#5eead4';
        knob.style.boxShadow = '0 0 12px #5eead4';
        
        showNeonModal(
            '🔐 Teacher Access',
            '<input type="password" placeholder="Enter PIN" style="width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #8b5cf6; background: rgba(15, 23, 42, 0.8); color: white; font-size: 1.5rem; text-align: center; outline: none; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); font-family: monospace; letter-spacing: 5px;">',
            true,
            (pin) => {
                if (pin === '@pple') {
                    showTeacherDashboard();
                } else if (pin !== null) {
                    checkbox.checked = false;
                    knob.style.transform = 'translateX(0)';
                    bg.style.borderColor = '#8b5cf6';
                    bg.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                    setTimeout(() => showNeonModal('❌ Error', 'Incorrect PIN. Access denied.'), 350);
                } else {
                    checkbox.checked = false;
                    knob.style.transform = 'translateX(0)';
                    bg.style.borderColor = '#8b5cf6';
                    bg.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                }
            }
        );
    }
}

function renderApp() {
    const appDiv = document.getElementById('app');
    window.appState = 'student';

    if (!window.activities || window.activities.length === 0) {
        appDiv.innerHTML = '<div style="color: #f9a8d4; text-align: center; font-size: 1.5rem; margin-top: 50px;">Loading your awesome activities...</div>';
        return;
    }

    const teacherToggleHTML = `
        <div style="position: absolute; top: 10px; right: 20px; display: flex; align-items: center; gap: 12px; z-index: 100;">
            <span style="color: #a5b4fc; font-family: 'Segoe UI', sans-serif; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Teacher</span>
            <label style="position: relative; display: inline-block; width: 56px; height: 28px;">
                <input type="checkbox" id="teacher-toggle-checkbox" onchange="handleTeacherToggle(this)" style="opacity: 0; width: 0; height: 0;">
                <span id="toggle-bg" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(15, 23, 42, 0.8); border-radius: 34px; border: 2px solid #8b5cf6; transition: .4s; box-shadow: inset 0 0 8px rgba(0,0,0,0.5);">
                    <span id="toggle-knob" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #f9a8d4; border-radius: 50%; transition: .4s; box-shadow: 0 0 12px #ec4899;"></span>
                </span>
            </label>
        </div>
    `;

    let html = teacherToggleHTML + `
        <h1 style="text-align: center; font-size: 3.5rem; font-weight: 800; margin-top: 40px; margin-bottom: 3rem; background: linear-gradient(to right, #f9a8d4, #8b5cf6, #5eead4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 4px 20px rgba(236, 72, 153, 0.4);">
            Activity Arcade
        </h1>
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 1000px; margin: 0 auto;">
    `;

    window.activities.forEach((activity) => {
        html += `
            <div onclick="renderActivity('${activity.title.replace(/'/g, "\\'")}')" 
                 class="glass-panel" 
                 style="cursor: pointer; padding: 30px; transition: all 0.3s ease;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(236, 72, 153, 0.3)'; this.style.borderColor='#8b5cf6';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.3)'; this.style.borderColor='rgba(255, 255, 255, 0.05)';">
                <h2 style="margin: 0; font-size: 1.8rem; color: #e2e8f0;">${activity.title}</h2>
                <p style="margin: 10px 0 0 0; color: #a5b4fc; font-size: 1.1rem;">${activity.items.length} parts</p>
            </div>
        `;
    });

    html += `</div>`;
    appDiv.innerHTML = html;
}

// ==========================================
// RENDER INDIVIDUAL ACTIVITY
// ==========================================
function renderActivity(activityTitle) {
    const activity = window.activities.find(a => a.title === activityTitle);
    if (!activity) return;
    window.currentActivity = activity;

    if (!currentStudentName) {
        showNeonModal('👋 Welcome!', '<input type="text" id="studentNameInput" placeholder="Enter your name" style="width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #8b5cf6; background: rgba(15, 23, 42, 0.8); color: white; font-size: 1.2rem; text-align: center; outline: none;">', true, (name) => {
            if (name && name.trim()) {
                currentStudentName = name.trim();
                localStorage.setItem('studentName', currentStudentName);
                renderActivity(activityTitle);
            } else {
                renderApp();
            }
        });
        return;
    }

    const isCategorisation = activity.items.some(item => item.type && (item.type.toLowerCase().includes('categorisation') || item.type.toLowerCase().includes('categorize')));

    let choices = [];
    let structureHtml = '';
    let choiceColorMap = {};

    let shuffledItems = [...activity.items].sort(() => Math.random() - 0.5);

    shuffledItems.forEach((item, index) => {
        let labelToUse = item.label;
        if (!labelToUse && !isCategorisation) labelToUse = item.text;

        if (labelToUse) {
            const color = COLORS[index % COLORS.length];
            choiceColorMap[labelToUse] = color;
            choices.push({ label: labelToUse, color: color, isDistractor: item.isDistractor, hint: item.hint });
        }
    });

    choices.sort(() => Math.random() - 0.5);

    let choicesHtml = choices.map(choice => `
        <div class="draggable-chip" draggable="true" ondragstart="drag(event)" id="chip-${Math.random().toString(36).substr(2, 9)}" data-label="${choice.label}" data-is-distractor="${choice.isDistractor}" style="border-left-color: ${choice.color};">
            ${choice.label}
            ${choice.hint ? `<span onclick="showNeonModal('💡 Hint', '${choice.hint.replace(/'/g, "\\'")}')" style="cursor:pointer; margin-left:8px; filter: drop-shadow(0 0 5px rgba(253, 224, 71, 0.8));">💡</span>` : ''}
        </div>
    `).join('');

    if (isCategorisation) {
        activity.items.filter(item => !item.isDistractor).forEach((item) => {
            structureHtml += `
                <div style="margin-bottom: 30px; display: flex; align-items: flex-start; gap: 20px;">
                    <div style="display: flex; align-items: center;">
                        <div class="drop-zone category-drop" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" data-correct="${item.label}"></div>
                        ${item.hint ? `<span onclick="showNeonModal('💡 Hint', '${item.hint.replace(/'/g, "\\'")}')" style="cursor: pointer; margin-left: 10px; font-size: 1.4rem; filter: drop-shadow(0 0 5px rgba(253, 224, 71, 0.8));">💡</span>` : ''}
                    </div>
                    <div class="text-block" style="flex: 1; padding: 20px; background: rgba(15, 23, 42, 0.5); border-radius: 12px; font-size: 1.2rem; line-height: 1.6; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease;">
                        ${item.text}
                    </div>
                </div>
            `;
        });
    } else {
        structureHtml = `<div style="font-size: 1.25rem; line-height: 2.2; color: #e2e8f0;">`;
        activity.items.filter(item => !item.isDistractor).forEach((item) => {
            let textParts = item.text.split('___');
            if (textParts.length > 1) {
                structureHtml += textParts[0];
                structureHtml += `<div class="drop-zone inline-drop" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" data-correct="${item.label}"></div>`;
                structureHtml += textParts[1] + " ";
            } else {
                structureHtml += item.text + " ";
            }
        });
        structureHtml += `</div>`;
    }

    let html = `
        <button onclick="renderApp()" style="margin-bottom: 20px; background: transparent; color: #a5b4fc; border: 1px solid #a5b4fc; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">← All activities</button>
        <div class="glass-panel" style="position: relative;">
            <h2 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 10px; color: #f9a8d4; text-shadow: 0 0 15px rgba(236, 72, 153, 0.5);">${activity.title}</h2>
            <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 25px;">Drag the correct words/phrases into the gaps. Watch out for distractors!</p>
            
            ${activity.overallHint ? `<button onclick="showNeonModal('💡 Overall Hint', '${activity.overallHint.replace(/'/g, "\\'")}')" style="background: rgba(30, 30, 46, 0.8); border: 1px solid #fde047; color: #fde047; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-family: 'Segoe UI', sans-serif; font-weight: bold; margin-bottom: 25px; box-shadow: 0 0 10px rgba(253, 224, 71, 0.2);"><span style="margin-right:8px;">💡</span> Need an overall hint?</button>` : ''}
            
            <div style="display: flex; gap: 30px; flex-direction: ${isCategorisation ? 'row' : 'column'};">
                <div style="${isCategorisation ? 'flex: 0 0 300px;' : 'width: 100%;'} background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="margin-top: 0; color: #a5b4fc; font-size: 1.3rem;">Choices</h3>
                    <div id="choices-container" style="display: flex; flex-wrap: wrap; gap: 10px; min-height: 100px;" ondrop="dropBack(event)" ondragover="allowDrop(event)">
                        ${choicesHtml}
                    </div>
                </div>
                
                <div style="flex: 1; background: rgba(15, 23, 42, 0.4); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="margin-top: 0; color: #a5b4fc; font-size: 1.3rem; margin-bottom: 20px;">${isCategorisation ? 'Paragraph Labels' : 'Text'}</h3>
                    <div id="structure-container">
                        ${structureHtml}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: left;">
                <button onclick="${isCategorisation ? 'checkCategorisationAnswer()' : 'checkStandardAnswer()'}" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; border: none; padding: 15px 40px; border-radius: 10px; font-size: 1.2rem; font-weight: bold; cursor: pointer; box-shadow: 0 5px 20px rgba(236, 72, 153, 0.4); transition: transform 0.2s;">Check Answer</button>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = html;
}

// ==========================================
// DRAG AND DROP LOGIC
// ==========================================
function allowDrop(ev) { ev.preventDefault(); ev.currentTarget.classList.add('drag-over'); }
function dragLeave(ev) { ev.currentTarget.classList.remove('drag-over'); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    let dropZone = ev.currentTarget;
    dropZone.classList.remove('drag-over');
    var data = ev.dataTransfer.getData("text");
    var draggedElement = document.getElementById(data);

    if (dropZone.classList.contains('drop-zone')) {
        if (dropZone.children.length > 0) {
            document.getElementById('choices-container').appendChild(dropZone.children[0]);
        }
        dropZone.appendChild(draggedElement);
        dropZone.classList.add('filled');

        if (dropZone.classList.contains('category-drop')) {
            const color = draggedElement.style.borderLeftColor;
            const textBlock = dropZone.closest('div').nextElementSibling;
            if (textBlock && textBlock.classList.contains('text-block')) {
                textBlock.style.backgroundColor = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
                textBlock.style.borderColor = color;
            }
        }
    }
}

function dropBack(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var draggedElement = document.getElementById(data);
    
    const oldDropZone = draggedElement.parentElement;
    if (oldDropZone && oldDropZone.classList.contains('category-drop')) {
        const textBlock = oldDropZone.closest('div').nextElementSibling;
        if (textBlock && textBlock.classList.contains('text-block')) {
            textBlock.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';
            textBlock.style.borderColor = 'rgba(255,255,255,0.1)';
        }
    }

    document.getElementById('choices-container').appendChild(draggedElement);
    if (oldDropZone && oldDropZone.classList.contains('drop-zone')) {
        oldDropZone.classList.remove('filled');
    }
}

// ==========================================
// ANSWER CHECKING
// ==========================================
function checkCategorisationAnswer() {
    let allCorrect = true;
    const dropZones = document.querySelectorAll('.category-drop');
    let totalDistractors = document.querySelectorAll('.draggable-chip[data-is-distractor="true"]').length;
    let distractorsUsed = 0;

    dropZones.forEach(zone => {
        const expected = zone.getAttribute('data-correct');
        const chip = zone.querySelector('.draggable-chip');
        const textBlock = zone.closest('div').nextElementSibling;
        
        if (chip) {
            if (chip.getAttribute('data-is-distractor') === 'true') distractorsUsed++;
            if (chip.getAttribute('data-label') === expected) {
                chip.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'; // Correct Green
                chip.style.borderLeftColor = '#22c55e';
                textBlock.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                textBlock.style.borderColor = '#22c55e';
            } else {
                allCorrect = false;
                document.getElementById('choices-container').appendChild(chip);
                zone.classList.remove('filled');
                textBlock.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';
                textBlock.style.borderColor = 'rgba(255,255,255,0.1)';
            }
        } else {
            allCorrect = false;
        }
    });

    finalizeCheck(allCorrect, totalDistractors, distractorsUsed);
}

function checkStandardAnswer() {
    let allCorrect = true;
    const dropZones = document.querySelectorAll('.inline-drop');
    let totalDistractors = document.querySelectorAll('.draggable-chip[data-is-distractor="true"]').length;
    let distractorsUsed = 0;

    dropZones.forEach(zone => {
        const expected = zone.getAttribute('data-correct');
        const chip = zone.querySelector('.draggable-chip');
        
        if (chip) {
            if (chip.getAttribute('data-is-distractor') === 'true') distractorsUsed++;
            if (chip.getAttribute('data-label') === expected) {
                chip.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                chip.style.borderLeftColor = '#22c55e';
            } else {
                allCorrect = false;
                document.getElementById('choices-container').appendChild(chip);
                zone.classList.remove('filled');
            }
        } else {
            allCorrect = false;
        }
    });

    finalizeCheck(allCorrect, totalDistractors, distractorsUsed);
}

function finalizeCheck(allCorrect, totalDistractors, distractorsUsed) {
    if (allCorrect) {
        showNeonModal('🎉 Perfect!', 'You got everything right! Great job.');
        recordAttempt(window.currentActivity.title, true, totalDistractors, distractorsUsed);
    } else {
        showNeonModal('Keep Trying!', 'Some answers were incorrect and have been moved back. Try again!');
        recordAttempt(window.currentActivity.title, false, totalDistractors, distractorsUsed);
    }
}

// ==========================================
// TRACKING & TEACHER DASHBOARD
// ==========================================
function recordAttempt(activityTitle, isCorrect, totalDistractors, distractorsUsed) {
    let attempts = parseInt(localStorage.getItem(`attempts_${currentStudentName}_${activityTitle}`) || '0');
    attempts++;
    localStorage.setItem(`attempts_${currentStudentName}_${activityTitle}`, attempts);

    let details = isCorrect ? "Completed" : "In Progress";
    if (totalDistractors > 0) {
        details += ` (Fell for ${distractorsUsed} out of ${totalDistractors} trick words)`;
    }

    const payload = {
        name: currentStudentName,
        gameId: activityTitle,
        attempt: attempts,
        status: isCorrect ? 'Completed' : 'Attempted',
        details: details
    };

    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Tracking Error:", err));
}

async function showTeacherDashboard() {
    window.appState = 'teacher';
    document.getElementById('app').innerHTML = '<div style="color: #f9a8d4; text-align: center; font-size: 1.5rem; margin-top: 50px;">Loading Live Tracking Data...</div>';
    
    try {
        const response = await fetch(TRACKING_CSV_URL);
        const csvData = await response.text();
        const rows = parseCSV(csvData);
        
        let html = `
            <button onclick="renderApp()" style="margin-bottom: 20px; background: transparent; color: #a5b4fc; border: 1px solid #a5b4fc; padding: 8px 16px; border-radius: 8px; cursor: pointer;">← Logout & Back to Arcade</button>
            <div class="glass-panel">
                <h2 style="margin-top:0; color: #f9a8d4;">Live Tracking Dashboard</h2>
                <div style="overflow-x:auto;">
                    <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; font-size: 1rem;">
                        <thead>
                            <tr style="background: rgba(139, 92, 246, 0.3); border-bottom: 2px solid #8b5cf6;">
                                <th style="padding: 12px; text-align: left;">Time</th>
                                <th style="padding: 12px; text-align: left;">Student</th>
                                <th style="padding: 12px; text-align: left;">Activity</th>
                                <th style="padding: 12px; text-align: center;">Attempt</th>
                                <th style="padding: 12px; text-align: left;">Status</th>
                                <th style="padding: 12px; text-align: left;">Details</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        for (let i = 1; i < rows.length; i++) {
            if(rows[i].length < 6) continue;
            const [timestamp, name, gameId, attempt, status, details] = rows[i];
            const statusColor = status.includes('Completed') ? '#22c55e' : '#fca5a5';
            
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px;">${new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td style="padding: 12px; font-weight: bold;">${name}</td>
                    <td style="padding: 12px; color: #a5b4fc;">${gameId}</td>
                    <td style="padding: 12px; text-align: center;">${attempt}</td>
                    <td style="padding: 12px; color: ${statusColor};">${status}</td>
                    <td style="padding: 12px; font-size: 0.9rem; color: #cbd5e1;">${details || ''}</td>
                </tr>
            `;
        }

        html += `</tbody></table></div></div>`;
        document.getElementById('app').innerHTML = html;

        if (window.appState === 'teacher') {
            setTimeout(showTeacherDashboard, 15000);
        }
    } catch (error) {
        document.getElementById('app').innerHTML = `
            <button onclick="renderApp()" style="margin-bottom: 20px; background: transparent; color: #a5b4fc; border: 1px solid #a5b4fc; padding: 8px 16px; border-radius: 8px;">← Logout</button>
            <h2 style="color: #fca5a5; text-align:center;">Failed to load tracking data. Please refresh.</h2>
        `;
    }
}

// ==========================================
// INITIALIZE
// ==========================================
window.onload = loadData;
