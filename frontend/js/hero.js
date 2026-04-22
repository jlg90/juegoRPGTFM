// ═══════════════════════════════════════════════
//  hero.js — Personaje, tienda y selector de loadout
// ═══════════════════════════════════════════════

var CLASS_INFO = {
  mage:       { icon:'🧙', label:'Mago',        avatar:'avatar-mage'       },
  warrior:    { icon:'⚔️', label:'Guerrero',    avatar:'avatar-warrior'    },
  rogue:      { icon:'🗡️', label:'Pícaro',      avatar:'avatar-rogue'      },
  paladin:    { icon:'🛡️', label:'Paladín',     avatar:'avatar-paladin'    },
  druid:      { icon:'🌿', label:'Druida',      avatar:'avatar-druid'      },
  warlock:    { icon:'👹', label:'Brujo',       avatar:'avatar-warlock'    },
  archer:     { icon:'🏹', label:'Arquero',     avatar:'avatar-archer'     },
  necromancer:{ icon:'💀', label:'Nigromante',  avatar:'avatar-necromancer'},
};

var ALL_SKILLS = {
  // ═══ MAGO ══════════════════════════════════════
  fireball:     { cls:'mage',    cost:0, name:'Bola de fuego',    icon:'🔥', desc:'Daño: 30 · Precisión: 100% · Velocidad: Normal' },
  frost_bolt:   { cls:'mage',    cost:0, name:'Rayo de hielo',    icon:'❄️', desc:'Daño: 18 · Precisión: 100% · Congela: 45% (20% de 2 turnos) · Vel: Algo rápida' },
  arcane_blast: { cls:'mage',    cost:0, name:'Explosión árcana', icon:'💫', desc:'Daño: 24 · Precisión: 100% · Ignora 50% defensa · Vel: Normal' },
  mana_shield:  { cls:'mage',    cost:0, name:'Escudo mágico',    icon:'🔮', desc:'Reduce 50% el próximo golpe recibido · Vel: Algo lenta · CD:2t' },
  lightning:    { cls:'mage',    cost:2, name:'Rayo',             icon:'⚡', desc:'Daño: 50 · Precisión: 60% · Velocidad: Algo rápida' },
  drain_life:   { cls:'mage',    cost:3, name:'Drenar vida',      icon:'🩸', desc:'Daño: 22 · Cura: 10% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t' },
  meteor:       { cls:'mage',    cost:4, name:'Meteoro',          icon:'☄️', desc:'Daño: 62 · Precisión: 60% · Velocidad: Lenta' },
  blizzard:     { cls:'mage',    cost:5, name:'Ventisca',         icon:'🌨️', desc:'Daño: 22 · Precisión: 100% · Congela: 55% (35% de 2 turnos) · Vel: Algo rápida · CD:3t' },

  // ═══ GUERRERO ══════════════════════════════════
  brutal_strike:{ cls:'warrior', cost:0, name:'Golpe brutal',    icon:'⚔️', desc:'Daño: 32 · Precisión: 100% · Velocidad: Normal' },
  shield_bash:  { cls:'warrior', cost:0, name:'Golpe de escudo', icon:'🛡️', desc:'Daño: 16 · Precisión: 100% · Aturde: 40% (20% de 2 turnos) · Vel: Algo rápida' },
  war_cry:      { cls:'warrior', cost:0, name:'Grito de guerra', icon:'📯', desc:'ATK ×1.4 durante 2 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t' },
  shield_wall:  { cls:'warrior', cost:0, name:'Muro de escudo',  icon:'🧱', desc:'DEF ×1.55 durante 2 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t' },
  whirlwind:    { cls:'warrior', cost:2, name:'Torbellino',      icon:'🌀', desc:'Daño: 38 · Precisión: 100% · Velocidad: Normal' },
  counter:      { cls:'warrior', cost:3, name:'Contraataque',    icon:'↩️', desc:'Devuelve ×2 el daño recibido ese turno · Vel: MUY LENTA · CD:3t' },
  berserk:      { cls:'warrior', cost:4, name:'Frenesí',         icon:'😤', desc:'ATK ×1.6 / DEF ×0.75 durante 3 turnos · Vel: Algo lenta · CD:4t' },
  execute:      { cls:'warrior', cost:5, name:'Ejecutar',        icon:'💀', desc:'Daño: 50 · Precisión: 60% · ×2 si rival <28% HP · Vel: Rápida' },

  // ═══ PÍCARO ════════════════════════════════════
  stab:         { cls:'rogue',   cost:0, name:'Puñalada',        icon:'🗡️', desc:'Daño: 24 · Precisión: 100% · Velocidad: Normal' },
  poison:       { cls:'rogue',   cost:0, name:'Veneno',          icon:'☠️', desc:'Daño: 10 · Veneno: 8% HP máx/turno × 3 turnos · Acumulable · Vel: Normal' },
  evasion:      { cls:'rogue',   cost:0, name:'Evasión',         icon:'💨', desc:'72% de esquivar el siguiente ataque · Vel: Normal · CD:2t' },
  backstab:     { cls:'rogue',   cost:0, name:'Apuñalar',        icon:'🔪', desc:'Daño: 28 · ×1.55 si rival tiene buffs · Precisión: 100% · Vel: Normal' },
  critical:     { cls:'rogue',   cost:2, name:'Golpe crítico',   icon:'💥', desc:'Daño: 60 · Precisión: 60% · Velocidad: Algo rápida' },
  smoke_bomb:   { cls:'rogue',   cost:3, name:'Bomba de humo',   icon:'💣', desc:'El siguiente ataque del rival falla · Vel: Algo lenta · CD:3t' },
  hemorrhage:   { cls:'rogue',   cost:4, name:'Hemorragia',      icon:'🩹', desc:'Daño: 12 · Sangrado: 1%-16% HP máx/turno (+2% por aplicación) × 4 turnos · Acumulable · Vel: Normal' },
  shadow_step:  { cls:'rogue',   cost:5, name:'Paso en sombra',  icon:'👥', desc:'Daño: 36 · Precisión: 100% · Evasión 85% siguiente turno · Vel: MUY RÁPIDA · CD:4t' },

  // ═══ PALADÍN ═══════════════════════════════════
  holy_strike:  { cls:'paladin', cost:0, name:'Golpe sagrado',   icon:'✨', desc:'Daño: 26 · Precisión: 100% · Velocidad: Normal' },
  heal:         { cls:'paladin', cost:0, name:'Curación',        icon:'💚', desc:'Cura: 22% HP máx propio · Precisión: 100% · Vel: Algo lenta · CD:3t' },
  divine_shield:{ cls:'paladin', cost:0, name:'Escudo divino',   icon:'🌟', desc:'Inmune al siguiente ataque · Vel: Algo lenta · CD:3t' },
  consecration: { cls:'paladin', cost:0, name:'Consagración',    icon:'🔥', desc:'Daño: 20 + fuego sagrado 6/turno × 2 turnos · Vel: Normal' },
  judgment:     { cls:'paladin', cost:2, name:'Juicio',          icon:'⚖️', desc:'Daño: 42 · Precisión: 100% · Velocidad: Normal' },
  holy_nova:    { cls:'paladin', cost:3, name:'Nova sagrada',    icon:'💛', desc:'Daño: 26 · Cura: 14% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t' },
  avenging_wrath:{ cls:'paladin',cost:4, name:'Ira vengadora',   icon:'😇', desc:'ATK ×1.5 durante 3 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t' },
  resurrection: { cls:'paladin', cost:5, name:'Resurrección',    icon:'🌅', desc:'Al morir, revives con 28% HP (1 vez) · Vel: Algo lenta · CD:6t' },

  // ════════════════════════════════════════════════════════════════
  //  CLASES NUEVAS — Druida, Brujo, Arquero, Nigromante
  // ════════════════════════════════════════════════════════════════

  // ═══ DRUIDA 🌿 ══════════════════════════════════════════════════
  // Equilibrado: velocidad media-alta, naturaleza, DoT + curación
  thorn_whip:   { cls:'druid', cost:0, name:'Látigo espinoso',  icon:'🌿', desc:'Daño: 24 · Precisión: 100% · Velocidad: Normal' },
  entangle:     { cls:'druid', cost:0, name:'Enredadera',        icon:'🪴', desc:'Daño: 12 · Precisión: 100% · Raíces: 40% de aturdir · Vel: Algo rápida' },
  regeneration: { cls:'druid', cost:0, name:'Regeneración',      icon:'💚', desc:'Cura: 18% HP máx propio · Precisión: 100% · Vel: Algo lenta · CD:3t' },
  barkskin:     { cls:'druid', cost:0, name:'Corteza de árbol',  icon:'🪵', desc:'DEF ×1.5 durante 2 turnos · Precisión: 100% · Vel: Algo lenta · CD:2t' },
  nature_wrath: { cls:'druid', cost:2, name:'Ira de la naturaleza', icon:'⚡', desc:'Daño: 42 · Precisión: 100% · Velocidad: Normal' },
  spore_cloud:  { cls:'druid', cost:3, name:'Nube de esporas',   icon:'🍄', desc:'Daño: 8 · Veneno: 8% HP máx/turno × 4 turnos · Acumulable · Vel: Normal · CD:2t' },
  wild_growth:  { cls:'druid', cost:4, name:'Crecimiento salvaje',icon:'🌱', desc:'Daño: 24 · Cura: 16% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t' },
  shapeshifter: { cls:'druid', cost:5, name:'Cambiaformas',      icon:'🐾', desc:'ATK ×1.5 y DEF ×1.3 durante 3 turnos · Vel: Algo lenta · CD:4t' },

  // ═══ BRUJO 👹 ═══════════════════════════════════════════════════
  // Ofensivo: ATK alto, bajo DEF, magia oscura y sacrificio
  shadow_bolt:  { cls:'warlock', cost:0, name:'Proyectil de sombra', icon:'🌑', desc:'Daño: 30 · Precisión: 100% · Velocidad: Normal' },
  life_tap:     { cls:'warlock', cost:0, name:'Toque de vida',    icon:'🩸', desc:'Daño: 20 · Cura: 12% HP máx propio · Precisión: 100% · Vel: Normal' },
  curse:        { cls:'warlock', cost:0, name:'Maldición',        icon:'🔮', desc:'Daño: 5 · Veneno: 8% HP máx/turno × 5 turnos · Acumulable · Vel: Normal' },
  dark_pact:    { cls:'warlock', cost:0, name:'Pacto oscuro',     icon:'📜', desc:'ATK ×1.7 durante 2 turnos · Vel: Algo lenta · CD:3t' },
  soul_drain:   { cls:'warlock', cost:2, name:'Drenar alma',      icon:'👁️', desc:'Daño: 32 · Cura: 18% HP máx propio · Precisión: 85% · Vel: Normal · CD:3t' },
  corruption:   { cls:'warlock', cost:3, name:'Corrupción',       icon:'🫀', desc:'Daño: 12 · Sangrado: 1%-16% HP máx/turno × 5 turnos · Acumulable · Vel: Normal · CD:2t' },
  fel_flame:    { cls:'warlock', cost:4, name:'Llama vil',        icon:'🔥', desc:'Daño: 55 · Precisión: 65% · Velocidad: Normal' },
  void_rift:    { cls:'warlock', cost:5, name:'Grieta del vacío', icon:'🌌', desc:'Daño: 72 · Precisión: 50% · Ignora 40% defensa · Vel: Lenta' },

  // ═══ ARQUERO 🏹 ══════════════════════════════════════════════════
  // Velocidad: el más rápido junto al Pícaro, sangrado, trampas
  quick_shot:      { cls:'archer', cost:0, name:'Disparo rápido',   icon:'🏹', desc:'Daño: 22 · Precisión: 100% · Velocidad: Rápida' },
  arrow_rain:      { cls:'archer', cost:0, name:'Lluvia de flechas', icon:'🌧️', desc:'Daño: 10 · Sangrado: 1%-16% HP máx/turno × 3 turnos · Acumulable · Vel: Normal' },
  trip_wire:       { cls:'archer', cost:0, name:'Trampa',            icon:'🪤', desc:'Evasión 80% siguiente ataque · Vel: Algo lenta · CD:2t' },
  aimed_shot:      { cls:'archer', cost:0, name:'Disparo preciso',   icon:'🎯', desc:'Daño: 38 · Precisión: 85% · Velocidad: Lenta' },
  explosive_arrow: { cls:'archer', cost:2, name:'Flecha explosiva',  icon:'💥', desc:'Daño: 46 · Precisión: 80% · Velocidad: Normal' },
  hunter_mark:     { cls:'archer', cost:3, name:'Marca del cazador', icon:'🎪', desc:'Daño: 28 · Precisión: 100% · Ignora 60% defensa · Vel: Normal · CD:2t' },
  multishot:       { cls:'archer', cost:4, name:'Multidisparo',      icon:'⚡', desc:'Daño: 18 · Sangrado: 1%-16% HP máx/turno × 4 turnos · Acumulable · Vel: Algo rápida · CD:2t' },
  death_arrow:     { cls:'archer', cost:5, name:'Flecha de la muerte',icon:'☠️', desc:'Daño: 68 · Precisión: 55% · Velocidad: Normal' },

  // ═══ NIGROMANTE 💀 ══════════════════════════════════════════════
  // Control: stun, drain, plaga, transformación en Lich
  bone_spear:        { cls:'necromancer', cost:0, name:'Lanza de hueso',      icon:'🦴', desc:'Daño: 28 · Precisión: 100% · Velocidad: Normal' },
  wither:            { cls:'necromancer', cost:0, name:'Marchitar',            icon:'🥀', desc:'Daño: 6 · Veneno: 8% HP máx/turno × 4 turnos · Acumulable · Vel: Normal' },
  soul_harvest:      { cls:'necromancer', cost:0, name:'Cosecha de almas',    icon:'💜', desc:'Daño: 22 · Cura: 14% HP máx propio · Precisión: 100% · Vel: Normal' },
  death_coil:        { cls:'necromancer', cost:0, name:'Espiral de la muerte', icon:'💀', desc:'Daño: 16 · Precisión: 100% · Aturde: 35% (20% de 2 turnos) · Vel: Algo rápida' },
  plague:            { cls:'necromancer', cost:2, name:'Plaga',                icon:'🦠', desc:'Daño: 14 · Sangrado: 1%-16% HP máx/turno × 5 turnos · Acumulable · Vel: Normal · CD:2t' },
  necrotic_touch:    { cls:'necromancer', cost:3, name:'Toque necrótico',      icon:'🖤', desc:'Daño: 30 · Cura: 20% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t' },
  undead_resilience: { cls:'necromancer', cost:4, name:'Resiliencia no-muerta',icon:'🛡️', desc:'DEF ×1.6 durante 3 turnos · Vel: Algo lenta · CD:3t' },
  lich_form:         { cls:'necromancer', cost:5, name:'Forma de Lich',        icon:'👑', desc:'ATK ×1.8 / DEF ×0.6 durante 4 turnos · Vel: Algo lenta · CD:5t' },
};

