// ═══════════════════════════════════════════════
//  api.js — Estado global, llamadas API y Socket.io
// ═══════════════════════════════════════════════

const API = '/api';

const AppState = {
  token:    null,
  role:     null,
  username: null,
  player:   null,
};

let socket = null;

async function apiCall(endpoint, method, body) {
  method = method || 'GET';
  const headers = { 'Content-Type': 'application/json' };
  if (AppState.token) headers['Authorization'] = 'Bearer ' + AppState.token;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(API + endpoint, options);
  const data     = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

// ─── AUTH ─────────────────────────────────────────────────
async function login(username, password) {
  const data = await apiCall('/auth/login', 'POST', { username, password });
  AppState.token    = data.token;
  AppState.role     = data.role;
  AppState.username = data.username;
  AppState.player   = data.player || null;
  return data;
}

// ─── PLAYERS ──────────────────────────────────────────────
function getPlayers()              { return apiCall('/players'); }
function createPlayer(u, p, cls)   { return apiCall('/players/create',      'POST', { username:u, password:p, cls }); }
function grantPoints(u, pts)       { return apiCall('/players/grant-points', 'POST', { username:u, points:pts }); }
function upgradePlayer(upgrades)   { return apiCall('/players/upgrade',      'POST', { upgrades }); }
function buySkill(skillId)         { return apiCall('/players/buy-skill',    'POST', { skillId }); }
function setLoadout(loadout)       { return apiCall('/players/set-loadout',  'POST', { loadout }); }
function resetPoints()             { return apiCall('/players/reset-points', 'POST'); }
function deletePlayer(u)           { return apiCall('/players/' + u,         'DELETE'); }

// ─── BATTLE ───────────────────────────────────────────────
function getMatches()                 { return apiCall('/battle/matches'); }
function getMatch(id)                 { return apiCall('/battle/match/' + id); }
function createMatch(p1, p2)          { return apiCall('/battle/create-match', 'POST', { player1:p1, player2:p2 }); }
function sendAction(matchId, skillId) { return apiCall('/battle/action',       'POST', { matchId, skillId }); }
function deleteMatch(id)              { return apiCall('/battle/match/' + id,  'DELETE'); }
function clearAllMatches()            { return apiCall('/battle/matches',        'DELETE'); }

// ─── SOCKET.IO ────────────────────────────────────────────
function initSocket() {
  socket = io();

  socket.on('connect', function() {
    socket.emit('auth', AppState.token);
  });

  socket.on('battle-invite', function(data) {
    showToast('⚔ ¡Nuevo combate vs ' + data.opponent + '!');
    if (typeof openBattle === 'function') openBattle(data.matchId);
  });

  socket.on('match-update', function(data) {
    if (typeof onMatchUpdate === 'function') onMatchUpdate(data);
  });

  socket.on('match-created', function(data) {
    if (typeof onMatchCreated === 'function') onMatchCreated(data);
  });
}

// ─── UTILIDADES UI ────────────────────────────────────────
var toastTimer = null;
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  var target = document.getElementById(name + '-view');
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.nav-btn[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  if (name === 'hero'        && typeof renderHero        === 'function') renderHero();
  if (name === 'leaderboard' && typeof renderLeaderboard === 'function') renderLeaderboard();
  if (name === 'teacher'     && typeof renderTeacher     === 'function') renderTeacher();
  if (name === 'matches'     && typeof renderMatches     === 'function') renderMatches();
}