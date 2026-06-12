const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';

const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

let libraryData = [];
let currentActivityData = [];
let draggedElement = null;
let currentActivityTitle = '';
let studentName = '';
let attemptCount = 0;
let hintsUsed = 0;
let totalDistractors = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadLibraryData();
    setInterval(loadTeacherData, 15000); 

    // Bulletproof loading to prevent Start button crashes
    const choicesContainer = document.getElementById('choices-container');
    if (choicesContainer) {
        choicesContainer.addEventListener('dragover', (event) => event.preventDefault());
        choicesContainer.addEventListener('drop', function(event) {
            event.preventDefault();
            if (draggedElement) {
                this.appendChild(draggedElement);
                document.querySelectorAll('.dropzone, .gap-fill-dropzone').forEach(dz => {
                    if (dz.children.length === 0) {
                        dz.style.border = '2px dashed rgba(255, 255, 255, 0.4)';
                        dz.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                });
            }
        });
    }
});

window.toggleRole = function() {
    const isTeacher = document.getElementById('roleSwitch').checked;
    if (isTeacher) {
        let pin = prompt("Enter Teacher PIN:");
        if (pin === "@pple") {
            document.getElementById('student-login').style.display = 'none';
            document.getElementById('game-container').style.display = 'none';
            document.getElementById('teacher-view').style.display = 'block';
            loadTeacherData();
        } else {
            alert("Incorrect PIN");
            document.getElementById('roleSwitch').checked = false;
        }
    } else {
        document.getElementById('teacher-view').style.display = 'none';
        document.getElementById('student-login').style.display = 'block';
        document.getElementById('game-container').style.display = 'none';
    }
};

async function loadLibraryData() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const csvText = await response.text();
        parseLibraryCSV(csvText);
    } catch (error) {
        console.error("Error loading library data:", error);
    }
}

function parseLibraryCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    const headers = rows[0].map(h => h.trim().toLowerCase());
    
    const titleIdx = headers.indexOf('title');
    const typeIdx = headers.indexOf('type');
    const textIdx = headers.indexOf('text');
    const labelIdx = headers.indexOf('label');
    const hintIdx = headers.indexOf('hint');
    const overallHintIdx = headers.indexOf('overall_hint');
    const statusIdx = headers.indexOf('status');

    let currentTitle = "";
    let currentType = "";
    let currentOverallHint = "";

    libraryData = [];

    for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || rows[i].join('').trim() === '') continue;
        
        let row = rows[i].map(cell => {
            let val = cell ? cell.trim() : "";
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            return val;
        });

        if (row[titleIdx] && row[titleIdx] !== "") currentTitle = row[titleIdx];
        if (row[typeIdx] && row[typeIdx] !== "") currentType = row[typeIdx];
        if (row[overallHintIdx] && row[overallHintIdx] !== "") currentOverallHint = row[overallHintIdx];

        let text = row[textIdx] || "";
        let label = row[labelIdx] || "";
        let hint = row[hintIdx] || "";
        let status = row[statusIdx] || "";

        let isDistractor = false;
        if (status.toLowerCase().includes('distractor') || currentType.toLowerCase().includes('distractor')) {
            isDistractor = true;
        }

        if (currentTitle && (text || label)) {
            libraryData.push({
                title: currentTitle,
                type: currentType,
                text: text,
                label: label,
                hint: hint,
                overallHint: currentOverallHint,
                isDistractor: isDistractor
            });
        }
    }
    populateActivitySelect();
}

function populateActivitySelect() {
    const select = document.getElementById('activity-select');
    select.innerHTML = '<option value="">-- Select an Activity --</option>';
    
    const titles = [...new Set(libraryData.map(item => item.title))];
    titles.forEach(title => {
        let opt = document.createElement('option');
        opt.value = title;
        opt.textContent = title;
        select.appendChild(opt);
    });
}

window.startActivity = function() {
    studentName = document.getElementById('student-name').value.trim();
    currentActivityTitle = document.getElementById('activity-select').value;

    if (!studentName || !currentActivityTitle) {
        alert("Please enter your name and select an activity.");
        return;
    }

    currentActivityData = libraryData.filter(item => item.title === currentActivityTitle);
    
    if (currentActivityData.length === 0) {
        alert("No data found for this activity.");
        return;
    }

    document.getElementById('student-login').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    attemptCount = 0;
    hintsUsed = 0;
    renderGame();
};