var STAT_COSTS = { atk:1, def:1, spd:1, hp:1 };
var STAT_MAX   = { atk:25, def:25, spd:25, hp:400 };
var pendingUpg = { atk:0, def:0, spd:0, hp:0 };

// Loadout en edición: array de hasta 4 skillIds
var pendingLoadout = [];

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn-save-upgrades').addEventListener('click', saveUpgrades);
});

// ─── Render principal ─────────────────────────────────────
function renderHero() {
  if (!AppState.player) return;
  var p    = AppState.player;
  var info = CLASS_INFO[p.cls] || { icon:'?', label:'?', avatar:'' };

  var av = document.getElementById('hero-avatar');
  av.textContent = info.icon;
  av.className   = 'char-avatar ' + info.avatar;

  document.getElementById('hero-name').textContent      = p.username;
  document.getElementById('hero-class').textContent     = info.label;
  var ptsAvail = p.pts_available != null ? p.pts_available : 0;
  var badge = document.getElementById('hero-pts-badge');
  if (ptsAvail < 0) {
    badge.textContent = ptsAvail + ' pts (en deuda)';
    badge.style.background = 'var(--red-l, #cc2222)';
    badge.style.color = '#fff';
  } else {
    badge.textContent = ptsAvail + ' pts disponibles';
    badge.style.background = '';
    badge.style.color = '';
  }
  document.getElementById('pts-pool-num').textContent = ptsAvail;
  document.getElementById('hero-wins').textContent      = p.wins    || 0;
  document.getElementById('hero-losses').textContent    = p.losses  || 0;
  document.getElementById('hero-pts-total').textContent = p.pts_total || 0;

  renderStatBars(p);
  renderUpgControls(p);
  renderLoadoutSelector(p);
  renderSkillShop(p);
  renderResetButton(p);
}

