// ═══════════════════════════════════════════════════════════
//  battle.js — Combate simultáneo, tooltips, eventos narrativos
// ═══════════════════════════════════════════════════════════

var currentMatchId      = null;
var animationInProgress = false;
var myActionSubmitted   = false;
var countdownInterval   = null;

var CLS_ICON = { mage:'🧙', warrior:'⚔️', rogue:'🗡️', paladin:'🛡️', druid:'🌿', warlock:'👹', archer:'🏹', necromancer:'💀' };

// ── Animaciones por habilidad ──────────────────────────────
var ANIM = {
  fireball:      { emoji:'🔥', color:'#ff5500', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:6,  dmgColor:'#ff8844' },
  frost_bolt:    { emoji:'❄️', color:'#66ccff', type:'projectile', selfAnim:'lunge', hitAnim:'freeze', shake:3,  dmgColor:'#88ddff' },
  arcane_blast:  { emoji:'💫', color:'#aa55ff', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:4,  dmgColor:'#cc88ff' },
  mana_shield:   { emoji:'🔮', color:'#7755ff', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#9977ff' },
  lightning:     { emoji:'⚡', color:'#ffff00', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:10, dmgColor:'#ffff55' },
  drain_life:    { emoji:'🩸', color:'#cc0033', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:3,  dmgColor:'#ff3366' },
  meteor:        { emoji:'☄️', color:'#ff4400', type:'drop',       selfAnim:'lunge', hitAnim:'hit',    shake:14, dmgColor:'#ff7700' },
  blizzard:      { emoji:'🌨️', color:'#99ddff', type:'wave',       selfAnim:'lunge', hitAnim:'freeze', shake:5,  dmgColor:'#bbeeFF' },
  brutal_strike: { emoji:'💪', color:'#ff8800', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:8,  dmgColor:'#ffaa55' },
  shield_bash:   { emoji:'🛡️', color:'#7799ff', type:'projectile', selfAnim:'lunge', hitAnim:'stun',   shake:4,  dmgColor:'#99bbff' },
  war_cry:       { emoji:'📯', color:'#ffaa00', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ffcc44' },
  shield_wall:   { emoji:'🧱', color:'#5588aa', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#88aacc' },
  whirlwind:     { emoji:'🌀', color:'#66aaff', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:7,  dmgColor:'#88ccff' },
  counter:       { emoji:'↩️', color:'#ffcc33', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ffdd66' },
  berserk:       { emoji:'😤', color:'#ff3333', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ff6666' },
  execute:       { emoji:'💀', color:'#ff0000', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:16, dmgColor:'#ff2222' },
  stab:          { emoji:'🗡️', color:'#cccccc', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:3,  dmgColor:'#dddddd' },
  poison:        { emoji:'☠️', color:'#44ff44', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:2,  dmgColor:'#66ff66' },
  evasion:       { emoji:'💨', color:'#aaffee', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ccffee' },
  backstab:      { emoji:'🔪', color:'#cc3333', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:5,  dmgColor:'#ff5555' },
  critical:      { emoji:'💥', color:'#ffff00', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:12, dmgColor:'#ffff44' },
  smoke_bomb:    { emoji:'💣', color:'#888888', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#aaaaaa' },
  hemorrhage:    { emoji:'🩹', color:'#cc2222', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:3,  dmgColor:'#ff4444' },
  shadow_step:   { emoji:'👥', color:'#4444aa', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:6,  dmgColor:'#8888ff' },
  holy_strike:   { emoji:'✨', color:'#ffffcc', type:'projectile', selfAnim:'lunge', hitAnim:'holy',   shake:3,  dmgColor:'#ffff88' },
  heal:          { emoji:'💚', color:'#00ff88', type:'self',       selfAnim:'heal',  hitAnim:null,     shake:0,  dmgColor:'#00ff88' },
  divine_shield: { emoji:'🌟', color:'#ffffaa', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ffffcc' },
  consecration:  { emoji:'🔥', color:'#ffaa00', type:'wave',       selfAnim:'lunge', hitAnim:'hit',    shake:3,  dmgColor:'#ffcc44' },
  judgment:      { emoji:'⚖️', color:'#ffffaa', type:'drop',       selfAnim:'lunge', hitAnim:'holy',   shake:9,  dmgColor:'#ffff99' },
  holy_nova:     { emoji:'💛', color:'#ffee44', type:'wave',       selfAnim:'lunge', hitAnim:'holy',   shake:4,  dmgColor:'#ffee88' },
  avenging_wrath:{ emoji:'😇', color:'#ffff88', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ffffaa' },
  resurrection:  { emoji:'🌅', color:'#ff9944', type:'self',       selfAnim:'heal',  hitAnim:null,     shake:0,  dmgColor:'#ffbb66' },

  // ─── DRUIDA ──────────────────────────────────────────────
  thorn_whip:        { emoji:'🌿', color:'#44cc44', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:4,  dmgColor:'#88ff88' },
  entangle:          { emoji:'🪴', color:'#228b22', type:'projectile', selfAnim:'lunge', hitAnim:'stun',   shake:3,  dmgColor:'#66cc66' },
  regeneration:      { emoji:'💚', color:'#00ff88', type:'self',       selfAnim:'heal',  hitAnim:null,     shake:0,  dmgColor:'#00ff88' },
  barkskin:          { emoji:'🪵', color:'#8b6914', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#c8a44a' },
  nature_wrath:      { emoji:'⚡', color:'#00ff44', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:9,  dmgColor:'#88ff44' },
  spore_cloud:       { emoji:'🍄', color:'#aaffaa', type:'wave',       selfAnim:'lunge', hitAnim:'poison', shake:2,  dmgColor:'#88ee88' },
  wild_growth:       { emoji:'🌱', color:'#00cc66', type:'projectile', selfAnim:'lunge', hitAnim:'heal',   shake:4,  dmgColor:'#44ff88' },
  shapeshifter:      { emoji:'🐾', color:'#ff8844', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ffaa66' },

  // ─── BRUJO ───────────────────────────────────────────────
  shadow_bolt:       { emoji:'🌑', color:'#6600cc', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:6,  dmgColor:'#9944ff' },
  life_tap:          { emoji:'🩸', color:'#cc0066', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:3,  dmgColor:'#ff3388' },
  curse:             { emoji:'🔮', color:'#8800aa', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:2,  dmgColor:'#cc44ff' },
  dark_pact:         { emoji:'📜', color:'#440066', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#8844cc' },
  soul_drain:        { emoji:'👁️', color:'#aa00ff', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:5,  dmgColor:'#cc66ff' },
  corruption:        { emoji:'🫀', color:'#880033', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:4,  dmgColor:'#cc2255' },
  fel_flame:         { emoji:'🔥', color:'#ff00aa', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:11, dmgColor:'#ff44cc' },
  void_rift:         { emoji:'🌌', color:'#220044', type:'drop',       selfAnim:'lunge', hitAnim:'hit',    shake:14, dmgColor:'#8800ff' },

  // ─── ARQUERO ─────────────────────────────────────────────
  quick_shot:        { emoji:'🏹', color:'#ddaa44', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:3,  dmgColor:'#ffcc66' },
  arrow_rain:        { emoji:'🌧️', color:'#888800', type:'wave',       selfAnim:'lunge', hitAnim:'poison', shake:4,  dmgColor:'#cccc44' },
  trip_wire:         { emoji:'🪤', color:'#aa8833', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#ddbb55' },
  aimed_shot:        { emoji:'🎯', color:'#cc6600', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:8,  dmgColor:'#ff8833' },
  explosive_arrow:   { emoji:'💥', color:'#ff6600', type:'drop',       selfAnim:'lunge', hitAnim:'hit',    shake:12, dmgColor:'#ff8844' },
  hunter_mark:       { emoji:'🎪', color:'#cc8800', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:5,  dmgColor:'#ffaa33' },
  multishot:         { emoji:'⚡', color:'#aacc00', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:6,  dmgColor:'#ccee44' },
  death_arrow:       { emoji:'☠️', color:'#334400', type:'flash',      selfAnim:'lunge', hitAnim:'hit',    shake:15, dmgColor:'#88aa00' },

  // ─── NIGROMANTE ──────────────────────────────────────────
  bone_spear:        { emoji:'🦴', color:'#ccccaa', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:5,  dmgColor:'#eeeebb' },
  wither:            { emoji:'🥀', color:'#885500', type:'projectile', selfAnim:'lunge', hitAnim:'poison', shake:2,  dmgColor:'#bb7722' },
  soul_harvest:      { emoji:'💜', color:'#7700aa', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:4,  dmgColor:'#aa44dd' },
  death_coil:        { emoji:'💀', color:'#003300', type:'projectile', selfAnim:'lunge', hitAnim:'stun',   shake:5,  dmgColor:'#226622' },
  plague:            { emoji:'🦠', color:'#445500', type:'wave',       selfAnim:'lunge', hitAnim:'poison', shake:4,  dmgColor:'#667700' },
  necrotic_touch:    { emoji:'🖤', color:'#111111', type:'projectile', selfAnim:'lunge', hitAnim:'hit',    shake:6,  dmgColor:'#445544' },
  undead_resilience: { emoji:'🛡️', color:'#334433', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#557755' },
  lich_form:         { emoji:'👑', color:'#002200', type:'self',       selfAnim:'buff',  hitAnim:null,     shake:0,  dmgColor:'#224422' },
};

var SKILL_UI = {
  fireball:      { name:'Bola de fuego',        icon:'🔥' },
  frost_bolt:    { name:'Rayo de hielo',         icon:'❄️' },
  arcane_blast:  { name:'Explosión árcana',      icon:'💫' },
  mana_shield:   { name:'Escudo mágico',         icon:'🔮' },
  lightning:     { name:'Rayo',                  icon:'⚡' },
  drain_life:    { name:'Drenar vida',            icon:'🩸' },
  meteor:        { name:'Meteoro',               icon:'☄️' },
  blizzard:      { name:'Ventisca',              icon:'🌨️' },
  brutal_strike: { name:'Golpe brutal',          icon:'💪' },
  shield_bash:   { name:'Golpe de escudo',       icon:'🛡️' },
  war_cry:       { name:'Grito de guerra',       icon:'📯' },
  shield_wall:   { name:'Muro de escudo',        icon:'🧱' },
  whirlwind:     { name:'Torbellino',            icon:'🌀' },
  counter:       { name:'Contraataque',          icon:'↩️' },
  berserk:       { name:'Frenesí',               icon:'😤' },
  execute:       { name:'Ejecutar',              icon:'💀' },
  stab:          { name:'Puñalada',              icon:'🗡️' },
  poison:        { name:'Veneno',                icon:'☠️' },
  evasion:       { name:'Evasión',               icon:'💨' },
  backstab:      { name:'Apuñalada traicionera', icon:'🔪' },
  critical:      { name:'Golpe crítico',         icon:'💥' },
  smoke_bomb:    { name:'Bomba de humo',         icon:'💣' },
  hemorrhage:    { name:'Hemorragia',            icon:'🩹' },
  shadow_step:   { name:'Paso en sombra',        icon:'👥' },
  holy_strike:   { name:'Golpe sagrado',         icon:'✨' },
  heal:          { name:'Curación',              icon:'💚' },
  divine_shield: { name:'Escudo divino',         icon:'🌟' },
  consecration:  { name:'Consagración',          icon:'🔥' },
  judgment:      { name:'Juicio',                icon:'⚖️' },
  holy_nova:     { name:'Nova sagrada',          icon:'💛' },
  avenging_wrath:{ name:'Ira vengadora',         icon:'😇' },
  resurrection:  { name:'Resurrección',          icon:'🌅' },
  // Druida
  thorn_whip:        { name:'Látigo espinoso',     icon:'🌿' },
  entangle:          { name:'Enredadera',           icon:'🪴' },
  regeneration:      { name:'Regeneración',         icon:'💚' },
  barkskin:          { name:'Corteza de árbol',     icon:'🪵' },
  nature_wrath:      { name:'Ira de la naturaleza', icon:'⚡' },
  spore_cloud:       { name:'Nube de esporas',      icon:'🍄' },
  wild_growth:       { name:'Crecimiento salvaje',  icon:'🌱' },
  shapeshifter:      { name:'Cambiaformas',         icon:'🐾' },
  // Brujo
  shadow_bolt:       { name:'Proyectil de sombra',  icon:'🌑' },
  life_tap:          { name:'Toque de vida',        icon:'🩸' },
  curse:             { name:'Maldición',            icon:'🔮' },
  dark_pact:         { name:'Pacto oscuro',         icon:'📜' },
  soul_drain:        { name:'Drenar alma',          icon:'👁️' },
  corruption:        { name:'Corrupción',           icon:'🫀' },
  fel_flame:         { name:'Llama vil',            icon:'🔥' },
  void_rift:         { name:'Grieta del vacío',     icon:'🌌' },
  // Arquero
  quick_shot:        { name:'Disparo rápido',       icon:'🏹' },
  arrow_rain:        { name:'Lluvia de flechas',    icon:'🌧️' },
  trip_wire:         { name:'Trampa',               icon:'🪤' },
  aimed_shot:        { name:'Disparo preciso',      icon:'🎯' },
  explosive_arrow:   { name:'Flecha explosiva',     icon:'💥' },
  hunter_mark:       { name:'Marca del cazador',    icon:'🎪' },
  multishot:         { name:'Multidisparo',         icon:'⚡' },
  death_arrow:       { name:'Flecha de la muerte',  icon:'☠️' },
  // Nigromante
  bone_spear:        { name:'Lanza de hueso',       icon:'🦴' },
  wither:            { name:'Marchitar',            icon:'🥀' },
  soul_harvest:      { name:'Cosecha de almas',     icon:'💜' },
  death_coil:        { name:'Espiral de la muerte', icon:'💀' },
  plague:            { name:'Plaga',                icon:'🦠' },
  necrotic_touch:    { name:'Toque necrótico',      icon:'🖤' },
  undead_resilience: { name:'Resiliencia no-muerta',icon:'🛡️' },
  lich_form:         { name:'Forma de Lich',        icon:'👑' },
};

// ══════════════════════════════════════════════════════════
//  SISTEMA DE EVENTOS NARRATIVOS (banner 1 segundo)
//  Muestra un texto grande centrado sobre la escena
//  que dura ~1 segundo y describe exactamente lo que pasó.
// ══════════════════════════════════════════════════════════
function showEventBanner(text, type) {
  // type: 'hit'|'status'|'miss'|'buff'|'heal'|'poison'|'death'|'info'
  var scene = document.getElementById('battle-scene');
  if (!scene) return Promise.resolve();
  return new Promise(function(resolve) {
    var banner = document.createElement('div');
    banner.className = 'event-banner event-banner-' + (type || 'info');
    banner.textContent = text;
    scene.appendChild(banner);
    // Animar: aparece → espera → desaparece
    banner.animate([
      { opacity:0, transform:'translateY(-10px) scale(.9)' },
      { opacity:1, transform:'translateY(0)     scale(1)',  offset:.15 },
      { opacity:1, transform:'translateY(0)     scale(1)',  offset:.75 },
      { opacity:0, transform:'translateY(10px)  scale(.95)' },
    ], { duration: 2200, easing:'ease', fill:'forwards' })
    .onfinish = function() { banner.remove(); resolve(); };
  });
}

// Cola de eventos narrativos — los mostramos en secuencia
async function showEventQueue(events) {
  if (!events || !events.length) return;
  for (var i = 0; i < events.length; i++) {
    var ev  = events[i];
    var txt = typeof ev === 'string' ? ev : ev.text;
    var type = typeof ev === 'string' ? detectEventType(txt) : (ev.type || 'info');
    await showEventBanner(txt, type);
    await sleep(150);  // pausa entre eventos
  }
}

function detectEventType(txt) {
  var t = txt.toUpperCase();
  if (t.includes('CONGEL') || t.includes('ATURDI') || t.includes('FROZEN') || t.includes('STUN')) return 'status';
  if (t.includes('ENVENENA') || t.includes('VENENO') || t.includes('HEMORRAG') || t.includes('SANGRADO') || t.includes('🩸')) return 'poison';
  if (t.includes('RESURRECCIÓN') || t.includes('REVIVE') || t.includes('RESUCITA')) return 'death';
  if (t.includes('ESQUIVA') || t.includes('FALLA') || t.includes('HUMO') || t.includes('INMUNE')) return 'miss';
  if (t.includes('CURA') || t.includes('HEAL') || t.includes('ESCUDO')) return 'heal';
  if (t.includes('ATK') || t.includes('DEF') || t.includes('FRENESÍ') || t.includes('CONTRAATAQUE') || t.includes('GRITO') || t.includes('MURO')) return 'buff';
  if (t.includes('HP') && (t.includes('−') || t.includes('-'))) return 'hit';
  return 'info';
}

// ══════════════════════════════════════════════════════════
//  COUNTDOWN (30 s)
// ══════════════════════════════════════════════════════════
function startCountdown(timerStart) {
  stopCountdown();
  var wrap = document.getElementById('timer-wrap');
  if (wrap) wrap.classList.remove('hidden');
  function tick() {
    var rem = Math.max(0, 30 - Math.floor((Date.now() - timerStart) / 1000));
    var el  = document.getElementById('battle-timer');
    if (el) {
      el.textContent = rem;
      el.className = 'battle-timer' +
        (rem <= 5 ? ' timer-crit' : rem <= 10 ? ' timer-urgent' : rem <= 20 ? ' timer-warning' : '');
    }
    if (rem === 0) stopCountdown();
  }
  tick();
  countdownInterval = setInterval(tick, 400);
}
function stopCountdown() {
  clearInterval(countdownInterval); countdownInterval = null;
  var wrap = document.getElementById('timer-wrap');
  if (wrap) wrap.classList.add('hidden');
}

// ══════════════════════════════════════════════════════════
//  ESTRELLAS DE LA ESCENA
// ══════════════════════════════════════════════════════════
function initBattleScene() {
  var c = document.getElementById('bs-stars-layer');
  if (!c || c.dataset.init) return;
  c.dataset.init = '1';
  for (var i = 0; i < 60; i++) {
    var s = document.createElement('div'); s.className = 'bs-star';
    var sz = .8 + Math.random() * 2;
    s.style.cssText = 'width:'+sz+'px;height:'+sz+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;animation-duration:'+(1.5+Math.random()*4)+'s;animation-delay:'+(Math.random()*4)+'s;';
    c.appendChild(s);
  }
}

// ══════════════════════════════════════════════════════════
//  REGLAS
// ══════════════════════════════════════════════════════════
function toggleRules() {
  var p = document.getElementById('rules-panel'), b = document.getElementById('btn-rules');
  if (!p) return;
  var h = p.classList.toggle('hidden');
  if (b) b.textContent = h ? '📖 Reglas ▾' : '📖 Reglas ▴';
}

// ══════════════════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function setPokeMsg(t) {
  var el = document.getElementById('poke-msg'); if (!el) return;
  el.classList.remove('msg-anim'); void el.offsetWidth;
  el.textContent = t; el.classList.add('msg-anim');
}

function updateHpBar(id, hp, maxHp) {
  var bar = document.getElementById(id); if (!bar) return;
  var pct = Math.max(0, Math.round(hp / maxHp * 100));
  bar.style.width = pct + '%';
  if (pct > 50)      { bar.style.background='linear-gradient(90deg,#00bb44,#44ff99)'; bar.style.boxShadow='0 0 6px rgba(0,200,100,.7)'; }
  else if (pct > 25) { bar.style.background='linear-gradient(90deg,#bb8800,#ffcc00)'; bar.style.boxShadow='0 0 6px rgba(220,160,0,.7)'; }
  else               { bar.style.background='linear-gradient(90deg,#990000,#ff2222)'; bar.style.boxShadow='0 0 8px rgba(255,30,30,.8)'; }
}

// ══════════════════════════════════════════════════════════
//  EFECTOS VISUALES
// ══════════════════════════════════════════════════════════
function spawnParticles(tEl, color, count, opts) {
  var layer=document.getElementById('anim-layer'); if (!layer||!tEl) return;
  var lr=layer.getBoundingClientRect(), tr=tEl.getBoundingClientRect();
  var cx=(tr.left+tr.width/2)-lr.left, cy=(tr.top+tr.height/2)-lr.top;
  count=count||8; opts=opts||{};
  var spread=opts.spread||55, upBias=opts.upBias||-12, minSz=opts.minSize||3, maxSz=opts.maxSize||9, dur=opts.dur||600;
  for (var i=0;i<count;i++){(function(){
    var p=document.createElement('div'), sz=minSz+Math.random()*(maxSz-minSz);
    p.style.cssText='position:absolute;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+color+';left:'+cx+'px;top:'+cy+'px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 '+(sz*1.5)+'px '+color;
    layer.appendChild(p);
    var a=Math.random()*Math.PI*2, d=(0.4+Math.random()*0.6)*spread;
    var anim=p.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(calc(-50% + '+(Math.cos(a)*d)+'px),calc(-50% + '+(Math.sin(a)*d+upBias)+'px)) scale(0)',opacity:0}],{duration:dur+Math.random()*300,easing:'ease-out',fill:'forwards'});
    anim.onfinish=function(){p.remove();};
  })();}
  (function(){
    var ring=document.createElement('div');
    ring.style.cssText='position:absolute;left:'+cx+'px;top:'+cy+'px;width:8px;height:8px;border:2px solid '+color+';border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 8px '+color;
    layer.appendChild(ring);
    var anim=ring.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:.9},{transform:'translate(-50%,-50%) scale(7)',opacity:0}],{duration:500,easing:'ease-out',fill:'forwards'});
    anim.onfinish=function(){ring.remove();};
  })();
}

function spawnRisingParticles(tEl, color, count) {
  var layer=document.getElementById('anim-layer'); if (!layer||!tEl) return;
  var lr=layer.getBoundingClientRect(), tr=tEl.getBoundingClientRect();
  var bx=(tr.left+tr.width/2)-lr.left, by=(tr.top+tr.height*.8)-lr.top;
  for(var i=0;i<(count||8);i++){(function(){
    var p=document.createElement('div'), sz=4+Math.random()*6, ox=(Math.random()-.5)*tr.width*.7;
    p.style.cssText='position:absolute;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+color+';left:'+(bx+ox)+'px;top:'+by+'px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 '+sz+'px '+color;
    layer.appendChild(p);
    var rise=40+Math.random()*50;
    var anim=p.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,calc(-50% - '+rise+'px)) scale(0)',opacity:0}],{duration:700+Math.random()*400,delay:Math.random()*200,easing:'ease-out',fill:'forwards'});
    anim.onfinish=function(){p.remove();};
  })();}
}

function spawnBuffAura(tEl, color) {
  var layer=document.getElementById('anim-layer'); if (!layer||!tEl) return;
  var lr=layer.getBoundingClientRect(), tr=tEl.getBoundingClientRect();
  var cx=(tr.left+tr.width/2)-lr.left, cy=(tr.top+tr.height/2)-lr.top, sz=tr.width*.5;
  for(var i=0;i<3;i++){(function(d){setTimeout(function(){
    var r=document.createElement('div');
    r.style.cssText='position:absolute;left:'+cx+'px;top:'+cy+'px;width:'+sz+'px;height:'+sz+'px;border:2px solid '+color+';border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 16px '+color;
    layer.appendChild(r);
    var anim=r.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:.8},{transform:'translate(-50%,-50%) scale(3)',opacity:0}],{duration:700,easing:'ease-out',fill:'forwards'});
    anim.onfinish=function(){r.remove();};
  },d*180);})(i);}
}

function spawnDmgNumber(tEl, text, color, big) {
  var layer=document.getElementById('anim-layer'); if (!layer||!tEl) return;
  var lr=layer.getBoundingClientRect(), tr=tEl.getBoundingClientRect();
  var el=document.createElement('div'), ox=(Math.random()-.5)*30;
  el.className='dmg-number'; el.textContent=text;
  el.style.left=((tr.left+tr.width/2)-lr.left+ox)+'px';
  el.style.top=((tr.top+tr.height*.4)-lr.top)+'px';
  el.style.color=color||'#fff';
  el.style.fontSize=big?'clamp(1.3rem,3.5vw,2rem)':'clamp(.9rem,2.2vw,1.3rem)';
  layer.appendChild(el);
  setTimeout(function(){el.remove();},1400);
}

function shakeScene(i) {
  var s=document.getElementById('battle-scene'); if (!s) return;
  s.animate([{transform:'translate(0,0)'},{transform:'translate(-'+i+'px,'+(i*.5)+'px)'},{transform:'translate('+i+'px,-'+(i*.5)+'px)'},{transform:'translate(-'+(i*.6)+'px,-'+i+'px)'},{transform:'translate('+(i*.6)+'px,'+i+'px)'},{transform:'translate(0,0)'}],{duration:350,easing:'ease-out'});
}

function flashScreen(color) {
  return new Promise(function(resolve){
    var fl=document.getElementById('bs-flash'); if (!fl){resolve();return;}
    fl.style.background=color||'#fff';
    fl.classList.remove('hidden','do-flash'); void fl.offsetWidth;
    fl.classList.add('do-flash');
    setTimeout(function(){fl.classList.add('hidden');fl.classList.remove('do-flash');resolve();},680);
  });
}

function animLunge(sid, isMine) {
  return new Promise(function(resolve){
    var el=document.getElementById(sid); if (!el){resolve();return;}
    var cls=isMine?'anim-lunge-r':'anim-lunge-l';
    el.classList.add(cls); setTimeout(function(){el.classList.remove(cls);resolve();},330);
  });
}

function animHit(sid, type) {
  return new Promise(function(resolve){
    var el=document.getElementById(sid); if (!el){resolve();return;}
    var map={hit:'anim-hit',freeze:'anim-freeze',poison:'anim-poison',holy:'anim-holy',heal:'anim-heal · CD:3t',buff:'anim-buff',stun:'anim-stun'};
    var cls=map[type]||'anim-hit';
    el.classList.add(cls); setTimeout(function(){el.classList.remove(cls);resolve();},650);
  });
}

function animProjectile(emoji, color, fromEl, toEl) {
  return new Promise(function(resolve){
    var layer=document.getElementById('anim-layer'); if (!layer||!fromEl||!toEl){resolve();return;}
    var lr=layer.getBoundingClientRect(),fr=fromEl.getBoundingClientRect(),tr=toEl.getBoundingClientRect();
    var sx=(fr.left+fr.width/2)-lr.left, sy=(fr.top+fr.height/2)-lr.top;
    var ex=(tr.left+tr.width/2)-lr.left, ey=(tr.top+tr.height/2)-lr.top;
    var proj=document.createElement('div');
    proj.style.cssText='position:absolute;left:'+sx+'px;top:'+sy+'px;font-size:clamp(1.5rem,3vw,2rem);transform:translate(-50%,-50%);pointer-events:none;z-index:36;filter:drop-shadow(0 0 8px '+color+');line-height:1';
    proj.textContent=emoji; layer.appendChild(proj);
    var ti=setInterval(function(){
      var t=document.createElement('div'), sz=4+Math.random()*7;
      t.style.cssText='position:absolute;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+color+';left:'+parseFloat(proj.style.left)+'px;top:'+parseFloat(proj.style.top)+'px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 '+sz+'px '+color+';z-index:35';
      layer.appendChild(t);
      var ta=t.animate([{opacity:.8},{opacity:0,transform:'translate(-50%,-50%) scale(0)'}],{duration:350,easing:'ease-out',fill:'forwards'});
      ta.onfinish=function(){t.remove();};
    },45);
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      var dur=580;
      proj.style.transition='left '+dur+'ms cubic-bezier(.3,.7,.5,1),top '+dur+'ms cubic-bezier(.3,.7,.5,1),transform '+dur+'ms,opacity .1s '+(dur*.88)+'ms';
      proj.style.left=ex+'px'; proj.style.top=ey+'px';
      proj.style.transform='translate(-50%,-50%) scale(2.4)'; proj.style.opacity='0';
      setTimeout(function(){clearInterval(ti);proj.remove();resolve();},dur+120);
    });});
  });
}

function animDrop(emoji, color, targetEl) {
  return new Promise(function(resolve){
    var layer=document.getElementById('anim-layer'); if (!layer||!targetEl){resolve();return;}
    var lr=layer.getBoundingClientRect(), tr=targetEl.getBoundingClientRect();
    var ex=(tr.left+tr.width/2)-lr.left, ey=(tr.top+tr.height/2)-lr.top;
    var proj=document.createElement('div');
    proj.style.cssText='position:absolute;left:'+ex+'px;top:-60px;font-size:clamp(2rem,4.5vw,2.8rem);transform:translate(-50%,-50%) scale(1.5);pointer-events:none;z-index:36;filter:drop-shadow(0 0 16px '+color+');line-height:1';
    proj.textContent=emoji; layer.appendChild(proj);
    var ti=setInterval(function(){
      var t=document.createElement('div'), sz=5+Math.random()*10, ox=(Math.random()-.5)*20;
      t.style.cssText='position:absolute;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+color+';left:'+(ex+ox)+'px;top:'+parseFloat(proj.style.top)+'px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 '+sz+'px '+color+';z-index:35';
      layer.appendChild(t);
      var ta=t.animate([{opacity:.9},{opacity:0,transform:'translate(-50%,-50%) scale(0)'}],{duration:280,easing:'ease-out',fill:'forwards'});
      ta.onfinish=function(){t.remove();};
    },40);
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      proj.style.transition='top .52s cubic-bezier(.15,0,.85,1.3),transform .52s,opacity .08s .5s';
      proj.style.top=ey+'px'; proj.style.transform='translate(-50%,-50%) scale(3)'; proj.style.opacity='0';
      setTimeout(function(){clearInterval(ti);proj.remove();resolve();},640);
    });});
  });
}

