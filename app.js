// --- CONFIGURATION ---
const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';
const TEACHER_PIN = '@pple';
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

// --- STATE ---
let activities = {};
let currentUser = null;
let currentGame = null;
let attemptNumber = 0;
let usedHints = false;

// --- DOM ELEMENTS ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const gameSection = document.getElementById('game-section');
const teacherDashboard = document.getElementById('teacher-dashboard');

// Neon Toggle Elements
const roleToggle = document.getElementById('role-toggle');
const studentForm = document.getElementById('student-login-form');
const teacherForm = document.getElementById('teacher-login-form');
const labelStudent = document.getElementById('label-student');
const labelTeacher = document.getElementById('label-teacher');

// --- ROBUST CSV PARSER (The Fix for the Comma Bug) ---
function parseCSV(text) {
    const result = [];
    let row = [];
    let inQuotes = false;
    let val = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            if (inQuotes && text[i+1] === '"') {
                val += '"'; i++; // escaped quote inside quote
            } else {
                inQuotes = !inQuotes; // toggle quote state
            }
        } else if (char === ',' && !inQuotes) {
            row.push(val.trim());
            val = "";
        } else if (char === '\n' && !inQuotes) {
            row.push(val.trim());
            result.push(row);
            row = [];
            val = "";
        } else if (char !== '\r') {
            val += char;
        }
    }
    if (val || row.length > 0) {
        row.push(val.trim());
        result.push(row);
    }
    return result;
}

// --- INITIALIZATION & DATA LOADING ---
async function init() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        const headers = rows[0].map(h => h.trim());

        let currentTitle = "";
        let currentType = "";
        let currentOverallHint = "";

        // Smart Data Parser
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            const titleCell = row[headers.indexOf('Title')] || "";
            const typeCell = row[headers.indexOf('Type')] || "";
            const textCell = row[headers.indexOf('Text')] || "";
            const labelCell = row[headers.indexOf('Label')] || "";
            const hintCell = row[headers.indexOf('Hint')] || "";
            const overallHintCell = row[headers.indexOf('Overall_Hint')] || "";
            const statusCell = row[headers.indexOf('Status')] || "";

            if (titleCell) currentTitle = titleCell;
            if (typeCell) currentType = typeCell;
            if (overallHintCell) currentOverallHint = overallHintCell;

            if (!currentTitle) continue;

            if (!activities[currentTitle]) {
                activities[currentTitle] = {
                    title: currentTitle,
                    type: currentType,
                    overallHint: currentOverallHint,
                    items: []
                };
            }

            const isDistractor = (statusCell && statusCell.toLowerCase().includes('distractor')) || 
                                 (typeCell && typeCell.toLowerCase().includes('distractor'));

            if (textCell || labelCell || isDistractor) {
                activities[currentTitle].items.push({
                    text: textCell,
                    label: labelCell,
                    hint: hintCell,
                    isDistractor: isDistractor
                });
            }
        }
        console.log("Parsed Activities Successfully:", activities);
    } catch (error) {
        console.error("Error loading activities:", error);
        alert("Failed to load activities. Please check the Google Sheet connection.");
    }
}

// --- NEON TOGGLE LOGIC ---
if(roleToggle) {
    roleToggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            // Teacher Mode
            studentForm.classList.add('hidden');
            teacherForm.classList.remove('hidden');
            labelStudent.classList.replace('text-white', 'text-white/40');
            labelTeacher.classList.replace('text-white/40', 'text-white');
        } else {
            // Student Mode
            teacherForm.classList.add('hidden');
            studentForm.classList.remove('hidden');
            labelTeacher.classList.replace('text-white', 'text-white/40');
            labelStudent.classList.replace('text-white/40', 'text-white');
        }
    });
}

// --- AUTHENTICATION ---
document.getElementById('login-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('student-name').value.trim();
    if (nameInput) {
        currentUser = nameInput;
        document.getElementById('welcome-message').innerText = `Hello, ${currentUser}`;
        showSection(dashboardSection);
        renderDashboard();
    } else {
        alert("Please enter your name.");
    }
});

