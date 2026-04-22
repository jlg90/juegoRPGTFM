// ═══════════════════════════════════════════════
//  teacher.js — Panel del docente
//  Incluye vista en tiempo real de combates activos
// ═══════════════════════════════════════════════

var newStudentClass  = 'mage';
var teacherWatchId   = null;   // matchId que el docente está viendo
var teacherRefreshId = null;   // setInterval de refresco de la vista docente

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn-create-student').addEventListener('click', handleCreateStudent);
  document.getElementById('btn-create-match').addEventListener('click',   handleCreateMatch);

  var classBtns = document.querySelectorAll('#teacher-class-grid .class-btn');
  for (var i = 0; i < classBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#teacher-class-grid .class-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        newStudentClass = btn.dataset.cls;
      });
    })(classBtns[i]);
  }
});

// ─── Render principal ─────────────────────────────────────
async function renderTeacher() {
  teacherWatchId = null;
  await renderStudentsList();
  await renderTeacherMatches();
}

// ─── Lista de alumnos ─────────────────────────────────────
async function renderStudentsList() {
  try {
    var players = await getPlayers();
    var entries = Object.values(players);
    var clsInfo = {
      mage:        {icon:'🧙',label:'Mago'},       warrior:    {icon:'⚔️',label:'Guerrero'},
      rogue:       {icon:'🗡️',label:'Pícaro'},      paladin:    {icon:'🛡️',label:'Paladín'},
      druid:       {icon:'🌿',label:'Druida'},      warlock:    {icon:'👹',label:'Brujo'},
      archer:      {icon:'🏹',label:'Arquero'},     necromancer:{icon:'💀',label:'Nigromante'},
    };
    var c = document.getElementById('students-list');
    if (!entries.length) {
      c.innerHTML = '<div style="color:var(--muted);font-style:italic;font-size:.85rem">Sin alumnos todavía.</div>';
    } else {
      c.innerHTML = entries.map(function(p) {
        var cls = clsInfo[p.cls] || {icon:'?',label:'?'};
        var loadoutStr = p.loadout ? p.loadout.length + '/4 ✓' : '—';
        return '<div class="student-row">' +
          '<div style="font-size:1.2rem">' + cls.icon + '</div>' +
          '<div class="student-info">' +
            '<div class="student-name">' + p.username + '</div>' +
            '<div class="student-meta">' + cls.label + ' · ' + (p.pts_available||0) + ' pts · W:' + (p.wins||0) + ' L:' + (p.losses||0) + ' · Loadout:' + loadoutStr + '</div>' +
          '</div>' +
          '<div class="student-btns">' +
            '<button class="btn btn-gold btn-sm" onclick="handleGrantPoints(\'' + p.username + '\')">±pts</button>' +
            '<button class="btn btn-red btn-sm"  onclick="handleDeleteStudent(\'' + p.username + '\')">✕</button>' +
          '</div></div>';
      }).join('');
    }
    var opts = '<option value="">Selecciona jugador...</option>' +
      entries.map(p => '<option value="' + p.username + '">' + p.username + '</option>').join('');
    document.getElementById('match-p1').innerHTML = opts;
    document.getElementById('match-p2').innerHTML = opts;
  } catch(err) { showToast(err.message); }
}

// ─── Lista de combates (con botón "Ver en directo") ───────
async function renderTeacherMatches() {
  try {
    var matches = await getMatches();
    var c = document.getElementById('teacher-matches');
    if (!matches.length) {
      c.innerHTML = '<div style="color:var(--muted);font-style:italic;font-size:.85rem">Sin combates.</div>';
      // Si hay un combate abierto cerrarlo
      var watchArea = document.getElementById('teacher-watch-area');
      if (watchArea) watchArea.classList.add('hidden');
      return;
    }
    matches.sort((a,b) => a.status===b.status?0:a.status==='active'?-1:1);
    c.innerHTML = matches.map(function(m) {
      var isActive = m.status === 'active';
      var badge = isActive
        ? '<span class="badge badge-green">Activo T' + (m.state?m.state.turn:'?') + '</span>'
        : '<span class="badge badge-red">Fin: ' + (m.winner||'empate') + '</span>';
      var watchBtn = isActive
        ? '<button class="btn btn-gold btn-sm" onclick="teacherWatchMatch(\'' + m.id + '\')">👁 Ver</button>'
        : '<button class="btn btn-ghost btn-sm" onclick="teacherWatchMatch(\'' + m.id + '\')">📜 Log</button>';
      return '<div class="student-row ' + (teacherWatchId===m.id?'teacher-watching':'') + '">' +
        '<div class="student-info">' +
          '<div class="student-name">' + m.player1 + ' vs ' + m.player2 + '</div>' +
          '<div class="student-meta">' + badge + '</div>' +
        '</div>' +
        '<div class="student-btns">' +
          watchBtn +
          '<button class="btn btn-red btn-sm" onclick="handleDeleteMatch(\'' + m.id + '\')">✕</button>' +
        '</div></div>';
    }).join('');
  } catch(err) { showToast(err.message); }
}

