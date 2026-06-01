/* ============================================== Fix the Paragraph —
style.css ============================================== */

:root { –primary: #4f46e5; –primary-hover: #4338ca; –success: #10b981;
–danger: #ef4444; –warn-bg: #fef3c7; –warn-text: #92400e; –bg: #f3f4f6;
–surface: #ffffff; –border: #e5e7eb; –text: #1f2937; –muted: #6b7280; }

, ::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { font-family: ‘Segoe UI’, system-ui, sans-serif; background:
var(–bg); color: var(–text); min-height: 100vh; }

/* —- NAV —- */ nav { background: var(–primary); color: white; display:
flex; align-items: center; justify-content: space-between; padding: 0
24px; height: 56px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); } nav
.nav-title { font-size: 20px; font-weight: 700; letter-spacing: -0.3px;
} nav .nav-tabs { display: flex; gap: 6px; } nav .nav-tab { background:
transparent; border: 2px solid rgba(255,255,255,0.4); color: white;
padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight:
600; cursor: pointer; transition: all 0.2s; } nav .nav-tab:hover {
background: rgba(255,255,255,0.15); } nav .nav-tab.active { background:
white; color: var(–primary); border-color: white; }

/* —- SCREENS —- */ .screen { display: none; } .screen.active { display:
block; }

/* —- NAME MODAL —- */ .modal-backdrop { position: fixed; inset: 0;
background: rgba(0,0,0,0.55); display: flex; align-items: center;
justify-content: center; z-index: 200; opacity: 0; pointer-events: none;
transition: opacity 0.25s; } .modal-backdrop.open { opacity: 1;
pointer-events: auto; } .modal-box { background: white; border-radius:
16px; padding: 40px 36px; max-width: 420px; width: 92%; box-shadow: 0
25px 50px rgba(0,0,0,0.2); transform: translateY(24px); transition:
transform 0.25s; text-align: center; } .modal-backdrop.open .modal-box {
transform: translateY(0); } .modal-box h2 { font-size: 24px;
font-weight: 700; margin-bottom: 8px; color: var(–text); } .modal-box p
{ color: var(–muted); margin-bottom: 20px; } .modal-box input { width:
100%; padding: 12px 16px; border: 2px solid var(–border); border-radius:
8px; font-size: 16px; outline: none; transition: border-color 0.2s;
margin-bottom: 16px; } .modal-box input:focus { border-color:
var(–primary); } .modal-box .hint-icon { font-size: 48px; margin-bottom:
12px; } .modal-box .hint-body { font-size: 17px; line-height: 1.6;
color: #374151; margin-bottom: 24px; } .modal-box .hint-label {
font-size: 13px; font-weight: 700; color: #d97706; text-transform:
uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }

/* —- BUTTONS —- */ .btn { display: inline-flex; align-items: center;
justify-content: center; gap: 6px; padding: 11px 24px; border-radius:
8px; font-size: 15px; font-weight: 600; cursor: pointer; border: none;
transition: all 0.18s; text-decoration: none; } .btn-primary {
background: var(–primary); color: white; } .btn-primary:hover {
background: var(–primary-hover); } .btn-success { background:
var(–success); color: white; } .btn-success:hover { background: #059669;
} .btn-danger { background: var(–danger); color: white; }
.btn-danger:hover { background: #dc2626; } .btn-outline { background:
transparent; color: var(–primary); border: 2px solid var(–primary); }
.btn-outline:hover { background: var(–primary); color: white; }
.btn-ghost { background: transparent; color: var(–muted); border: 2px
solid var(–border); } .btn-ghost:hover { border-color: var(–primary);
color: var(–primary); } .btn-full { width: 100%; } .btn-lg { padding:
14px 32px; font-size: 17px; border-radius: 10px; }

/* —- GAME SCREEN —- */ .game-wrapper { max-width: 860px; margin: 0
auto; padding: 28px 20px; } .game-header { display: flex;
justify-content: space-between; align-items: flex-start; margin-bottom:
20px; gap: 16px; flex-wrap: wrap; } .game-header h1 { font-size: 22px;
font-weight: 700; color: var(–text); } .student-badge { font-size: 13px;
color: var(–muted); background: var(–border); padding: 5px 12px;
border-radius: 20px; white-space: nowrap; } .student-badge span { color:
var(–primary); font-weight: 700; }

/* —- DISTRACTOR WARNING —- */ .distractor-banner { background:
var(–warn-bg); color: var(–warn-text); border: 1px solid #fbbf24;
border-radius: 8px; padding: 10px 16px; font-weight: 600; font-size:
14px; margin-bottom: 20px; display: none; } .distractor-banner.visible {
display: block; }

