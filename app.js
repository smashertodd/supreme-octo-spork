// --- CONFIGURATION ---
const LIBRARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=0&single=true&output=csv';
const TRACKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qVYjge6yFN9mLytjck09G66BTF8bM5_PCrcoQ5G8z-ilwEJ3L-uYLOEqzf8hAPCAFRyV8fRR0Ho0/pub?gid=744485282&single=true&output=csv';
const TRACKING_URL = 'https://script.google.com/macros/s/AKfycbyL4Ws4DK8UH_VbTE_4ENW9vmy7WRkIly71NfPLDm2CF3oeBf91jUOTkXuSJtJWiWMEHQ/exec';

// Pastel colors with dark text mapping
const COLORS = ['#f9a8d4', '#d8b4fe', '#a5b4fc', '#7dd3fc', '#5eead4', '#86efac', '#fde047', '#fdba74', '#fca5a5', '#c4b5fd'];

// --- APP STATE ---
let state = {
    activities: [],
    currentUser: '',
    isTeacher: false,
    currentActivity: null,
    attempts: 0,
    trackingInterval: null
};

// --- INITIALIZATION ---
async function init() {
    await loadData();
    renderLogin();
}

// --- DATA LOADING & PARSING ---
async function loadData() {
    try {
        const response = await fetch(LIBRARY_CSV_URL);
        const csvText = await response.text();
        state.activities = parseCSV(csvText);
    } catch (error) {
        console.error("Error loading library data:", error);
        alert("Failed to load activities. Please check your Google Sheet connection.");
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    let parsedActivities = [];
    let currentActivity = null;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle commas inside quotes properly
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cleanRow = row.map(cell => cell.replace(/^"|"$/g, '').trim());

        const title = cleanRow[headers.indexOf('Title')] || '';
        const type = cleanRow[headers.indexOf('Type')] || '';
        const text = cleanRow[headers.indexOf('Text')] || '';
        const label = cleanRow[headers.indexOf('Label')] || '';
        const overallHint = cleanRow[headers.indexOf('Overall_Hint')] || '';
        const status = cleanRow[headers.indexOf('Status')] || '';

        if (title && title !== (currentActivity ? currentActivity.title : '')) {
            if (currentActivity) parsedActivities.push(currentActivity);
            currentActivity = {
                title: title,
                type: type,
                overallHint: overallHint,
                parts: [],
                labels: [],
                distractors: [],
                isDualMode: false 
            };
        }

        if (currentActivity) {
            // Check for distractor in either Type or Status column
            if (type.toLowerCase().includes('distractor') || status.toLowerCase().includes('distractor')) {
                if (label) currentActivity.distractors.push(label);
            } else {
                if (text) {
                    currentActivity.parts.push(text);
                    if (text.includes('___')) currentActivity.isDualMode = true;
                }
                if (label) currentActivity.labels.push(label);
            }
            
            if (!currentActivity.type && type) currentActivity.type = type;
            if (!currentActivity.overallHint && overallHint) currentActivity.overallHint = overallHint;
        }
    }
    if (currentActivity) parsedActivities.push(currentActivity);
    return parsedActivities;
}

// --- SCREENS ---

function renderLogin() {
    const app = document.getElementById('app');
    app.className = "min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#2e2366] text-gray-800 relative font-sans flex flex-col items-center justify-center p-4";
    app.innerHTML = `
        <!-- Neon Top Bar -->
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>

        <!-- The Lovely Neon Toggle for Teacher Login -->
        <div class="absolute top-6 right-6 flex items-center space-x-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <span class="text-white text-sm font-medium">Student</span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="roleToggle" class="sr-only peer" onchange="handleRoleToggle(this)">
                <div class="w-14 h-7 bg-indigo-950/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500 shadow-[0_0_10px_rgba(236,72,153,0.3)] peer-checked:shadow-[0_0_15px_rgba(236,72,153,0.8)] border border-indigo-400/30"></div>
            </label>
            <span class="text-pink-300 text-sm font-medium drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">Teacher</span>
        </div>

        <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-white/20 text-center relative overflow-hidden">
            <div class="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl"></div>
            <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            
            <h1 class="text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-sm relative z-10">Welcome</h1>
            <input type="text" id="studentName" placeholder="Enter your first name" class="w-full p-4 mb-6 rounded-xl border-2 border-indigo-300/30 bg-indigo-900/40 text-white placeholder-indigo-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-400 outline-none transition-all text-lg text-center shadow-inner relative z-10">
            <button onclick="login()" class="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-400 hover:to-purple-500 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(236,72,153,0.4)] text-lg relative z-10">
                Start Activities
            </button>
        </div>
    `;
}