document.getElementById('teacher-login-btn').addEventListener('click', () => {
    const pin = document.getElementById('teacher-pin').value;
    const errorMsg = document.getElementById('teacher-error');
    if (pin === TEACHER_PIN) {
        errorMsg.classList.add('hidden');
        showSection(teacherDashboard);
        loadTeacherData();
        setInterval(loadTeacherData, 15000); // Auto-refresh 15s
    } else {
        errorMsg.innerText = "Incorrect PIN";
        errorMsg.classList.remove('hidden');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => { currentUser = null; showSection(loginSection); });
document.getElementById('teacher-logout-btn').addEventListener('click', () => { showSection(loginSection); document.getElementById('teacher-pin').value = ''; });
document.getElementById('back-btn').addEventListener('click', () => { showSection(dashboardSection); });

// --- UTILS ---
function showSection(section) {
    [loginSection, dashboardSection, gameSection, teacherDashboard].forEach(s => s.classList.add('hidden'));
    section.classList.remove('hidden');
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- STUDENT DASHBOARD ---
function renderDashboard() {
    const container = document.getElementById('activities-container');
    container.innerHTML = '';

    Object.values(activities).forEach(activity => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer h-48';
        
        const isCategorisation = activity.type && (activity.type.toLowerCase().includes('categorisation') || activity.type.toLowerCase().includes('categorize'));
        const typeBadge = isCategorisation ? 'Categorisation' : 'Gap-Fill';
        
        card.innerHTML = `
            <div>
                <h3 class="text-2xl font-bold text-white mb-2 drop-shadow-md">${activity.title}</h3>
                <span class="text-xs font-semibold px-3 py-1 bg-white/10 text-pink-300 rounded-full border border-white/20">${typeBadge}</span>
            </div>
            <button class="mt-4 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 rounded-lg transition-colors">Start Activity</button>
        `;
        card.addEventListener('click', () => startGame(activity));
        container.appendChild(card);
    });
}

// --- GAME LOGIC ---
function startGame(activity) {
    currentGame = activity;
    attemptNumber = 0;
    usedHints = false;
    document.getElementById('game-title').innerText = activity.title;
    
    const content = document.getElementById('game-content');
    content.innerHTML = '';

    const isCategorisation = activity.type && (activity.type.toLowerCase().includes('categorisation') || activity.type.toLowerCase().includes('categorize'));

    // Layout Wrapper: Grid (Choice Bank Left, Text Right)
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'flex flex-col lg:flex-row gap-8 w-full';

    // 1. Choice Bank (Left)
    const choiceBank = document.createElement('div');
    choiceBank.className = 'w-full lg:w-1/4 glass-panel p-6 rounded-2xl flex flex-col items-center';
    choiceBank.innerHTML = `<h3 class="text-xl font-bold text-white mb-4 w-full text-center border-b border-white/20 pb-2">Choices</h3>`;
    
    const choicesContainer = document.createElement('div');
    choicesContainer.id = 'choices-container';
    choicesContainer.className = 'flex flex-wrap gap-3 justify-center w-full min-h-[200px] content-start';
    
    // Create Draggable Chips
    let labels = activity.items.map(item => item.label).filter(l => l);
    labels = [...new Set(labels)]; // unique
    labels = shuffle(labels);

    labels.forEach((label, index) => {
        const color = COLORS[index % COLORS.length];
        const chip = document.createElement('div');
        chip.className = 'draggable-chip px-4 py-2 cursor-grab text-center select-none shadow-md text-sm md:text-base';
        chip.style.backgroundColor = color;
        chip.dataset.label = label;
        chip.dataset.origColor = color;
        chip.innerText = label;
        chip.setAttribute('draggable', 'true');
        
        chip.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', label);
            setTimeout(() => chip.classList.add('opacity-50'), 0);
        });
        chip.addEventListener('dragend', () => chip.classList.remove('opacity-50'));
        
        // Double click to remove if dropped
        chip.ondblclick = function() {
            if (this.parentElement.classList.contains('drop-slot')) {
                document.getElementById('choices-container').appendChild(this);
                this.parentElement.classList.remove('filled');
            }
        };

        choicesContainer.appendChild(chip);
    });
    choiceBank.appendChild(choicesContainer);
    gridWrapper.appendChild(choiceBank);

    // 2. Text Area (Right)
    const textArea = document.createElement('div');
    textArea.className = 'w-full lg:w-3/4 flex flex-col gap-6';

    if (isCategorisation) {
        // CATEGORISATION LAYOUT: Blocks with dashed boxes on top
        activity.items.forEach(item => {
            if (item.isDistractor) return;

            const block = document.createElement('div');
            block.className = 'flex flex-col gap-2 w-full';

            const slot = document.createElement('div');
            slot.className = 'drop-slot categorisation-slot w-full md:w-1/2 bg-black/20';
            slot.dataset.label = item.label;
            setupDropZone(slot);

            const textCard = document.createElement('div');
            textCard.className = 'glass-panel p-6 rounded-xl text-white text-lg leading-relaxed shadow-lg';
            textCard.innerHTML = item.text;

            block.appendChild(slot);
            block.appendChild(textCard);

            // Individual Hint
            if (item.hint) {
                const hintBtn = document.createElement('button');
                hintBtn.innerText = '💡 Hint';
                hintBtn.className = 'text-sm text-yellow-300 hover:text-yellow-100 self-start mt-1 bg-black/30 px-3 py-1 rounded-full transition-colors';
                hintBtn.onclick = () => { alert(item.hint); usedHints = true; };
                block.appendChild(hintBtn);
            }
            textArea.appendChild(block);
        });
    } else {
        // GAP-FILL LAYOUT: Single Flowing Paragraph
        const paragraphCard = document.createElement('div');
        paragraphCard.className = 'glass-panel p-8 rounded-2xl text-white text-lg md:text-xl leading-loose shadow-lg w-full';
        
        let htmlContent = '';
        let itemIndex = 0;

        activity.items.forEach(item => {
            if(item.isDistractor) return;
            
            let partText = item.text;
            if (partText.includes('___')) {
                // Replace ___ with an inline drop slot
                const slotHTML = `<span class="drop-slot inline-slot bg-black/20 rounded-md" data-label="${item.label}" id="slot-${itemIndex}"></span>`;
                partText = partText.replace('___', slotHTML);
                
                // Add hint if exists
                if(item.hint) {
                    partText += ` <button onclick="alert('${item.hint.replace(/'/g, "\\'")}'); usedHints=true;" class="text-sm text-yellow-300 hover:text-yellow-100 ml-1">💡</button>`;
                }
            }
            htmlContent += partText + ' ';
            itemIndex++;
        });
        
        paragraphCard.innerHTML = htmlContent;
        textArea.appendChild(paragraphCard);
    }

    // Controls (Bottom of Text Area)
    const controls = document.createElement('div');
    controls.className = 'flex flex-wrap gap-4 mt-8 items-center justify-end border-t border-white/20 pt-6';
    
    if (activity.overallHint) {
        const btnOverallHint = document.createElement('button');
        btnOverallHint.className = 'bg-pink-500/20 text-pink-300 border border-pink-500/50 px-4 py-2 rounded-lg hover:bg-pink-500/40 transition-colors font-medium';
        btnOverallHint.innerText = 'Need a general hint?';
        btnOverallHint.onclick = () => { alert(activity.overallHint); usedHints = true; };
        controls.appendChild(btnOverallHint);
    }

    const btnCheck = document.createElement('button');
    btnCheck.className = 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] transform hover:-translate-y-1 transition-all text-lg';
    btnCheck.innerText = 'Check Answers';
    btnCheck.onclick = checkAnswers;

    controls.appendChild(btnCheck);
    textArea.appendChild(controls);

    gridWrapper.appendChild(textArea);
    content.appendChild(gridWrapper);

    // Setup drop zones for inline slots (if Gap-Fill)
    if (!isCategorisation) {
        document.querySelectorAll('.inline-slot').forEach(setupDropZone);
    }

    showSection(gameSection);
}