function animWave(emoji, color) {
  return new Promise(function(resolve){
    var layer=document.getElementById('anim-layer'); if (!layer){resolve();return;}
    var w=document.createElement('div'); w.className='anim-wave';
    w.textContent=emoji; w.style.color=color; w.style.filter='drop-shadow(0 0 22px '+color+')';
    layer.appendChild(w); setTimeout(function(){w.remove();resolve();},800);
  });
}

// ══════════════════════════════════════════════════════════
//  ANIMACIÓN PRINCIPAL POR HABILIDAD
// ══════════════════════════════════════════════════════════
async function playAnimation(skillId, isMine, dmgDealt, healed) {
  var a   = ANIM[skillId]||{emoji:'💢',color:'#fff',type:'projectile',selfAnim:'lunge',hitAnim:'hit',shake:4,dmgColor:'#fff'};
  var atkId = isMine?'bat-player-icon':'bat-enemy-icon';
  var defId = isMine?'bat-enemy-icon':'bat-player-icon';
  var atkEl = document.getElementById(atkId), defEl = document.getElementById(defId);

  if (a.selfAnim==='lunge') {
    animLunge(atkId, isMine); await sleep(100);
  } else if (a.selfAnim==='buff') {
    spawnBuffAura(atkEl, a.color); await animHit(atkId,'buff'); return;
  } else if (a.selfAnim==='heal') {
    spawnRisingParticles(atkEl, a.color, 10);
    await animHit(atkId,'heal');
    if (healed && healed>0) spawnDmgNumber(atkEl,'+'+healed,'#00ff88',false);
    return;
  }

  if      (a.type==='projectile') await animProjectile(a.emoji, a.color, atkEl, defEl);
  else if (a.type==='flash')      await flashScreen(a.color+'bb');
  else if (a.type==='drop')       await animDrop(a.emoji, a.color, defEl);
  else if (a.type==='wave')       await animWave(a.emoji, a.color);
  else { await sleep(100); return; }

  if (a.hitAnim) {
    spawnParticles(defEl, a.color, a.shake>=10?16:a.shake>=6?12:8, {spread:50+a.shake*2});
    if (a.shake>0) shakeScene(a.shake);
    if (dmgDealt && dmgDealt>0) spawnDmgNumber(defEl,'−'+dmgDealt, a.dmgColor, dmgDealt>=35||a.shake>=10);
    if (healed   && healed>0)   spawnDmgNumber(atkEl,'+'+healed,  '#00ff88',  false);
    await animHit(defId, a.hitAnim);
  }
}