function renderGame() {
    document.getElementById('activity-title').textContent = currentActivityTitle;
    const type = currentActivityData[0].type || "";
    
    const isStandardGapFill = !type.toLowerCase().includes('categorisation') && !type.toLowerCase().includes('categorize');

    totalDistractors = currentActivityData.filter(item => item.isDistractor).length;
    let subtitleText = "Drag the correct words/phrases into the gaps.";
    if (totalDistractors > 0) {
        subtitleText += " Watch out for distractors!";
    }

    // --- OVERALL HINT (Matching Lightbulb) ---
    const overallHintText = currentActivityData[0].overallHint;
    if (overallHintText) {
        let safeHint = overallHintText.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        let hintHtml = `<span class="hint-icon" onclick="showHint('${safeHint}')" title="Need an overall hint?" style="margin-left: 10px; cursor: pointer; font-size: 1.2em; filter: drop-shadow(0 0 5px rgba(249, 168, 212, 0.6));">💡</span>`;
        document.getElementById('activity-subtitle').innerHTML = subtitleText + hintHtml;
    } else {
        document.getElementById('activity-subtitle').textContent = subtitleText;
    }

    let oldHintContainer = document.getElementById('overall-hint-container');
    if (oldHintContainer) oldHintContainer.innerHTML = '';

    // BUILD CHOICES (With lightbulbs inside!)
    let choiceObjects = new Map();
    currentActivityData.forEach(item => {
        if (item.label && !choiceObjects.has(item.label)) {
            choiceObjects.set(item.label, {
                label: item.label,
                hint: item.hint || ''
            });
        }
    });

    let choices = Array.from(choiceObjects.values());
    choices.sort(() => Math.random() - 0.5);

    let choicesHtml = '';
    choices.forEach((choiceObj, index) => {
        let color = COLORS[index % COLORS.length];
        
        let hintHtml = '';
        if (choiceObj.hint) {
            let safeChoiceHint = choiceObj.hint.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            hintHtml = `<span class="hint-icon" onclick="event.stopPropagation(); showHint('${safeChoiceHint}')" title="Need a hint?" style="margin-left: 8px; cursor: pointer; font-size: 1.1em;">💡</span>`;
        }
        
        choicesHtml += `<div class="draggable-chip" draggable="true" ondragstart="drag(event)" id="chip-${index}" data-answer="${choiceObj.label.replace(/"/g, '&quot;')}" style="background-color: ${color}; display: inline-flex; align-items: center; border-radius: 8px;">${choiceObj.label}${hintHtml}</div>`;
    });
    document.getElementById('choices-container').innerHTML = choicesHtml;

    // BUILD RIGHT SIDE (Text/Gaps)
    let textContainer = document.getElementById('text-container');
    let html = '';

    currentActivityData.forEach((item, index) => {
        if (item.isDistractor) return;

        if (isStandardGapFill) {
            let parts = item.text.split('___');
            html += `<span class="gap-text-part">${parts[0]}</span><div class="gap-fill-dropzone" data-index="${index}" ondragover="allowDrop(event)" ondrop="drop(event)"></div><span class="gap-text-part">${parts[1] || ''}</span> `;
        } else {
            html += `
                <div class="categorisation-row">
                    <div class="dropzone-container">
                        <div class="dropzone" data-index="${index}" ondragover="allowDrop(event)" ondrop="drop(event)"></div>
                    </div>
                    <div class="text-content">${item.text}</div>
                </div>
            `;
        }
    });

    textContainer.innerHTML = html;
    
    if (isStandardGapFill) {
        textContainer.className = 'standard-gap-fill-layout';
    } else {
        textContainer.className = 'categorisation-layout';
    }

    let fbMessage = document.getElementById('feedback-message');
    if (fbMessage) {
        fbMessage.textContent = '';
        fbMessage.className = '';
    }
}

window.drag = function(event) {
    draggedElement = event.target;
    event.dataTransfer.setData("text", event.target.id);
    event.target.style.opacity = '0.5';
};

document.addEventListener('dragend', function(event) {
    if (event.target.classList.contains('draggable-chip')) {
        event.target.style.opacity = '1';
    }
});

window.allowDrop = function(event) {
    event.preventDefault();
};

window.drop = function(event) {
    event.preventDefault();
    let dropzone = event.target.closest('.dropzone, .gap-fill-dropzone');
    if (!dropzone) return;
    
    if (dropzone.children.length > 0) {
        document.getElementById('choices-container').appendChild(dropzone.children[0]);
    }
    
    dropzone.appendChild(draggedElement);
    dropzone.style.border = 'none';
    dropzone.style.backgroundColor = 'transparent';
};