function setupDropZone(slot) {
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('bg-white/20');
    });
    slot.addEventListener('dragleave', () => {
        slot.classList.remove('bg-white/20');
    });
    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('bg-white/20');
        const label = e.dataTransfer.getData('text/plain');
        const chip = document.querySelector(`.draggable-chip[data-label="${label}"]`);
        
        if (chip) {
            // If slot already has a chip, send old chip back to choices
            if (slot.children.length > 0) {
                document.getElementById('choices-container').appendChild(slot.children[0]);
            }
            slot.appendChild(chip);
            slot.classList.add('filled');
        }
    });
}

function checkAnswers() {
    attemptNumber++;
    let allCorrect = true;
    let anyEmpty = false;

    const slots = document.querySelectorAll('.drop-slot');
    
    slots.forEach(slot => {
        if (slot.children.length > 0) {
            const chip = slot.children[0];
            const expected = slot.dataset.label;
            const actual = chip.dataset.label;

            if (expected === actual) {
                // CORRECT: Lock it in, turn pastel green
                chip.style.backgroundColor = '#86efac';
                chip.style.color = '#064e3b';
                chip.setAttribute('draggable', 'false');
                chip.classList.add('cursor-default');
                chip.ondblclick = null; // Prevent removal
            } else {
                // INCORRECT: Send back to choice bank
                allCorrect = false;
                document.getElementById('choices-container').appendChild(chip);
                chip.style.backgroundColor = chip.dataset.origColor; // reset color
                chip.style.color = '#1e293b';
                slot.classList.remove('filled');
            }
        } else {
            allCorrect = false;
            anyEmpty = true;
        }
    });

    const hasDistractors = currentGame.items.some(i => i.isDistractor);
    let statusText = allCorrect ? "Completed" : "Attempted";
    
    // Build Details Text
    let detailsText = usedHints ? "Hints used. " : "No hints. ";
    if (hasDistractors) detailsText += "Ignored distractors successfully.";

    sendTrackingData(statusText, detailsText);

    if (allCorrect) {
        alert("🎉 Perfect! You nailed it!");
    } else if (anyEmpty) {
        if (hasDistractors) {
             alert(`Attempt ${attemptNumber}: Keep going! Remember, there are distractors you shouldn't use!`);
        } else {
             alert(`Attempt ${attemptNumber}: Some gaps are still empty. Keep trying!`);
        }
    } else {
        alert(`Attempt ${attemptNumber}: Incorrect answers have been bounced back. Try again!`);
    }
}