// ══════════════════════════════════════════════════════════
//  RENDER DE LISTA DE COMBATES
// ══════════════════════════════════════════════════════════
async function renderMatches() {
  if (AppState.role==='teacher'){showView('teacher');return;}
  try {
    var matches = await getMatches();
    var c = document.getElementById('matches-list');
    if (!matches.length) {
      c.innerHTML='<div class="card"><div style="color:var(--muted);font-style:italic;padding:.5rem">Sin combates asignados todavía.</div></div>';
      return;
    }
    matches.sort(function(a,b){
      var an=a.status==='active'&&a.state&&!a.state.myAction;
      var bn=b.status==='active'&&b.state&&!b.state.myAction;
      if(an&&!bn)return -1; if(!an&&bn)return 1;
      if(a.status==='active'&&b.status!=='active')return -1;
      if(a.status!=='active'&&b.status==='active')return 1;
      return 0;
    });
    c.innerHTML=matches.map(function(m){
      var opp=m.player1===AppState.username?m.player2:m.player1;
      var needsAct=m.status==='active'&&m.state&&!m.state.myAction;
      var st,sc;
      if(m.status==='finished'){
        if(m.winner==='empate')               {st='🤝 Empate';    sc='badge-blue';}
        else if(m.winner===AppState.username) {st='🏆 Victoria';  sc='badge-green';}
        else                                  {st='💀 Derrota';   sc='badge-red';}
      } else if(needsAct){st='⚔ ¡Elige!';sc='badge-gold';}
      else                {st='⏳ Esperando';sc='badge-blue';}
      var btn=m.status==='active'
        ?'<button class="btn btn-gold btn-sm" onclick="openBattle(\''+m.id+'\')">Combatir</button>'
        :'<button class="btn btn-ghost btn-sm" onclick="openBattle(\''+m.id+'\')">Ver</button>';
      return '<div class="card match-card '+(needsAct?'match-myturn':'')+'"><div class="match-row">'+
        '<div><div class="match-title">vs '+opp+'</div><div class="match-meta">Turno '+(m.state?m.state.turn:1)+'</div></div>'+
        '<div style="display:flex;align-items:center;gap:.7rem"><span class="badge '+sc+'">'+st+'</span>'+btn+'</div>'+
        '</div></div>';
    }).join('');
  } catch(err){showToast(err.message);}
}