/* —- LIVE PREVIEW —- */ .preview-panel { background: white; border: 2px
solid var(–border); border-radius: 10px; padding: 20px 24px;
margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.preview-label { font-size: 11px; font-weight: 700; color: #9ca3af;
text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
} .preview-text { font-size: 17px; line-height: 2.1; color: #111827;
min-height: 40px; } .flow-chunk { display: inline; border-radius: 4px;
padding: 2px 6px; box-decoration-break: clone;
-webkit-box-decoration-break: clone; transition: background-color 0.5s
ease; } .flow-blank { display: inline-block; color: #9ca3af;
border-bottom: 2px dashed #d1d5db; padding: 0 20px; margin: 0 4px;
font-style: italic; font-size: 14px; }

/* —- BOARD —- */ .board { display: flex; flex-direction: column; gap:
10px; margin-bottom: 28px; } .board-row { display: flex; width: 100%;
min-height: 62px; } .sem-label { width: 148px; flex-shrink: 0; border:
2px solid #000; border-right: none; border-top-left-radius: 8px;
border-bottom-left-radius: 8px; display: flex; align-items: center;
justify-content: center; text-align: center; font-size: 13px;
font-weight: 700; padding: 8px; transition: background-color 0.5s, color
0.5s; } .drop-slot { flex-grow: 1; border: 2px dashed #cbd5e1;
border-left: none; border-top-right-radius: 8px;
border-bottom-right-radius: 8px; background: #f8fafc; padding: 6px;
display: flex; align-items: center; min-height: 62px; transition:
border-color 0.2s, background 0.2s; } .drop-slot.slot-filled {
border-style: solid; border-color: #e2e8f0; background: white; }
.drop-slot.slot-drag-over { border-color: var(–primary); background:
#eef2ff; }

/* —- POOL —- */ .pool-header { text-align: center; font-size: 12px;
font-weight: 700; color: var(–muted); text-transform: uppercase;
letter-spacing: 0.07em; margin-bottom: 12px; } .pool-area { background:
white; border: 2px solid var(–border); border-radius: 10px; padding:
20px; min-height: 90px; display: flex; flex-wrap: wrap; gap: 10px;
justify-content: center; margin-bottom: 24px; }

/* —- PART CARDS —- */ .part-card { background: white; border: 2px solid
#e5e7eb; padding: 11px 18px; border-radius: 8px; cursor: grab;
font-size: 15px; user-select: none; box-shadow: 0 2px 6px
rgba(0,0,0,0.07); transition: transform 0.12s, box-shadow 0.12s,
border-color 0.3s; display: flex; align-items: center; gap: 8px; }
.part-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform:
translateY(-1px); } .part-card:active { cursor: grabbing; transform:
scale(0.97); } .part-card.distractor { border-color: #fca5a5; }
.part-card.correct { border-color: var(–success) !important; }
.part-card .card-tick { color: var(–success); font-weight: 700; display:
none; } .part-card.correct .card-tick { display: inline; }

/* When card is in slot, make it take full width */ .drop-slot
.part-card { width: 100%; cursor: grab; }

/* —- CHECK ANSWER AREA —- */ .check-area { text-align: center;
margin-bottom: 40px; }

/* —- TOAST —- */ .toast-container { position: fixed; bottom: 24px;
left: 50%; transform: translateX(-50%); z-index: 500; display: flex;
flex-direction: column; gap: 8px; align-items: center; } .toast {
background: #1f2937; color: white; padding: 12px 24px; border-radius:
8px; font-size: 14px; font-weight: 500; box-shadow: 0 8px 24px
rgba(0,0,0,0.2); opacity: 0; transform: translateY(8px); transition: all
0.3s; } .toast.show { opacity: 1; transform: translateY(0); }
.toast.success { background: #065f46; } .toast.error { background:
#991b1b; }

/* —- TEACHER SCREEN —- */ .teacher-wrapper { max-width: 860px; margin:
0 auto; padding: 28px 20px; }

/* PIN Gate */ .pin-gate { max-width: 360px; margin: 60px auto;
background: white; border-radius: 16px; padding: 40px; text-align:
center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); } .pin-gate h2 {
font-size: 22px; font-weight: 700; margin-bottom: 8px; } .pin-gate p {
color: var(–muted); margin-bottom: 20px; font-size: 15px; } .pin-gate
input { width: 100%; padding: 12px; text-align: center; letter-spacing:
6px; font-size: 22px; border: 2px solid var(–border); border-radius:
8px; margin-bottom: 16px; outline: none; } .pin-gate input:focus {
border-color: var(–primary); } .pin-error { color: var(–danger);
font-size: 14px; margin-top: -8px; margin-bottom: 12px; display: none; }

/* Teacher Sub-tabs */ .sub-tabs { display: flex; border-bottom: 2px
solid var(–border); margin-bottom: 28px; gap: 0; } .sub-tab { padding:
10px 24px; font-size: 15px; font-weight: 600; cursor: pointer;
border-bottom: 3px solid transparent; margin-bottom: -2px; color:
var(–muted); background: none; border-top: none; border-left: none;
border-right: none; transition: color 0.2s; } .sub-tab.active { color:
var(–primary); border-bottom-color: var(–primary); } .sub-panel {
display: none; } .sub-panel.active { display: block; }

/* Session Summary */ .traffic-light { border-radius: 12px; padding:
20px 28px; display: flex; align-items: center; gap: 16px; margin-bottom:
24px; } .traffic-light.green { background: #d1fae5; border: 2px solid
#34d399; } .traffic-light.amber { background: #fef3c7; border: 2px solid
#f59e0b; } .traffic-light.red { background: #fee2e2; border: 2px solid
#f87171; } .tl-icon { font-size: 36px; } .tl-pct { font-size: 30px;
font-weight: 800; } .tl-label { font-size: 14px; font-weight: 600;
color: var(–muted); }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap:
12px; margin-bottom: 24px; } .stat-card { background: white; border: 2px
solid var(–border); border-radius: 10px; padding: 16px; text-align:
center; } .stat-num { font-size: 32px; font-weight: 800; }
.stat-num.purple { color: #7c3aed; } .stat-num.green { color:
var(–success); } .stat-num.amber { color: #d97706; } .stat-desc {
font-size: 13px; color: var(–muted); margin-top: 2px; }

.student-list { display: flex; flex-direction: column; gap: 8px; }
.student-row { background: white; border: 1px solid var(–border);
border-radius: 8px; padding: 12px 16px; display: flex; justify-content:
space-between; align-items: center; } .student-row .sname { font-weight:
600; font-size: 15px; } .student-row .sdetail { font-size: 13px; color:
var(–muted); } .badge { padding: 3px 10px; border-radius: 12px;
font-size: 12px; font-weight: 700; } .badge-success { background:
#d1fae5; color: #065f46; } .badge-warn { background: #fef3c7; color:
#92400e; } .badge-neutral { background: #f3f4f6; color: #374151; }

.session-footer { margin-top: 20px; display: flex; justify-content:
space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.refresh-note { font-size: 13px; color: var(–muted); }

/* Create Activity */ .create-form { background: white; border: 2px
solid var(–border); border-radius: 12px; padding: 28px; } .create-form
p.sub { color: var(–muted); font-size: 14px; margin-bottom: 20px; }
.create-table { width: 100%; border-collapse: collapse; } .create-table
th { text-align: left; font-size: 12px; font-weight: 700; color:
var(–muted); text-transform: uppercase; letter-spacing: 0.06em; padding:
0 8px 10px; } .create-table th:first-child { width: 36px; padding-left:
0; } .create-table td { padding: 4px 6px; vertical-align: middle; }
.create-table td:first-child { padding-left: 0; color: var(–muted);
font-weight: 600; text-align: center; } .create-table input { width:
100%; padding: 9px 12px; border: 2px solid var(–border); border-radius:
6px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.create-table input:focus { border-color: var(–primary); } .create-table
.del-btn { background: none; border: none; color: #f87171; font-size:
18px; cursor: pointer; padding: 4px 8px; line-height: 1; } .create-table
.del-btn:hover { color: var(–danger); } .create-actions { margin-top:
20px; display: flex; gap: 10px; flex-wrap: wrap; }

/* Generated link output */ .link-output { background: #f0fdf4; border:
2px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-top:
20px; word-break: break-all; font-size: 14px; line-height: 1.6; display:
none; } .link-output.visible { display: block; } .link-output strong {
display: block; margin-bottom: 6px; color: #065f46; } .link-output a {
color: var(–primary); }

/* —- COMPLETION STATE —- */ .board-row.completed .sem-label {
border-color: transparent; } .board-row.completed .drop-slot {
border-color: transparent; background: transparent; }
.board-row.completed .part-card { border-color: transparent !important;
box-shadow: none; font-weight: 600; }

/* —- RESPONSIVE —- */ @media (max-width: 600px) { .sem-label { width:
100px; font-size: 11px; } .stats-grid { grid-template-columns: 1fr 1fr;
} nav .nav-title { font-size: 16px; } }