window.handleRoleToggle = function(checkbox) {
    if (checkbox.checked) {
        const pin = prompt("Enter Teacher PIN to access dashboard:");
        if (pin === "@pple") {
            state.isTeacher = true;
            state.currentUser = "Teacher";
            renderTeacherDashboard();
        } else {
            alert("Incorrect PIN.");
            checkbox.checked = false; // flip back to student
        }
    }
};

function login() {
    const nameInput = document.getElementById('studentName').value.trim();
    if (!nameInput) {
        alert("Please enter your name.");
        return;
    }
    state.currentUser = nameInput;
    state.isTeacher = false;
    renderActivityDashboard();
}

function renderActivityDashboard() {
    const app = document.getElementById('app');
    app.className = "min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#2e2366] text-gray-800 relative font-sans p-8";
    
    let html = `
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>
        <div class="w-full max-w-[1600px] mx-auto pt-4">
            <div class="flex justify-between items-center mb-10">
                <h1 class="text-4xl font-extrabold text-white">Student Dashboard</h1>
                <div class="flex items-center space-x-4">
                    <span class="text-pink-300 font-medium">Hello, ${state.currentUser}</span>
                    <button onclick="renderLogin()" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 backdrop-blur transition-all text-sm">Logout</button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    `;

    state.activities.forEach((activity, index) => {
        html += `
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between" onclick="openActivity(${index})">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-2">${activity.title}</h3>
                    <span class="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-semibold mb-4 border border-pink-500/30">
                        ${activity.type.includes('Categorisation') || activity.type.includes('Categorize') ? 'Categorisation' : 'Gap-Fill'}
                    </span>
                </div>
                <button class="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-2 rounded-lg hover:from-pink-400 hover:to-purple-500 transition-all shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    Start Activity
                </button>
            </div>
        `;
    });

    html += `</div></div>`;
    app.innerHTML = html;
}

// --- ACTIVITY RENDERING ---

function openActivity(index) {
    state.currentActivity = state.activities[index];
    state.attempts = 0;
    
    const isCategorisation = state.currentActivity.type.toLowerCase().includes('categorisation') || state.currentActivity.type.toLowerCase().includes('categorize');

    if (isCategorisation) {
        renderCategorisationActivity();
    } else {
        renderStandardGapFillActivity();
    }
}