// --- TRACKING & TEACHER DATA ---
function sendTrackingData(status, details) {
    const timestamp = new Date().toLocaleString();
    const payload = {
        Timestamp: timestamp,
        Name: currentUser,
        Game_ID: currentGame.title,
        Attempt: attemptNumber,
        Status: status,
        Details: details
    };

    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Tracking Error:', err));
}

async function loadTeacherData() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv');
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        const tbody = document.getElementById('teacher-data');
        tbody.innerHTML = '';

        // Start from 1 to skip header, show last 50 entries
        const dataRows = rows.slice(1).filter(r => r.length >= 6).reverse().slice(0, 50);

        dataRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/10 hover:bg-white/5 transition-colors';
            
            // Format status color
            let statusColor = 'text-white';
            if(row[4].includes('Completed')) statusColor = 'text-green-400 font-bold';
            else if(row[4].includes('Attempted')) statusColor = 'text-yellow-400';

            tr.innerHTML = `
                <td class="p-4 text-sm">${row[0]}</td>
                <td class="p-4 font-semibold text-pink-300">${row[1]}</td>
                <td class="p-4">${row[2]}</td>
                <td class="p-4 text-center">${row[3]}</td>
                <td class="p-4 ${statusColor}">${row[4]}</td>
                <td class="p-4 text-sm text-white/60">${row[5]}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading tracking data:", error);
    }
}

// Start
init();