// ─── Barras de stats ──────────────────────────────────────
function renderStatBars(p) {
  var stats = [
    { key:'atk', label:'Ataque',    cls:'bar-atk', max:STAT_MAX.atk },
    { key:'def', label:'Defensa',   cls:'bar-def', max:STAT_MAX.def },
    { key:'spd', label:'Velocidad', cls:'bar-spd', max:STAT_MAX.spd },
    { key:'hp',  label:'Vida base', cls:'bar-hp',  max:STAT_MAX.hp  },
  ];
  document.getElementById('hero-stats-bars').innerHTML = stats.map(function(s) {
    var pct = Math.min(100, Math.round((p[s.key]||0) / s.max * 100));
    return '<div class="stat-row">' +
      '<div class="stat-label">' + s.label + '</div>' +
      '<div class="stat-bar-bg"><div class="stat-bar ' + s.cls + '" style="width:' + pct + '%"></div></div>' +
      '<div class="stat-val">' + (p[s.key]||0) + '</div></div>';
  }).join('');
}

// ─── Controles de mejora de stats ────────────────────────
function renderUpgControls(p) {
  pendingUpg = { atk:0, def:0, spd:0, hp:0 };
  var stats = [
    { key:'atk', label:'⚔ Ataque',    color:'var(--red-l)'  },
    { key:'def', label:'🛡 Defensa',   color:'var(--blue-l)' },
    { key:'spd', label:'💨 Velocidad', color:'var(--green-l)'},
    { key:'hp',  label:'❤ Vida (+5/pt)',color:'var(--gold)'  },
  ];
  document.getElementById('skill-upgrades').innerHTML = stats.map(function(s) {
    return '<div class="upg-row">' +
      '<label style="color:' + s.color + '">' + s.label + ' <span style="color:var(--dim);font-size:.74rem">(1 pt)</span></label>' +
      '<div class="upg-stepper">' +
        '<button onclick="changeUpg(\'' + s.key + '\',-1)">−</button>' +
        '<input class="upg-num" id="upg-' + s.key + '" value="0" readonly>' +
        '<button onclick="changeUpg(\'' + s.key + '\',+1)">+</button>' +
      '</div></div>';
  }).join('');
}