// ─── Vista en directo de un combate ─────────────────────
async function teacherWatchMatch(matchId) {
  teacherWatchId = matchId;
  var area = document.getElementById('teacher-watch-area');
  if (area) area.classList.remove('hidden');
  await renderTeacherMatchView(matchId);
  // Marcar fila como activa
  await renderTeacherMatches();
}

async function renderTeacherMatchView(matchId) {
  var area = document.getElementById('teacher-watch-area');
  if (!area) return;
  try {
    var m = await getMatch(matchId);
    var st = m.state;
    var p1 = st.p1, p2 = st.p2;

    // Función de barra HP
    function hpBar(ps) {
      var pct = Math.max(0, Math.round(ps.hp / ps.maxHp * 100));
      var color = pct > 50 ? '#00cc66' : pct > 25 ? '#cc8800' : '#cc2222';
      return '<div style="font-size:.75rem;color:var(--muted);margin-bottom:2px">' + ps.username + ' — ' + ps.hp + '/' + ps.maxHp + ' HP</div>' +
        '<div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;border:1px solid var(--border)">' +
        '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:3px;transition:width .5s"></div></div>';
    }

    // Función de buffs
    function buffTags(ps) {
      var names = {atk_up:'⚔+',def_up:'🛡+',shield:'🔮',evade:'💨',immune:'🌟',counter:'↩️',berserk:'😤',smoke:'💣',res_buff:'🌅'};
      var tags = '';
      if (ps.buffs) Object.keys(ps.buffs).forEach(k => {
        if (!ps.buffs[k]) return;
        var t = (ps.buffs[k]&&typeof ps.buffs[k]==='object'&&ps.buffs[k].turns!==undefined)?'('+ps.buffs[k].turns+')':'';
        tags += '<span class="bs-buff-tag">' + (names[k]||k) + t + '</span> ';
      });
      if (ps.poison) tags += '<span class="bs-buff-tag poison">☠(' + ps.poison.turns + ')</span>';
      if (ps.status) tags += '<span class="bs-buff-tag ' + ps.status + '">' + ps.status + '</span>';
      return tags || '<span style="color:var(--dim);font-size:.7rem">sin buffs</span>';
    }

    // Estado del turno
    var phaseLabel = m.status === 'finished'
      ? '🏁 Combate terminado'
      : (st.phase === 'choosing' ? '⏱ Eligiendo habilidades...' : '⚙ Resolviendo...');

    var timerStr = '';
    if (m.status === 'active' && st.timerStart) {
      var rem = Math.max(0, 30 - Math.floor((Date.now() - st.timerStart) / 1000));
      timerStr = '<span style="font-family:Cinzel,serif;color:' + (rem<10?'var(--red-l)':'var(--gold)') + ';font-size:1.1rem">' + rem + 's</span>';
    }

    var html = '<div class="teacher-watch-header">' +
      '<span class="teacher-watch-title">👁 ' + p1.username + ' vs ' + p2.username + ' — Turno ' + st.turn + '</span>' +
      '<span>' + phaseLabel + ' ' + timerStr + '</span>' +
      '<button class="btn btn-ghost btn-sm" onclick="teacherCloseWatch()">✕ Cerrar</button>' +
      '</div>' +
      '<div class="teacher-watch-arena">' +
        '<div class="teacher-combatant">' +
          '<div class="teacher-combatant-name">🧙 ' + p1.username + '</div>' +
          hpBar(p1) +
          '<div style="margin-top:.4rem;font-size:.72rem">Habilidades: ' + (p1.skills||[]).join(', ') + '</div>' +
          '<div style="margin-top:.2rem">' + buffTags(p1) + '</div>' +
        '</div>' +
        '<div class="teacher-vs">⚔</div>' +
        '<div class="teacher-combatant">' +
          '<div class="teacher-combatant-name">🧙 ' + p2.username + '</div>' +
          hpBar(p2) +
          '<div style="margin-top:.4rem;font-size:.72rem">Habilidades: ' + (p2.skills||[]).join(', ') + '</div>' +
          '<div style="margin-top:.2rem">' + buffTags(p2) + '</div>' +
        '</div>' +
      '</div>';

    if (m.status === 'finished') {
      html += '<div style="text-align:center;padding:.8rem;font-family:Cinzel,serif;color:var(--gold)">🏆 Ganador: ' + (m.winner||'empate') + '</div>';
    }

    // Log reciente (últimas 5 entradas)
    var recentLog = (st.log||[]).slice(0, 5);
    html += '<div class="teacher-watch-log">' +
      '<div style="font-family:Cinzel,serif;font-size:.75rem;color:var(--gold);margin-bottom:.4rem">📜 Últimas jugadas</div>' +
      recentLog.map(l => '<div class="log-line">' + l + '</div>').join('') +
      '</div>';

    area.innerHTML = html;
  } catch(err) {
    area.innerHTML = '<div style="color:var(--muted);padding:.8rem">Error al cargar el combate.</div>';
  }
}

