// ═══════════════════════════════════════════════
//  auth.js — Login, logout y navegación
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {

  // ─── Partículas de fondo ──────────────────────
  var container = document.getElementById('particles');
  for (var i = 0; i < 40; i++) {
    var star = document.createElement('div');
    star.className = 'star';
    star.style.left              = Math.random() * 100 + '%';
    star.style.top               = Math.random() * 100 + '%';
    star.style.animationDuration = (3 + Math.random() * 5) + 's';
    star.style.animationDelay   = (Math.random() * 5) + 's';
    container.appendChild(star);
  }

  // ─── Botón de login ───────────────────────────
  document.getElementById('btn-login').addEventListener('click', doLogin);

  // Enter en los campos de login
  document.getElementById('login-user').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('login-pass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  // ─── Botón de logout ──────────────────────────
  document.getElementById('btn-logout').addEventListener('click', doLogout);

  // ─── Botones de navegación ────────────────────
  var navBtns = document.querySelectorAll('.nav-btn[data-view]');
  for (var i = 0; i < navBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        showView(btn.dataset.view);
      });
    })(navBtns[i]);
  }

  // ─── Botón de volver desde la batalla ─────────
  document.getElementById('btn-back-matches').addEventListener('click', function() {
    showView('matches');
  });
});

// ─── LOGIN ────────────────────────────────────────────────────
async function doLogin() {
  var username = document.getElementById('login-user').value.trim();
  var password = document.getElementById('login-pass').value;

  if (!username || !password) {
    showToast('Rellena todos los campos');
    return;
  }

  try {
    await login(username, password);
    initSocket();
    enterApp();
  } catch (err) {
    showToast(err.message);
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────
function doLogout() {
  AppState.token    = null;
  AppState.role     = null;
  AppState.username = null;
  AppState.player   = null;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  hide('main-nav');
  // Ocultar todas las vistas
  var views = document.querySelectorAll('.view');
  for (var i = 0; i < views.length; i++) {
    views[i].classList.add('hidden');
  }
  show('login-view');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// ─── ENTRAR A LA APP TRAS LOGIN ───────────────────────────────
function enterApp() {
  show('main-nav');

  if (AppState.role === 'teacher') {
    show('nav-teacher');
    showView('teacher');
  } else {
    hide('nav-teacher');
    showView('hero');
  }
}