function changeUpg(key, delta) {
  var p = AppState.player; if (!p) return;
  var newVal = pendingUpg[key] + delta;
  if (newVal < 0) return;
  var cost = Object.keys(pendingUpg).reduce((s,k) => s + pendingUpg[k]*STAT_COSTS[k], 0) + delta*STAT_COSTS[key];
  if (cost > p.pts_available) { showToast('Puntos insuficientes'); return; }
  var projectedVal = (p[key]||0) + (key === 'hp' ? newVal * 5 : newVal);
  if (projectedVal > STAT_MAX[key]) { showToast('Estadística al máximo'); return; }
  pendingUpg[key] = newVal;
  document.getElementById('upg-' + key).value = newVal;
  var spent = Object.keys(pendingUpg).reduce((s,k) => s + pendingUpg[k]*STAT_COSTS[k], 0);
  document.getElementById('pts-pool-num').textContent = (p.pts_available||0) - spent;
}

async function saveUpgrades() {
  var total = Object.keys(pendingUpg).reduce((s,k) => s + pendingUpg[k], 0);
  if (total === 0) { showToast('Sin mejoras seleccionadas'); return; }
  try {
    var data = await upgradePlayer(pendingUpg);
    AppState.player = data.player;
    showToast('¡Mejoras aplicadas!');
    renderHero();
  } catch(err) { showToast(err.message); }
}