function teacherCloseWatch() {
  teacherWatchId = null;
  var area = document.getElementById('teacher-watch-area');
  if (area) area.classList.add('hidden');
  renderTeacherMatches();
}

// ─── Callbacks Socket.io ──────────────────────────────────
function onMatchUpdate(data) {
  // El docente actualiza su panel cuando llega cualquier evento de combate
  if (AppState.role !== 'teacher') return;
  renderTeacherMatches();
  // Si el docente está viendo ese combate en directo, refresca la vista
  if (teacherWatchId && (data.matchId === teacherWatchId || data.type === 'turn-resolved')) {
    renderTeacherMatchView(teacherWatchId);
  }
}

function onMatchCreated(data) {
  var tv = document.getElementById('teacher-view');
  if (tv && !tv.classList.contains('hidden')) renderTeacherMatches();
}

// ─── Acciones del docente ─────────────────────────────────
async function handleCreateStudent() {
  var username = document.getElementById('new-name').value.trim();
  var password = document.getElementById('new-pass').value;
  if (!username || !password) { showToast('Rellena nombre y contraseña'); return; }
  try {
    await createPlayer(username, password, newStudentClass);
    showToast('Alumno creado: ' + username);
    document.getElementById('new-name').value = '';
    document.getElementById('new-pass').value = '';
    await renderStudentsList();
  } catch(err) { showToast(err.message); }
}

async function handleGrantPoints(username) {
  var input = prompt('Puntos para ' + username + ' (número negativo para quitar):', '1');
  if (input === null) return;
  var pts = parseInt(input, 10);
  if (isNaN(pts) || pts === 0) { showToast('Número no válido'); return; }
  try {
    await grantPoints(username, pts);
    showToast((pts > 0 ? '+' : '') + pts + ' pts → ' + username);
    await renderStudentsList();
  } catch(err) { showToast(err.message); }
}

async function handleDeleteStudent(username) {
  if (!confirm('¿Eliminar a ' + username + '?')) return;
  try {
    await deletePlayer(username);
    showToast('Alumno eliminado');
    await renderStudentsList();
  } catch(err) { showToast(err.message); }
}

async function handleCreateMatch() {
  var p1 = document.getElementById('match-p1').value;
  var p2 = document.getElementById('match-p2').value;
  if (!p1||!p2) { showToast('Selecciona dos jugadores'); return; }
  if (p1===p2)  { showToast('No puede ser el mismo jugador'); return; }
  try {
    await createMatch(p1, p2);
    showToast('Combate creado: ' + p1 + ' vs ' + p2);
    await renderTeacherMatches();
  } catch(err) { showToast(err.message); }
}

async function handleDeleteMatch(id) {
  if (!confirm('¿Eliminar este combate?')) return;
  try {
    await deleteMatch(id);
    showToast('Combate eliminado');
    if (teacherWatchId === id) teacherCloseWatch();
    await renderTeacherMatches();
  } catch(err) { showToast(err.message); }
}
// ─── Eliminar todos los combates ─────────────────────────
async function handleClearAllMatches() {
  if (!confirm('¿Eliminar TODOS los combates? Esta acción no se puede deshacer.')) return;
  try {
    await clearAllMatches();
    showToast('Todos los combates eliminados');
    if (teacherWatchId) teacherCloseWatch();
    await renderTeacherMatches();
  } catch(err) { showToast(err.message); }
}