// 1. CATEGORISATION LAYOUT (Matches the PERFECT Screenshot exactly)
function renderCategorisationActivity() {
    const activity = state.currentActivity;
    const app = document.getElementById('app');
    app.className = "min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#2e2366] text-gray-800 relative font-sans pt-12 pb-8 px-4 md:px-8";
    
    let html = `
        <!-- Neon Top Bar -->
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>
        
        <!-- Wide Container filling the screen nicely -->
        <div class="w-full max-w-[1600px] mx-auto">
            
            <!-- Header area matching screenshot -->
            <div class="flex justify-between items-start mb-8">
                <div>
                    <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-2 drop-shadow-sm">${activity.title}</h1>
                    <p class="text-indigo-200 text-sm">Drag the correct words/phrases into the gaps. Watch out for distractors!</p>
                </div>
                <button onclick="renderActivityDashboard()" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 backdrop-blur transition-all text-sm font-medium shadow-lg">
                    ← All activities
                </button>
            </div>

            <!-- Main Layout: 1 Column Left (Choices), 3 Columns Right (Text) -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                <!-- Choices Panel -->
                <div class="lg:col-span-1 bg-gray-50 rounded-xl shadow-2xl p-6 border border-gray-200">
                    <h3 class="font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">Choices</h3>
                    <div id="choices-container" class="space-y-3 min-h-[300px]">
                        ${renderChips(activity.labels, activity.distractors)}
                    </div>
                </div>

                <!-- Paragraph Labels Panel -->
                <div class="lg:col-span-3 bg-white rounded-xl shadow-2xl p-8 border border-gray-200 relative overflow-hidden">
                    <h3 class="font-bold text-gray-800 mb-8 pb-2 border-b-2 border-gray-200">Paragraph Labels</h3>
                    
                    <div class="text-gray-800 leading-loose space-y-8 text-[17px]">
                        ${renderCategorisationText(activity)}
                    </div>

                    <div class="mt-12 flex justify-between items-center border-t border-gray-100 pt-6">
                        <button onclick="checkAnswers()" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] transition-all transform hover:-translate-y-0.5">
                            Check Answers
                        </button>
                        ${activity.overallHint ? `<button onclick="alert('${activity.overallHint.replace(/'/g, "\\'")}')" class="text-pink-500 hover:text-pink-600 font-semibold text-sm underline decoration-pink-300 underline-offset-4">Need a general hint?</button>` : ''}
                    </div>
                    <div id="feedback" class="mt-4 font-bold text-lg text-center hidden"></div>
                </div>
            </div>
        </div>
    `;
    app.innerHTML = html;
}

// Renders the blocky categorisation text with gaps ABOVE the text segments
function renderCategorisationText(activity) {
    let textHtml = '';
    
    if (activity.isDualMode) {
        // Teacher used ___ gaps. Split exactly on them.
        const fullText = activity.parts.join(' ');
        const segments = fullText.split('___');
        
        segments.forEach((segment, index) => {
            if (index < segments.length - 1) {
                // Gap goes ABOVE the text segment
                textHtml += `
                    <div class="mb-6">
                        <div id="gap-${index}" class="drop-zone block w-56 h-[42px] border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-md mb-3 transition-all duration-200" ondrop="drop(event)" ondragover="allowDrop(event)" data-answer="${activity.labels[index]}"></div>
                        <div class="text-gray-800 leading-relaxed">${segment.trim()}</div>
                    </div>
                `;
            } else if (segment.trim().length > 0) {
                // Final piece of text
                textHtml += `<div class="text-gray-800 leading-relaxed">${segment.trim()}</div>`;
            }
        });
    } else {
        // Fallback: One gap per part
        activity.parts.forEach((part, index) => {
            textHtml += `
                <div class="mb-6">
                    <div id="gap-${index}" class="drop-zone block w-56 h-[42px] border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-md mb-3 transition-all duration-200" ondrop="drop(event)" ondragover="allowDrop(event)" data-answer="${activity.labels[index]}"></div>
                    <div class="text-gray-800 leading-relaxed">${part}</div>
                </div>
            `;
        });
    }
    return textHtml;
}

// 2. STANDARD GAP-FILL LAYOUT (Flowing inline text)
function renderStandardGapFillActivity() {
    const activity = state.currentActivity;
    const app = document.getElementById('app');
    app.className = "min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#2e2366] text-gray-800 relative font-sans pt-12 pb-8 px-4 md:px-8";
    
    let html = `
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>
        
        <div class="w-full max-w-[1600px] mx-auto">
            <div class="flex justify-between items-start mb-8">
                <div>
                    <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-2 drop-shadow-sm">${activity.title}</h1>
                    <p class="text-indigo-200 text-sm">Drag the correct phrases into the gaps.</p>
                </div>
                <button onclick="renderActivityDashboard()" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 backdrop-blur transition-all text-sm font-medium shadow-lg">
                    ← All activities
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-1 bg-gray-50 rounded-xl shadow-2xl p-6 border border-gray-200">
                    <h3 class="font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">Word Bank</h3>
                    <div id="choices-container" class="space-y-3 min-h-[300px]">
                        ${renderChips(activity.labels, activity.distractors)}
                    </div>
                </div>

                <div class="lg:col-span-3 bg-white rounded-xl shadow-2xl p-10 border border-gray-200">
                    <div class="text-gray-800 leading-[2.5] text-[18px]">
                        ${renderInlineGapFillText(activity)}
                    </div>

                    <div class="mt-12 flex justify-between items-center border-t border-gray-100 pt-6">
                        <button onclick="checkAnswers()" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] transition-all transform hover:-translate-y-0.5">
                            Check Answers
                        </button>
                    </div>
                    <div id="feedback" class="mt-4 font-bold text-lg text-center hidden"></div>
                </div>
            </div>
        </div>
    `;
    app.innerHTML = html;
}

// Renders continuous flowing text with inline gaps
function renderInlineGapFillText(activity) {
    const fullText = activity.parts.join(' ');
    const segments = fullText.split('___');
    let textHtml = '';
    
    segments.forEach((segment, index) => {
        textHtml += `<span>${segment}</span>`;
        if (index < segments.length - 1) {
            textHtml += `<div id="gap-${index}" class="drop-zone inline-block min-w-[160px] h-[38px] border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-md align-middle mx-2 transition-all duration-200" ondrop="drop(event)" ondragover="allowDrop(event)" data-answer="${activity.labels[index]}"></div>`;
        }
    });
    return textHtml;
}


// --- SHARED DRAG & DROP LOGIC ---

function renderChips(labels, distractors) {
    let allChips = [...labels, ...distractors];
    // Shuffle array
    for (let i = allChips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allChips[i], allChips[j]] = [allChips[j], allChips[i]];
    }

    return allChips.map((label, index) => {
        const color = COLORS[index % COLORS.length];
        // NOTE: Soft rounded corners (rounded-md), NOT circles. Dark text for contrast.
        return `<div draggable="true" id="chip-${index}" 
             class="cursor-grab active:cursor-grabbing px-4 py-3 rounded-md text-[15px] font-semibold text-gray-900 shadow-sm hover:shadow-md transition-all text-center border border-black/5" 
             style="background-color: ${color};"
             ondragstart="drag(event)">
            ${label}
        </div>`;
    }).join('');
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target.closest('.drop-zone');

    if (dropZone) {
        if (dropZone.children.length > 0) {
            const existingChip = dropZone.children[0];
            document.getElementById('choices-container').appendChild(existingChip);
        }
        
        dropZone.appendChild(draggedElement);
        // Remove dashed border when filled to look clean
        dropZone.classList.remove('border-2', 'border-dashed', 'border-indigo-400', 'bg-indigo-50/50');
        draggedElement.className = "cursor-pointer px-4 py-1.5 rounded-md text-[15px] font-semibold text-gray-900 w-full h-full flex items-center justify-center m-0 border border-black/5";
        draggedElement.onclick = () => returnToChoices(draggedElement, dropZone);
    }
}

function returnToChoices(chip, dropZone) {
    document.getElementById('choices-container').appendChild(chip);
    chip.onclick = null;
    chip.className = "cursor-grab active:cursor-grabbing px-4 py-3 rounded-md text-[15px] font-semibold text-gray-900 shadow-sm hover:shadow-md transition-all text-center border border-black/5";
    // Restore dashed border when empty
    dropZone.classList.add('border-2', 'border-dashed', 'border-indigo-400', 'bg-indigo-50/50');
}


// --- CHECKING & TRACKING ---

function checkAnswers() {
    state.attempts++;
    const gaps = document.querySelectorAll('.drop-zone');
    let correctCount = 0;
    const totalGaps = gaps.length;

    gaps.forEach(gap => {
        const correctAnswer = gap.getAttribute('data-answer');
        const child = gap.children[0];
        
        if (child) {
            const studentAnswer = child.innerText.trim();
            if (studentAnswer === correctAnswer) {
                correctCount++;
                child.style.backgroundColor = '#86efac'; // Success green
                child.draggable = false;
                child.onclick = null;
                child.style.cursor = 'default';
            } else {
                returnToChoices(child, gap);
            }
        }
    });

    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    
    let statusText = "";
    if (correctCount === totalGaps) {
        statusText = "Completed";
        feedback.innerHTML = `🎉 Perfect! You got all ${totalGaps} correct!`;
        feedback.className = "mt-6 font-bold text-xl text-center text-green-600 bg-green-50 py-3 rounded-lg border border-green-200";
        sendTrackingData(statusText, `Got ${correctCount}/${totalGaps} in ${state.attempts} attempts.`);
        setTimeout(() => renderActivityDashboard(), 3000);
    } else {
        statusText = "In Progress";
        const hasDistractors = state.currentActivity.distractors && state.currentActivity.distractors.length > 0;
        let tryAgainMsg = `You got ${correctCount} out of ${totalGaps} correct. Incorrect answers have been returned to the choices. Try again!`;
        if (hasDistractors) {
            tryAgainMsg += " Watch out for those distractors!";
        }
        feedback.innerHTML = `⚠️ ${tryAgainMsg}`;
        feedback.className = "mt-6 font-bold text-lg text-center text-amber-600 bg-amber-50 py-3 px-4 rounded-lg border border-amber-200";
        sendTrackingData(statusText, `Currently ${correctCount}/${totalGaps} on attempt ${state.attempts}.`);
    }
}

function sendTrackingData(status, details) {
    if (state.currentUser === 'Teacher') return;
    const data = {
        name: state.currentUser,
        gameId: state.currentActivity.title,
        attempt: state.attempts,
        status: status,
        details: details
    };

    fetch(TRACKING_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(error => console.error("Tracking Error:", error));
}


// --- TEACHER DASHBOARD ---

function renderTeacherDashboard() {
    const app = document.getElementById('app');
    app.className = "min-h-screen bg-gray-50 text-gray-800 font-sans p-8";
    app.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h1 class="text-3xl font-bold text-indigo-900">Teacher Dashboard</h1>
                <div class="flex space-x-4">
                    <button onclick="renderLogin()" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Logout</button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-indigo-900">Live Student Progress</h2>
                    <span class="text-xs font-medium text-indigo-500 bg-indigo-100 px-2 py-1 rounded-full uppercase tracking-wider">Auto-updates every 15s</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Timestamp</th>
                                <th class="p-4 font-semibold">Student Name</th>
                                <th class="p-4 font-semibold">Activity Title</th>
                                <th class="p-4 font-semibold">Attempt #</th>
                                <th class="p-4 font-semibold">Status</th>
                                <th class="p-4 font-semibold">Details</th>
                            </tr>
                        </thead>
                        <tbody id="tracking-body" class="divide-y divide-gray-100">
                            <tr><td colspan="6" class="p-8 text-center text-gray-400">Loading tracking data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetchTrackingData();
    if (state.trackingInterval) clearInterval(state.trackingInterval);
    state.trackingInterval = setInterval(fetchTrackingData, 15000);
}

async function fetchTrackingData() {
    if (!state.isTeacher) {
        clearInterval(state.trackingInterval);
        return;
    }
    try {
        const response = await fetch(TRACKING_CSV_URL);
        const text = await response.text();
        const rows = text.split('\n').slice(1).reverse();
        
        const tbody = document.getElementById('tracking-body');
        tbody.innerHTML = '';
        
        if (rows.length === 0 || (rows.length === 1 && rows[0].trim() === '')) {
             tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No student data yet.</td></tr>';
             return;
        }

        rows.forEach(row => {
            if (!row.trim()) return;
            const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            
            let statusBadge = '';
            if (cleanCols[4] === 'Completed') {
                statusBadge = '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide">Completed</span>';
            } else {
                statusBadge = '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide">In Progress</span>';
            }

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-4 text-sm text-gray-500">${cleanCols[0] || ''}</td>
                    <td class="p-4 font-medium text-gray-900">${cleanCols[1] || ''}</td>
                    <td class="p-4 text-indigo-600 font-medium">${cleanCols[2] || ''}</td>
                    <td class="p-4 text-center font-bold text-gray-700">${cleanCols[3] || ''}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-sm text-gray-600">${cleanCols[5] || ''}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching tracking data:", error);
    }
}

// Start app
window.onload = init;