// ─── SELECTOR DE LOADOUT (4 habilidades para el combate) ──
// Muestra todas las habilidades desbloqueadas del jugador.
// El jugador hace clic para añadir/quitar del loadout (máximo 4).
function renderLoadoutSelector(p) {
  var container = document.getElementById('loadout-selector');
  if (!container) return;

  // Inicializar pendingLoadout con el loadout guardado
  pendingLoadout = p.loadout ? [...p.loadout] : (p.skills||[]).slice(0, 4);

  var ownedSkills = p.skills || [];

  container.innerHTML = '<div class="loadout-info">' +
    '<span class="loadout-count" id="loadout-count">' + pendingLoadout.length + '/' + Math.min((ownedSkills.length), 2) + ' seleccionadas</span>' +
    '<button class="btn btn-gold btn-sm" id="btn-save-loadout">Guardar loadout</button>' +
    '</div>' +
    '<div class="loadout-hint">Elige exactamente 4 habilidades para llevar al combate. Pulsa para añadir/quitar.</div>' +
    '<div class="loadout-grid" id="loadout-grid"></div>';

  document.getElementById('btn-save-loadout').addEventListener('click', saveLoadout);
  renderLoadoutGrid(ownedSkills);
}

function renderLoadoutGrid(ownedSkills) {
  var grid = document.getElementById('loadout-grid');
  if (!grid) return;
  grid.innerHTML = ownedSkills.map(function(sid) {
    var sk = ALL_SKILLS[sid]; if (!sk) return '';
    var inLoadout = pendingLoadout.includes(sid);
    return '<div class="loadout-skill ' + (inLoadout ? 'loadout-active' : '') + '" onclick="toggleLoadout(\'' + sid + '\')" title="' + sk.desc + '">' +
      '<span class="loadout-sk-icon">' + sk.icon + '</span>' +
      '<span class="loadout-sk-name">' + sk.name + '</span>' +
      (inLoadout ? '<span class="loadout-check">✓</span>' : '') +
      '</div>';
  }).join('');
}