// ══════════════════════════════════════════════════════════
//  ABRIR COMBATE
// ══════════════════════════════════════════════════════════
async function openBattle(matchId) {
  currentMatchId=matchId; animationInProgress=false; myActionSubmitted=false;
  try {
    var match=await getMatch(matchId);
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    document.getElementById('battle-view').classList.remove('hidden');
    document.querySelectorAll('.nav-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='matches'));
    initBattleScene();

    // Instalar listener del botón stun (clonar para limpiar listeners previos)
    var sBtn=document.getElementById('btn-stun-skip');
    if (sBtn) {
      var nb=sBtn.cloneNode(true); sBtn.parentNode.replaceChild(nb,sBtn);
      nb.addEventListener('click', function(){ handleStunSkip(currentMatchId); });
    }
    renderBattleState(match);
  } catch(err){showToast(err.message);}
}

// ══════════════════════════════════════════════════════════
//  RENDER ESTADO DE BATALLA
//  FIX CRÍTICO: stun/freeze resetea myActionSubmitted SIEMPRE.
//  El botón nunca se deshabilita por CSS — solo brevemente
//  en handleStunSkip para evitar doble clic.
// ══════════════════════════════════════════════════════════
function renderBattleState(match) {
  var st=match.state;
  var isP1=st.p1.username===AppState.username;
  var my=isP1?st.p1:st.p2, opp=isP1?st.p2:st.p1;

  // Sprites / nombres / HP
  var piEl=document.getElementById('bat-player-icon'), eiEl=document.getElementById('bat-enemy-icon');
  if(piEl) piEl.textContent=CLS_ICON[my.cls]||'?';
  if(eiEl) eiEl.textContent=CLS_ICON[opp.cls]||'?';
  var pnEl=document.getElementById('bat-player-name'), enEl=document.getElementById('bat-enemy-name');
  if(pnEl) pnEl.textContent=my.username; if(enEl) enEl.textContent=opp.username;
  updateHpBar('bat-player-bar',my.hp,my.maxHp); updateHpBar('bat-enemy-bar',opp.hp,opp.maxHp);
  var ppEl=document.getElementById('bat-player-num'), epEl=document.getElementById('bat-enemy-num');
  if(ppEl) ppEl.textContent=my.hp+'/'+my.maxHp; if(epEl) epEl.textContent=opp.hp+'/'+opp.maxHp;
  renderBuffs('bat-player-buffs',my); renderBuffs('bat-enemy-buffs',opp);

  // Ocultar todos los paneles de acción
  ['poke-skill-panel','stun-panel','poke-waiting-panel','battle-result'].forEach(function(id){
    var e=document.getElementById(id); if(e) e.classList.add('hidden');
  });
  stopCountdown();

  // ── Fin de combate ──────────────────────────────────────
  if (match.status==='finished') {
    var rEl=document.getElementById('battle-result'); if(rEl) rEl.classList.remove('hidden');
    var won=match.winner===AppState.username, emp=match.winner==='empate';
    var reEl=document.getElementById('result-emoji'), rtEl=document.getElementById('result-title'), rnEl=document.getElementById('result-name');
    if(reEl) reEl.textContent=emp?'🤝':won?'🏆':'💀';
    if(rtEl) rtEl.textContent=emp?'Empate':won?'¡Victoria!':'Derrota';
    if(rnEl) rnEl.textContent=emp?'Nadie gana esta vez':won?'Has derrotado a '+opp.username:match.winner+' gana el combate';
    setPokeMsg(emp?'¡Empate!':won?'¡Has ganado!':'¡'+match.winner+' gana!');
    renderBattleLog(st.log||[]);
    return;
  }

  // ── STUN / FREEZE — RESET OBLIGATORIO de myActionSubmitted ─
  // Sin este reset, si myActionSubmitted=true del turno anterior,
  // se mostraría el panel de espera en vez del botón de pasar turno.
  if (my.status==='stunned'||my.status==='frozen') {
    myActionSubmitted = false;          // ← RESET CRÍTICO
    var stunEl=document.getElementById('stun-panel');
    if (stunEl) {
      stunEl.classList.remove('hidden');
      var ic=document.getElementById('stun-icon'), mg=document.getElementById('stun-msg');
      if(ic) ic.textContent=my.status==='stunned'?'⚡':'❄️';
      if(mg) mg.textContent=my.status==='stunned'
        ?'¡Estás ATURDIDO! Pierdes este turno.'
        :'¡Estás CONGELADO! Pierdes este turno.';
      // El botón NUNCA se deshabilita aquí
      var sb=document.getElementById('btn-stun-skip'); if(sb) sb.disabled=false;
    }
    startCountdown(st.timerStart);
    setPokeMsg(my.status==='stunned'?'⚡ ¡Aturdido! Pulsa para pasar turno.':'❄️ ¡Congelado! Pulsa para pasar turno.');
    renderBattleLog(st.log||[]);
    return;
  }

  // ── Ya envié acción ──────────────────────────────────────
  if (myActionSubmitted||st.myAction) {
    myActionSubmitted=true;
    var wEl=document.getElementById('poke-waiting-panel');
    if(wEl){
      wEl.classList.remove('hidden');
      var rrb=document.getElementById('rival-ready-badge-w');
      if(rrb) rrb.classList.toggle('hidden',!st.rivalSubmitted);
    }
    startCountdown(st.timerStart);
    setPokeMsg(st.rivalSubmitted?'¡El rival ya eligió! Calculando...':'Habilidad enviada. Esperando al rival...');
    renderBattleLog(st.log||[]);
    return;
  }

  // ── Elegir habilidad ─────────────────────────────────────
  var skEl=document.getElementById('poke-skill-panel');
  if(skEl){
    skEl.classList.remove('hidden');
    var rrb2=document.getElementById('rival-ready-badge-s');
    if(rrb2) rrb2.classList.toggle('hidden',!st.rivalSubmitted);
    renderSkillButtons(my.skills, match.id, my.cooldowns || {});
  }
  startCountdown(st.timerStart);
  setPokeMsg(st.rivalSubmitted?'¡El rival ya eligió! ¿Qué harás?':'¡Elige tu habilidad! (30 s)');
  renderBattleLog(st.log||[]);
}

// ── Buffs ─────────────────────────────────────────────────
function renderBuffs(elId, ps) {
  var el=document.getElementById(elId); if(!el) return;
  var names={atk_up:'⚔+',def_up:'🛡+',shield:'🔮',evade:'💨',immune:'🌟',counter:'↩️ · CD:3t',berserk:'😤 · CD:4t',smoke:'💣',res_buff:'🌅'};
  var html='';
  if(ps.buffs) Object.keys(ps.buffs).forEach(function(k){
    if(!ps.buffs[k]) return;
    var t=(ps.buffs[k]&&typeof ps.buffs[k]==='object'&&ps.buffs[k].turns!==undefined)?'('+ps.buffs[k].turns+')':'';
    html+='<span class="bs-buff-tag '+k+'">'+(names[k]||k)+t+'</span>';
  });
  if(ps.poison&&ps.poison.turns>0) html+='<span class="bs-buff-tag poison">☠('+ps.poison.turns+'t)</span>';
  if(ps.bleed&&ps.bleed.turns>0)   html+='<span class="bs-buff-tag bleed">🩸('+ps.bleed.turns+'t)</span>';
  if(ps.status)                    html+='<span class="bs-buff-tag '+ps.status+'">'+(ps.status==='stunned'?'⚡':'❄️')+'</span>';
  el.innerHTML=html;
}

// ── Botones de habilidades ────────────────────────────────
function renderSkillButtons(skills, matchId, cooldowns) {
  var grid=document.getElementById('skill-buttons'); if(!grid) return;
  // SKILL_DESC: descripciones cortas para el tooltip (title) de cada habilidad
  var SKILL_DESC = {
    fireball:'Daño: 30 · Precisión: 100% · Velocidad: Normal',
    frost_bolt:'Daño: 18 · Precisión: 100% · Congela: 45% (20% de 2 turnos) · Vel: Algo rápida',
    arcane_blast:'Daño: 24 · Precisión: 100% · Ignora 50% defensa · Vel: Normal',
    mana_shield:'Reduce 50% el próximo golpe recibido · Vel: Algo lenta · CD:2t',
    lightning:'Daño: 50 · Precisión: 60% · Velocidad: Algo rápida',
    drain_life:'Daño: 22 · Cura: 10% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t',
    meteor:'Daño: 62 · Precisión: 60% · Velocidad: Lenta',
    blizzard:'Daño: 22 · Precisión: 100% · Congela: 55% (35% de 2 turnos) · Vel: Algo rápida · CD:3t',
    brutal_strike:'Daño: 32 · Precisión: 100% · Velocidad: Normal',
    shield_bash:'Daño: 16 · Precisión: 100% · Aturde: 40% (20% de 2 turnos) · Vel: Algo rápida',
    war_cry:'ATK ×1.4 durante 2 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t',
    shield_wall:'DEF ×1.55 durante 2 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t',
    whirlwind:'Daño: 38 · Precisión: 100% · Velocidad: Normal',
    counter:'Devuelve ×2 el daño recibido ese turno · Vel: MUY LENTA · CD:3t',
    berserk:'ATK ×1.6 / DEF ×0.75 durante 3 turnos · Vel: Algo lenta · CD:4t',
    execute:'Daño: 50 · Precisión: 60% · ×2 si rival <28% HP · Vel: Rápida',
    stab:'Daño: 24 · Precisión: 100% · Velocidad: Normal',
    poison:'Daño: 10 · Veneno: 8% HP máx/turno × 3 turnos · Acumulable · Vel: Normal',
    evasion:'72% de esquivar el siguiente ataque · Vel: Normal · CD:2t',
    backstab:'Daño: 28 · ×1.55 si rival tiene buffs · Precisión: 100% · Vel: Normal',
    critical:'Daño: 60 · Precisión: 60% · Velocidad: Algo rápida',
    smoke_bomb:'El siguiente ataque del rival falla · Vel: Algo lenta · CD:3t',
    hemorrhage:'Daño: 12 · Sangrado: 1%-16% HP máx/turno (+2% por aplicación) × 4 turnos · Acumulable · Vel: Normal',
    shadow_step:'Daño: 36 · Precisión: 100% · Evasión 85% siguiente turno · Vel: MUY RÁPIDA · CD:4t',
    holy_strike:'Daño: 26 · Precisión: 100% · Velocidad: Normal',
    heal:'Cura: 22% HP máx propio · Precisión: 100% · Vel: Algo lenta · CD:3t',
    divine_shield:'Inmune al siguiente ataque · Vel: Algo lenta · CD:3t',
    consecration:'Daño: 20 + fuego sagrado 6/turno × 2 turnos · Vel: Normal',
    judgment:'Daño: 42 · Precisión: 100% · Velocidad: Normal',
    holy_nova:'Daño: 26 · Cura: 14% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t',
    avenging_wrath:'ATK ×1.5 durante 3 turnos · Precisión: 100% · Vel: Algo lenta · CD:3t',
    resurrection:'Al morir, revives con 28% HP (1 vez) · Vel: Algo lenta · CD:6t',
    // Druida
    thorn_whip:'Daño: 24 · Precisión: 100% · Velocidad: Normal',
    entangle:'Daño: 12 · Raíces: 40% de aturdir (20% 2 turnos) · Vel: Algo rápida',
    regeneration:'Cura: 18% HP máx propio · Vel: Algo lenta · CD:3t',
    barkskin:'DEF ×1.5 durante 2 turnos · Vel: Algo lenta · CD:2t',
    nature_wrath:'Daño: 42 · Precisión: 100% · Velocidad: Normal',
    spore_cloud:'Daño: 8 · Veneno: 8% HP máx/turno × 4 turnos · Vel: Normal · CD:2t',
    wild_growth:'Daño: 24 · Cura: 16% HP máx propio · Vel: Normal · CD:3t',
    shapeshifter:'ATK ×1.5 y DEF ×1.3 durante 3 turnos · Vel: Algo lenta · CD:4t',
    // Brujo
    shadow_bolt:'Daño: 30 · Precisión: 100% · Velocidad: Normal',
    life_tap:'Daño: 20 · Cura: 12% HP máx propio · Precisión: 100% · Vel: Normal',
    curse:'Daño: 5 · Veneno: 8% HP máx/turno × 5 turnos · Vel: Normal',
    dark_pact:'ATK ×1.7 durante 2 turnos · Vel: Algo lenta · CD:3t',
    soul_drain:'Daño: 32 · Cura: 18% HP máx propio · Precisión: 85% · Vel: Normal · CD:3t',
    corruption:'Daño: 12 · Sangrado: 1%-16% HP máx/turno × 5 turnos · Vel: Normal · CD:2t',
    fel_flame:'Daño: 55 · Precisión: 65% · Velocidad: Normal',
    void_rift:'Daño: 72 · Precisión: 50% · Ignora 40% defensa · Vel: Lenta',
    // Arquero
    quick_shot:'Daño: 22 · Precisión: 100% · Velocidad: Rápida',
    arrow_rain:'Daño: 10 · Sangrado: 1%-16% HP máx/turno × 3 turnos · Vel: Normal',
    trip_wire:'Evasión 80% siguiente ataque · Vel: Algo lenta · CD:2t',
    aimed_shot:'Daño: 38 · Precisión: 85% · Velocidad: Lenta',
    explosive_arrow:'Daño: 46 · Precisión: 80% · Velocidad: Normal',
    hunter_mark:'Daño: 28 · Precisión: 100% · Ignora 60% defensa · Vel: Normal · CD:2t',
    multishot:'Daño: 18 · Sangrado: 1%-16% HP máx/turno × 4 turnos · Vel: Algo rápida · CD:2t',
    death_arrow:'Daño: 68 · Precisión: 55% · Velocidad: Normal',
    // Nigromante
    bone_spear:'Daño: 28 · Precisión: 100% · Velocidad: Normal',
    wither:'Daño: 6 · Veneno: 8% HP máx/turno × 4 turnos · Vel: Normal',
    soul_harvest:'Daño: 22 · Cura: 14% HP máx propio · Precisión: 100% · Vel: Normal',
    death_coil:'Daño: 16 · Precisión: 100% · Aturde: 35% (20% de 2 turnos) · Vel: Algo rápida',
    plague:'Daño: 14 · Sangrado: 1%-16% HP máx/turno × 5 turnos · Vel: Normal · CD:2t',
    necrotic_touch:'Daño: 30 · Cura: 20% HP máx propio · Precisión: 100% · Vel: Normal · CD:3t',
    undead_resilience:'DEF ×1.6 durante 3 turnos · Vel: Algo lenta · CD:3t',
    lich_form:'ATK ×1.8 / DEF ×0.6 durante 4 turnos · Vel: Algo lenta · CD:5t',
  };
  cooldowns = cooldowns || {};
  grid.innerHTML=skills.map(function(sid){
    var sk=SKILL_UI[sid]||{name:sid,icon:'?'};
    var desc=SKILL_DESC[sid]||'';
    var cd=cooldowns[sid]||0;
    var onCd=cd>0;
    if(onCd){
      return '<button class="skill-btn skill-cd" disabled title="En cooldown: '+cd+' turno'+(cd>1?'s':'')+' restante'+(cd>1?'s':'')+'">' +
        '<span class="sk-btn-icon">'+sk.icon+'</span>' +
        '<span class="sk-btn-text">' +
          '<span class="sk-btn-name">'+sk.name+'</span>' +
          '<span class="sk-btn-cd">⏳ '+cd+' turno'+(cd>1?'s':'')+' restante'+(cd>1?'s':'')+'</span>' +
        '</span>' +
        '</button>';
    }
    return '<button class="skill-btn" onclick="handleAction(\''+matchId+'\',\''+sid+'\')" title="'+desc+'">' +
      '<span class="sk-btn-icon">'+sk.icon+'</span>' +
      '<span class="sk-btn-text"><span class="sk-btn-name">'+sk.name+'</span>' +
      (desc?'<span class="sk-btn-desc">'+desc+'</span>':'')+
      '</span>' +
      '</button>';
  }).join('');
  // Si todas las habilidades están en cooldown → mostrar botón de pasar turno
  var allOnCd = skills.length > 0 && skills.every(function(sid){ return (cooldowns[sid]||0) > 0; });
  if (allOnCd) {
    grid.innerHTML += '<button class="skill-btn skill-skip" onclick="handleAction(\''+matchId+'\',' +
      '\'__skip__\')" title="Todas tus habilidades están en cooldown">' +
      '<span class="sk-btn-icon">⏭</span>' +
      '<span class="sk-btn-text"><span class="sk-btn-name">Pasar turno</span>' +
      '<span class="sk-btn-desc">Todas las habilidades en cooldown</span>' +
      '</span></button>';
  }
}

// ── Log ───────────────────────────────────────────────────
function renderBattleLog(log) {
  var el=document.getElementById('battle-log'); if(!el) return;
  el.innerHTML=log.map(function(msg){
    var cls='log-line';
    if(msg.indexOf('gana')!==-1||msg.indexOf('🏆')!==-1) cls+=' log-win';
    if(msg.indexOf('desconect')!==-1) cls+=' log-disc';
    return '<div class="'+cls+'">'+msg+'</div>';
  }).join('');
}
function toggleLog(){
  var log=document.getElementById('battle-log'), arr=document.getElementById('log-arrow'); if(!log) return;
  var h=log.style.display==='none'; log.style.display=h?'':'none'; if(arr) arr.textContent=h?'▼':'▶';
}

// ══════════════════════════════════════════════════════════
//  ACCIÓN NORMAL
// ══════════════════════════════════════════════════════════
async function handleAction(matchId, skillId) {
  if (animationInProgress||myActionSubmitted) return;
  myActionSubmitted=true;
  document.querySelectorAll('.skill-btn').forEach(b=>b.disabled=true);
  var sk=SKILL_UI[skillId]||{name:skillId,icon:'?'};
  setPokeMsg('¡Elegiste '+sk.icon+' '+sk.name+'!');
  var piEl=document.getElementById('bat-player-icon');
  if(piEl){piEl.classList.add('anim-buff');setTimeout(()=>piEl.classList.remove('anim-buff'),650);}
  try {
    await sendAction(matchId, skillId);
    // Guard: si onTurnResolved ya resolvió el turno mientras esperábamos
    // la respuesta HTTP, myActionSubmitted habrá sido reseteado a false.
    // En ese caso NO tocar la UI — ya está correctamente renderizada.
    if (!myActionSubmitted) return;
    var sEl=document.getElementById('poke-skill-panel'), wEl=document.getElementById('poke-waiting-panel');
    if(sEl) sEl.classList.add('hidden');
    if(wEl) wEl.classList.remove('hidden');
    setPokeMsg('¡Habilidad enviada! Esperando al rival...');
  } catch(err) {
    myActionSubmitted=false;
    document.querySelectorAll('.skill-btn').forEach(b=>b.disabled=false);
    showToast(err.message||'Error al enviar acción');
  }
}

// ══════════════════════════════════════════════════════════
//  PASAR TURNO (stun/freeze)
//  El botón NUNCA está disabled. myActionSubmitted se resetea
//  en renderBattleState antes de mostrar el panel.
// ══════════════════════════════════════════════════════════
async function handleStunSkip(matchId) {
  if (myActionSubmitted) return;
  myActionSubmitted=true;
  var btn=document.getElementById('btn-stun-skip'); if(btn) btn.disabled=true;
  var piEl=document.getElementById('bat-player-icon');
  if(piEl){piEl.classList.add('anim-stun');setTimeout(()=>piEl.classList.remove('anim-stun'),850);}
  setPokeMsg('Turno saltado. Esperando al rival...');
  try {
    await sendAction(matchId, '__skip__');
    // Guard: si onTurnResolved ya resolvió el turno mientras esperábamos,
    // no tocamos la UI — ya está correctamente renderizada.
    if (!myActionSubmitted) return;
    var sEl=document.getElementById('stun-panel'), wEl=document.getElementById('poke-waiting-panel');
    if(sEl) sEl.classList.add('hidden');
    if(wEl) wEl.classList.remove('hidden');
  } catch(err) {
    myActionSubmitted=false; if(btn) btn.disabled=false;
    showToast(err.message||'Error al pasar turno');
  }
}

// ══════════════════════════════════════════════════════════
//  RESOLUCIÓN DE TURNO (socket turn-resolved)
//  Animación secuencial + eventos narrativos
// ══════════════════════════════════════════════════════════
async function onTurnResolved(data) {
  stopCountdown();
  var mv=document.getElementById('matches-view');
  if(mv&&!mv.classList.contains('hidden')) renderMatches();

  // Combate eliminado por el docente
  if (data.winner === 'deleted' && data.matchId === currentMatchId) {
    animationInProgress = false;
    if (data.allEvents && data.allEvents.length) await showEventQueue(data.allEvents.slice(0,2));
    ['poke-skill-panel','stun-panel','poke-waiting-panel'].forEach(function(id){
      var e=document.getElementById(id); if(e) e.classList.add('hidden');
    });
    var rEl=document.getElementById('battle-result'); if(rEl) rEl.classList.remove('hidden');
    var reEl=document.getElementById('result-emoji'),rtEl=document.getElementById('result-title'),rnEl=document.getElementById('result-name');
    if(reEl) reEl.textContent='🚫';
    if(rtEl) rtEl.textContent='Combate cancelado';
    if(rnEl) rnEl.textContent='El docente ha eliminado este combate.';
    setPokeMsg('⚠ El docente ha cancelado el combate.');
    return;
  }

  if(data.matchId!==currentMatchId){
    myActionSubmitted=false;
    if(data.match&&data.match.state&&!data.match.state.myAction) showToast('⚔ ¡Nuevo turno en un combate!');
    return;
  }

  animationInProgress=true; myActionSubmitted=false;

  // try-catch global: si cualquier animación falla, el estado se resetea siempre
  try {
    var isP1 = AppState.username === data.match.player1;
    var myPs  = isP1 ? data.match.state.p1 : data.match.state.p2;
    var opPs  = isP1 ? data.match.state.p2 : data.match.state.p1;

    var results = data.results||[];
    for (var i=0; i<results.length; i++) {
      var r=results[i];
      var isMine=r.player===AppState.username;
      var atkSid=isMine?'bat-player-icon':'bat-enemy-icon';
      var defSid=isMine?'bat-enemy-icon':'bat-player-icon';

      if (r.skipped) {
        if (r.events && r.events.length) await showEventQueue(r.events.slice(0,2));
        var stEl=document.getElementById(atkSid);
        if(stEl){stEl.classList.add('anim-stun');await sleep(700);stEl.classList.remove('anim-stun');}
      } else {
        var skName=(SKILL_UI[r.skill]||{name:r.skill||'?'}).name;
        setPokeMsg((isMine?'¡Tú usas ':'¡'+r.player+' usa ')+skName+'!');

        await playAnimation(r.skill, isMine, r.dmgDealt, r.healed);

        if(r.dmgDealt>0){
          var dEl=document.getElementById(defSid);
          var ac=ANIM[r.skill];
          if(dEl&&ac) spawnDmgNumber(dEl,'−'+r.dmgDealt,ac.dmgColor,r.dmgDealt>=35);
        }
        if(r.healed>0){
          var hEl=document.getElementById(atkSid);
          if(hEl) spawnDmgNumber(hEl,'+'+r.healed,'#00ff88',false);
        }

        if (r.events && r.events.length) {
          var eventsToShow = r.events.slice(1);
          if (eventsToShow.length) await showEventQueue(eventsToShow);
        }

        // Actualizar barras HP — con guards para evitar errores
        var myHp = isP1?r.p1hp:r.p2hp, opHp = isP1?r.p2hp:r.p1hp;
        if(myPs) { updateHpBar('bat-player-bar',myHp,myPs.maxHp); }
        if(opPs) { updateHpBar('bat-enemy-bar', opHp,opPs.maxHp); }
        var pNum=document.getElementById('bat-player-num'), eNum=document.getElementById('bat-enemy-num');
        if(pNum&&myPs) pNum.textContent=myHp+'/'+myPs.maxHp;
        if(eNum&&opPs) eNum.textContent=opHp+'/'+opPs.maxHp;
      }
      await sleep(250);
    }

    // Eventos de final de turno (veneno, etc.)
    if (data.allEvents && data.allEvents.length) {
      var shownEvents = new Set();
      results.forEach(function(r){ (r.events||[]).forEach(function(e){ shownEvents.add(e); }); });
      var remainingEvents = data.allEvents.filter(function(e){ return !shownEvents.has(e); });
      if (remainingEvents.length) await showEventQueue(remainingEvents.slice(0, 3));
    }

    if(data.match && data.match.state && data.match.state.log) {
      setPokeMsg(data.match.state.log[0]||'...');
    }
    await sleep(400);
  } catch(err) {
    console.error('onTurnResolved error:', err);
  }

  // SIEMPRE se ejecuta, aunque haya habido error arriba
  animationInProgress=false;
  myActionSubmitted=false;
  if(data.match) renderBattleState(data.match);
}

// ══════════════════════════════════════════════════════════
//  RIVAL ENVIÓ ACCIÓN
// ══════════════════════════════════════════════════════════
function onActionSubmitted(data) {
  if (data.matchId!==currentMatchId) return;
  document.querySelectorAll('.rival-ready-badge').forEach(b=>b.classList.remove('hidden'));
  setPokeMsg(myActionSubmitted
    ?'¡Ambos eligieron! Calculando el turno...'
    :'¡El rival ya eligió! ¿Qué harás tú?');
}

// ══════════════════════════════════════════════════════════
//  DISPATCHER SOCKET
// ══════════════════════════════════════════════════════════
async function onMatchUpdate(data) {
  if (AppState.role==='teacher') {
    if (typeof onMatchUpdate_teacher === 'function') onMatchUpdate_teacher(data);
    return;
  }
  if (data.type==='turn-resolved')    { await onTurnResolved(data); return; }
  if (data.type==='action-submitted') { onActionSubmitted(data);    return; }
  // disconnect/fallback
  var mv=document.getElementById('matches-view');
  if(mv&&!mv.classList.contains('hidden')) renderMatches();
  if(data.matchId===currentMatchId&&data.match) renderBattleState(data.match);
}

// Alias para que teacher.js pueda sobreescribir onMatchUpdate
var onMatchUpdate_teacher = null;

// ══════════════════════════════════════════════════════════
//  CIERRE DE PESTAÑA → desconexión explícita
//  El server.js detecta socket.disconnect y finaliza el combate
// ══════════════════════════════════════════════════════════
window.addEventListener('beforeunload', function() {
  if (typeof socket !== 'undefined' && socket) {
    socket.disconnect();
  }
});