// --- PREMIUM HINT REVEAL (FROSTED GLASS MODAL) ---
window.showHint = function(hintText) {
    hintsUsed++;
    
    let existing = document.getElementById('custom-hint-modal');
    if (existing) existing.remove();

    let modal = document.createElement('div');
    modal.id = 'custom-hint-modal';
    modal.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(30, 27, 75, 0.95); border: 1px solid rgba(249, 168, 212, 0.5); border-radius: 16px; padding: 30px; z-index: 10000; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1); text-align: center; color: white; min-width: 300px; max-width: 80%; backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center;";
    
    modal.innerHTML = `
        <div style="font-size: 2.5em; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(249, 168, 212, 0.8));">💡</div>
        <div style="font-size: 1.2em; margin-bottom: 25px; line-height: 1.5;">${hintText}</div>
        <button onclick="document.getElementById('custom-hint-modal').remove()" style="background: linear-gradient(135deg, #f9a8d4, #a5b4fc); border: none; padding: 10px 25px; border-radius: 8px; color: #1e1b4b; font-weight: bold; font-size: 1em; cursor: pointer; box-shadow: 0 4px 15px rgba(249, 168, 212, 0.4);">Got it!</button>
    `;
    document.body.appendChild(modal);
};

window.checkAnswer = function() {
    attemptCount++;
    let dropzones = document.querySelectorAll('.dropzone, .gap-fill-dropzone');
    let isCorrect = true;
    let correctCount = 0;
    let totalRequired = currentActivityData.filter(item => !item.isDistractor).length;

    dropzones.forEach(zone => {
        let index = zone.getAttribute('data-index');
        let expectedAnswer = currentActivityData[index].label;
        let child = zone.children[0];

        if (child) {
            let studentAnswer = child.getAttribute('data-answer');
            if (studentAnswer === expectedAnswer) {
                child.style.backgroundColor = '#4ade80';
                child.style.color = '#1e1b4b';
                child.setAttribute('draggable', 'false');
                correctCount++;
            } else {
                isCorrect = false;
                document.getElementById('choices-container').appendChild(child);
                zone.style.border = '2px dashed rgba(255, 255, 255, 0.4)';
            }
        } else {
            isCorrect = false;
            zone.style.border = '2px dashed rgba(255, 255, 255, 0.4)';
        }
    });

    let fb = document.getElementById('feedback-message');
    let summary = `Attempts: ${attemptCount} | Hints Used: ${hintsUsed}`;

    if (isCorrect && correctCount === totalRequired) {
        fb.textContent = "🎉 Perfect! All correct!";
        fb.className = "success";
        sendTrackingData("Completed", summary);
        triggerConfetti();
    } else {
        fb.textContent = "Not quite. Incorrect answers have been returned to the left. Try again!";
        fb.className = "error";
        sendTrackingData("Attempted", summary);
    }
};

window.resetGame = function() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('student-login').style.display = 'block';
    document.getElementById('student-name').value = '';
    document.getElementById('activity-select').value = '';
};

function triggerConfetti() {
    for(let i=0; i<50; i++){
        let conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 3000);
    }
}

function sendTrackingData(status, details) {
    let url = `${TRACKING_URL}?name=${encodeURIComponent(studentName)}&gameId=${encodeURIComponent(currentActivityTitle)}&attempt=${attemptCount}&status=${encodeURIComponent(status)}&details=${encodeURIComponent(details)}`;
    fetch(url, { mode: 'no-cors' }).catch(err => console.log(err));
}

async function loadTeacherData() {
    if (document.getElementById('teacher-view').style.display === 'none') return;
    try {
        const response = await fetch(TRACKING_CSV_URL);
        const text = await response.text();
        const rows = text.split('\n').map(row => row.split(','));
        
        let html = '<table><tr><th>Time</th><th>Student</th><th>Activity</th><th>Attempt</th><th>Status</th><th>Details</th></tr>';
        
        for(let i=rows.length-1; i>0; i--) {
            if(!rows[i] || rows[i].length < 6) continue;
            let date = new Date(rows[i][0]);
            let timeStr = isNaN(date.getTime()) ? rows[i][0] : date.toLocaleTimeString();
            
            html += `<tr>
                <td>${timeStr}</td>
                <td>${rows[i][1]}</td>
                <td>${rows[i][2]}</td>
                <td>${rows[i][3]}</td>
                <td>${rows[i][4]}</td>
                <td>${rows[i][5]}</td>
            </tr>`;
        }
        html += '</table>';
        document.getElementById('teacher-data').innerHTML = html;
    } catch (e) {
        document.getElementById('teacher-data').innerHTML = 'Error loading data.';
    }
}