function toggleLoadout(skillId) {
  var p = AppState.player; if (!p) return;
  var idx = pendingLoadout.indexOf(skillId);
  var p = AppState.player;
  var minRequired = p ? Math.min((p.skills||[]).length, 2) : 2;
  if (idx >= 0) {
    if (pendingLoadout.length <= minRequired) {
      showToast('Debes llevar al menos ' + minRequired + ' habilidad' + (minRequired > 1 ? 'es' : '') + ' al combate.');
      return;
    }
    pendingLoadout.splice(idx, 1);
  } else {
    if (pendingLoadout.length >= 4) {
      showToast('Solo puedes llevar 4 habilidades al combate. Quita una primero.');
      return;
    }
    pendingLoadout.push(skillId);
  }
  var countEl = document.getElementById('loadout-count');
  var maxSlots = p ? Math.min((p.skills||[]).length, 2) : 2;
  if (countEl) countEl.textContent = pendingLoadout.length + '/' + maxSlots + ' seleccionadas';
  renderLoadoutGrid(p.skills || []);
}

async function saveLoadout() {
  var p = AppState.player; if (!p) return;
  var minRequired = Math.min((p.skills||[]).length, 2);
  if (pendingLoadout.length < minRequired) {
    showToast('Debes seleccionar al menos ' + minRequired + ' habilidad' + (minRequired > 1 ? 'es' : ''));
    return;
  }
  if (pendingLoadout.length > 4) {
    showToast('No puedes llevar más de 4 habilidades');
    return;
  }
  try {
    var data = await setLoadout(pendingLoadout);
    AppState.player = data.player;
    showToast('✅ Loadout guardado para el próximo combate');
    renderHero();
  } catch(err) { showToast(err.message); }
}

// ─── Tienda de habilidades ────────────────────────────────
function renderSkillShop(p) {
  var c      = document.getElementById('skill-shop');
  var skills = Object.entries(ALL_SKILLS).filter(e => e[1].cls === p.cls);
  var ptsAvail = p.pts_available != null ? p.pts_available : 0;
  var inDebt   = ptsAvail < 0;
  c.innerHTML = skills.map(function(entry) {
    var id = entry[0], sk = entry[1];
    var owned = p.skills && p.skills.includes(id);
    var btn;
    if (owned)        btn = '<span class="badge badge-green">Desbloqueada</span>';
    else if (!sk.cost) btn = '<span class="badge badge-gold">Base</span>';
    else if (inDebt || ptsAvail < sk.cost)
      btn = '<button class="btn btn-gold btn-sm" disabled style="opacity:.4;cursor:not-allowed">' + sk.cost + ' pts</button>';
    else
      btn = '<button class="btn btn-gold btn-sm" onclick="handleBuySkill(\'' + id + '\',' + sk.cost + ')">' + sk.cost + ' pts</button>';
    return '<div class="shop-row ' + (owned?'owned':'') + '">' +
      '<div class="sk-icon">' + sk.icon + '</div>' +
      '<div class="sk-info"><div class="sk-name">' + sk.name + '</div><div class="sk-desc">' + sk.desc + '</div></div>' +
      '<div>' + btn + '</div></div>';
  }).join('');
}

async function handleBuySkill(skillId, cost) {
  var p = AppState.player; if (!p) return;
  if ((p.pts_available||0) < cost) { showToast('Puntos insuficientes'); return; }
  try {
    var data = await buySkill(skillId);
    AppState.player = data.player;
    showToast('¡Habilidad desbloqueada!');
    renderHero();
  } catch(err) { showToast(err.message); }
}

// ─── Clasificación ────────────────────────────────────────
async function renderLeaderboard() {
  try {
    var players = await getPlayers();
    var sorted  = Object.values(players).sort((a,b) => (b.wins||0)-(a.wins||0) || (a.losses||0)-(b.losses||0));
    var medals  = ['🥇','🥈','🥉'];
    var lb = document.getElementById('lb-list');
    if (!sorted.length) { lb.innerHTML = '<div style="color:var(--muted);font-style:italic;">Sin héroes todavía.</div>'; return; }
    lb.innerHTML = sorted.map(function(p, i) {
      var info = CLASS_INFO[p.cls] || { icon:'?', label:'?' };
      return '<div class="lb-row">' +
        '<div class="lb-rank">' + (medals[i]||(i+1)) + '</div>' +
        '<div style="font-size:1.4rem;width:30px;text-align:center">' + info.icon + '</div>' +
        '<div class="lb-name"><div class="student-name">' + p.username + '</div>' +
        '<div class="student-meta">' + info.label + ' · Atk:' + p.atk + ' Def:' + p.def + ' Vel:' + p.spd + '</div></div>' +
        '<div class="lb-wins">W:' + (p.wins||0) + ' / L:' + (p.losses||0) + '</div></div>';
    }).join('');
  } catch(err) { showToast(err.message); }
}

// ─── Renderizar tarjeta de reset ─────────────────────
function renderResetButton(p) {
  var card = document.getElementById('reset-points-card');
  if (!card) return;
  var ptsToRecover = p.pts_spent || 0;
  var ptsTotal     = p.pts_total != null ? p.pts_total : 0;
  var debtNote     = ptsTotal < 0
    ? '<div style="font-size:.8rem;color:var(--red-l);margin-bottom:.6rem">⚠ Tienes una deuda de <strong>' + Math.abs(ptsTotal) + '</strong> pts que se mantendrá tras el reset.</div>'
    : '';
  card.innerHTML =
    '<div class="card-title" style="color:var(--red-l)">⚠️ Zona de peligro</div>' +
    '<div style="font-size:.82rem;color:var(--muted);margin-bottom:.6rem">' +
      'Recupera todos tus puntos gastados y vuelve a empezar desde cero. ' +
      'Tus stats volverán a los valores base y perderás las habilidades desbloqueadas. ' +
      'Victorias y derrotas se conservan.' +
    '</div>' +
    debtNote +
    '<div style="font-size:.82rem;color:var(--dim);margin-bottom:.8rem">' +
      '🔮 Puntos que recuperarás: <strong style="color:var(--gold)">' + ptsToRecover + '</strong>' +
    '</div>' +
    '<button class="btn btn-red w100" onclick="handleResetPoints()">🔄 Resetear personaje</button>';
}

// ─── Resetear personaje ───────────────────────────────
async function handleResetPoints() {
  if (!confirm(
    '⚠️ ¿Resetear tu personaje?\n\n' +
    'Esto:\n' +
    '• Devolverá todos tus puntos gastados\n' +
    '• Reseteará tus estadísticas a los valores base\n' +
    '• Eliminará todas las habilidades desbloqueadas\n\n' +
    'Tus victorias y derrotas se conservan.\n\n' +
    '¿Continuar?'
  )) return;
  try {
    var data = await resetPoints();
    AppState.player = data.player;
    showToast('✅ Personaje reseteado. ¡Todos tus puntos han vuelto!');
    renderHero();
  } catch(err) { showToast(err.message); }
}