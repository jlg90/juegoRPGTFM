// ══════════════════════════════════════════════════════════════════
//  routes/battle.js  — Motor de combate SIMULTÁNEO  (v2 — fixes)
//
//  FIXES v2:
//  • Si el primer ataque stunnea/freezea al segundo, el segundo
//    no ataca ese turno (sa se fuerza a '__skip__')
//  • DELETE /match/:id emite 'match-update' con winner='deleted'
//    para que los jugadores vean el fin inmediatamente
// ══════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const DB_PATH  = path.join(__dirname, '../data/db.json');
const SECRET   = 'clavesecretaRPG_2026';
const TURN_MS  = 31_000;

function readDB()      { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(d)    { fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2), 'utf8'); }

function authMiddleware(req, res, next) {
  const h = req.headers['authorization'];
  if (!h) return res.status(401).json({ error: 'Token requerido' });
  try { req.user = jwt.verify(h.split(' ')[1], SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }
}
function teacherOnly(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Solo el docente' });
    next();
  });
}

// ══════════════════════════════════════════════════════════════════
//  HABILIDADES
// ══════════════════════════════════════════════════════════════════
const SKILLS = {
  fireball:      { name:'Bola de fuego',        type:'damage', power:30, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} lanza una bola de fuego abrasadora sobre {def}.' },
  frost_bolt:    { name:'Rayo de hielo',         type:'damage', power:18, acc:100, priority:1.1,  effect:{ apply:'enemy', status:'frozen',  statusChance:0.45, freezeChance2:0.20 },           flavor:'{atk} dispara un rayo de hielo que golpea a {def}.',         statusFlavor:'{def} queda CONGELADO y perderá su turno.' },
  arcane_blast:  { name:'Explosión árcana',      type:'damage', power:24, acc:100, priority:1.0,  effect:{ apply:'enemy', pierce:0.50 },                                    flavor:'{atk} desata una explosión arcana que atraviesa la defensa de {def}.' },
  mana_shield:   { name:'Escudo mágico',         type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'shield',   value:{ reduction:0.50 } },    cooldown:2,  flavor:'{atk} invoca un escudo mágico que bloqueará el 50% del próximo golpe.' },
  lightning:     { name:'Rayo',                  type:'damage', power:50, acc:60,  priority:1.1,  effect:null,                                                              flavor:'{atk} invoca un rayo devastador sobre {def}.' },
  drain_life:    { name:'Drenar vida',            type:'drain',  power:22, acc:100, priority:1.0,  effect:{ healPct:0.10 },                                                    cooldown:3,  flavor:'{atk} drena la vitalidad de {def} y la absorbe.' },
  meteor:        { name:'Meteoro',               type:'damage', power:62, acc:60,  priority:0.8,  effect:null,                                                              flavor:'{atk} invoca un meteorito sobre {def}.' },
  blizzard:      { name:'Ventisca',              type:'damage', power:22, acc:100, priority:1.1,  effect:{ apply:'enemy', status:'frozen',  statusChance:0.55, freezeChance2:0.35 },           cooldown:3,  flavor:'{atk} desata una ventisca helada sobre {def}.',              statusFlavor:'{def} queda CONGELADO por la ventisca.' },
  brutal_strike: { name:'Golpe brutal',          type:'damage', power:32, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} golpea brutalmente a {def}.' },
  shield_bash:   { name:'Golpe de escudo',       type:'damage', power:16, acc:100, priority:1.1,  effect:{ apply:'enemy', status:'stunned', statusChance:0.40, freezeChance2:0.20 },           flavor:'{atk} golpea a {def} con su escudo.',                        statusFlavor:'{def} queda ATURDIDO y perderá su turno.' },
  war_cry:       { name:'Grito de guerra',       type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'atk_up',  value:{ mult:1.40, turns:2 } }, cooldown:3,  flavor:'{atk} lanza un grito de guerra que aumenta su ataque.' },
  shield_wall:   { name:'Muro de escudo',        type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'def_up',  value:{ mult:1.55, turns:2 } }, cooldown:3,  flavor:'{atk} forma un muro con su escudo y aumenta su defensa.' },
  whirlwind:     { name:'Torbellino',            type:'damage', power:38, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} gira en torbellino golpeando a {def}.' },
  counter:       { name:'Contraataque',          type:'counter',power:0,  acc:100, priority:0.1,  effect:null,                                                              cooldown:3,  flavor:'{atk} adopta postura de contraataque — devolverá el doble del daño recibido.' },
  berserk:       { name:'Frenesí',               type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'berserk', value:{ atkMult:1.60, defMult:0.75, turns:3 } }, cooldown:4,  flavor:'{atk} entra en modo frenesí: más ataque, menos defensa.' },
  execute:       { name:'Ejecutar',              type:'damage', power:50, acc:60,  priority:1.2,  effect:{ apply:'enemy', execute:{ threshold:0.28, bonusMult:2.0 } },      flavor:'{atk} ejecuta un golpe letal sobre {def}.' },
  stab:          { name:'Puñalada',              type:'damage', power:24, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} clava su daga en {def}.' },
  poison:        { name:'Veneno',                type:'dot',    power:10, acc:100, priority:1.0,  effect:{ dotType:'poison', turns:3 },                                              flavor:'{atk} envenena a {def}.',                                    statusFlavor:'{def} queda ENVENENADO y perderá HP cada turno.' },
  evasion:       { name:'Evasión',               type:'buff',   power:0,  acc:100, priority:1.0,  effect:{ apply:'self', buffKey:'evade',   value:{ chance:0.72 } },        cooldown:2,  flavor:'{atk} adopta una postura evasiva para esquivar el siguiente ataque.' },
  backstab:      { name:'Apuñalada traicionera', type:'damage', power:28, acc:100, priority:1.0,  effect:{ apply:'enemy', backstabMult:1.55 },                              flavor:'{atk} apuñala traicioneramente a {def} por la espalda.' },
  critical:      { name:'Golpe crítico',         type:'damage', power:60, acc:60,  priority:1.1,  effect:null,                                                              flavor:'{atk} asesta un golpe crítico fulminante a {def}.' },
  smoke_bomb:    { name:'Bomba de humo',         type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'smoke',   value:true },                   cooldown:3,  flavor:'{atk} lanza una bomba de humo y desaparece entre la niebla.' },
  hemorrhage:    { name:'Hemorragia',            type:'dot',    power:12, acc:100, priority:1.0,  effect:{ dotType:'bleed',  turns:4 },                                              flavor:'{atk} provoca una hemorragia interna en {def}.',             statusFlavor:'{def} sufre una HEMORRAGIA y perderá HP cada turno.' },
  shadow_step:   { name:'Paso en sombra',        type:'damage', power:36, acc:100, priority:1.3,  effect:{ apply:'self', buffKey:'evade',   value:{ chance:0.85 } },         cooldown:4,  flavor:'{atk} se mueve entre las sombras y golpea a {def}.' },
  holy_strike:   { name:'Golpe sagrado',         type:'damage', power:26, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} golpea a {def} con la fuerza de la luz divina.' },
  heal:          { name:'Curación',              type:'heal',   power:0,  acc:100, priority:0.9,  effect:{ healPct:0.22 },                                                       cooldown:3,  flavor:'{atk} se cura con magia sagrada.' },
  divine_shield: { name:'Escudo divino',         type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'immune',  value:true },                   cooldown:3,  flavor:'{atk} invoca un escudo divino que lo hace inmune al siguiente ataque.' },
  consecration:  { name:'Consagración',          type:'dot',    power:20, acc:100, priority:1.0,  effect:{ dpt:6,  turns:2 },                                              flavor:'{atk} consagra el suelo con fuego sagrado bajo {def}.',     statusFlavor:'{def} queda CONSAGRADO y sufrirá daño de fuego sagrado.' },
  judgment:      { name:'Juicio',                type:'damage', power:42, acc:100, priority:1.0,  effect:null,                                                              flavor:'{atk} desata el juicio divino sobre {def}.' },
  holy_nova:     { name:'Nova sagrada',          type:'drain',  power:26, acc:100, priority:1.0,  effect:{ healPct:0.14 },                                                    cooldown:3,  flavor:'{atk} libera una explosión de luz sagrada que daña a {def} y lo cura.' },
  avenging_wrath:{ name:'Ira vengadora',         type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'atk_up',  value:{ mult:1.50, turns:3 } }, cooldown:3,  flavor:'{atk} canaliza la ira divina y aumenta su poder de ataque.' },
  resurrection:  { name:'Resurrección',          type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'res_buff',value:{ pct:0.28 } },           cooldown:6,  flavor:'{atk} prepara un encantamiento de resurrección.' },

  // ════════════════════════════════════════════════════════════════════════════════
  //  CLASES NUEVAS — Druida 🌿 · Brujo 👹 · Arquero 🏹 · Nigromante 💀
  //
  //  Reutilizan el motor existente sin modificarlo:
  //    type:'heal'    healPct          → curación % HP máx
  //    type:'drain'   healPct          → daño + curación % HP máx
  //    type:'dot'     dotType:'poison' → veneno 8% HP máx/turno
  //    type:'dot'     dotType:'bleed'  → sangrado acumulable 1-16%
  //    type:'buff'    buffKey:'def_up' / 'atk_up' / 'berserk' → buffs existentes
  //    status:'stunned'                → mismo stun que shield_bash
  //    pierce                          → ignora % defensa
  // ════════════════════════════════════════════════════════════════════════════════

  // ─── DRUIDA 🌿 ──────────────────────────────────────────────────────────────
  // Equilibrado: SPD media-alta, veneno, curación, buffs de defensa
  thorn_whip:        { name:'Látigo espinoso',       type:'damage', power:24, acc:100, priority:1.0,  effect:null,                                                                              flavor:'{atk} azota a {def} con un látigo de espinas.' },
  entangle:          { name:'Enredadera',             type:'damage', power:12, acc:100, priority:1.1,  effect:{ apply:'enemy', status:'stunned', statusChance:0.40, freezeChance2:0.20 },       flavor:'{atk} enreda a {def} con raíces de naturaleza.',       statusFlavor:'{def} queda ENREDADO y pierde su turno.' },
  regeneration:      { name:'Regeneración',           type:'heal',   power:0,  acc:100, priority:0.9,  effect:{ healPct:0.18 },                                                                 cooldown:3,  flavor:'{atk} canaliza la energía natural y se regenera.' },
  barkskin:          { name:'Corteza de árbol',       type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'def_up',  value:{ mult:1.5,  turns:2 } },                cooldown:2,  flavor:'{atk} endurece su piel como la corteza de un árbol.' },
  nature_wrath:      { name:'Ira de la naturaleza',   type:'damage', power:42, acc:100, priority:1.0,  effect:null,                                                                              flavor:'{atk} desata la furia de la naturaleza sobre {def}.' },
  spore_cloud:       { name:'Nube de esporas',        type:'dot',    power:8,  acc:100, priority:1.0,  effect:{ dotType:'poison', turns:4 },                                                    cooldown:2,  flavor:'{atk} lanza una nube de esporas venenosas sobre {def}.', statusFlavor:'{def} queda ENVENENADO por las esporas.' },
  wild_growth:       { name:'Crecimiento salvaje',    type:'drain',  power:24, acc:100, priority:1.0,  effect:{ healPct:0.16 },                                                                 cooldown:3,  flavor:'{atk} drena la vitalidad de {def} con raíces salvajes.' },
  shapeshifter:      { name:'Cambiaformas',           type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'berserk', value:{ atkMult:1.5, defMult:1.3, turns:3 } },cooldown:4,  flavor:'{atk} se transforma en una bestia salvaje aumentando ataque y defensa.' },

  // ─── BRUJO 👹 ───────────────────────────────────────────────────────────────
  // Ofensivo: ATK muy alto, baja DEF, magia oscura, veneno y sacrificio
  shadow_bolt:       { name:'Proyectil de sombra',    type:'damage', power:30, acc:100, priority:1.0,  effect:null,                                                                              flavor:'{atk} lanza un proyectil de energía oscura sobre {def}.' },
  life_tap:          { name:'Toque de vida',          type:'drain',  power:20, acc:100, priority:1.0,  effect:{ healPct:0.12 },                                                                 flavor:'{atk} succiona la fuerza vital de {def}.' },
  curse:             { name:'Maldición',              type:'dot',    power:5,  acc:100, priority:1.0,  effect:{ dotType:'poison', turns:5 },                                                    flavor:'{atk} maldice a {def} con energía oscura.',            statusFlavor:'{def} queda MALDECIDO y sufrirá veneno cada turno.' },
  dark_pact:         { name:'Pacto oscuro',           type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'atk_up',  value:{ mult:1.7,  turns:2 } },                cooldown:3,  flavor:'{atk} sella un pacto oscuro para aumentar su poder de ataque.' },
  soul_drain:        { name:'Drenar alma',            type:'drain',  power:32, acc:85,  priority:1.0,  effect:{ healPct:0.18 },                                                                 cooldown:3,  flavor:'{atk} drena el alma de {def} para recuperar vida.' },
  corruption:        { name:'Corrupción',             type:'dot',    power:12, acc:100, priority:1.0,  effect:{ dotType:'bleed',  turns:5 },                                                    cooldown:2,  flavor:'{atk} corrompe la sangre de {def}.',                  statusFlavor:'{def} queda CORROMPIDO y sangrará cada turno.' },
  fel_flame:         { name:'Llama vil',              type:'damage', power:55, acc:65,  priority:1.0,  effect:null,                                                                              flavor:'{atk} lanza una llama de energía demoníaca sobre {def}.' },
  void_rift:         { name:'Grieta del vacío',       type:'damage', power:72, acc:50,  priority:0.8,  effect:{ apply:'enemy', pierce:0.40 },                                                   flavor:'{atk} abre una grieta en el vacío que devora a {def}.' },

  // ─── ARQUERO 🏹 ─────────────────────────────────────────────────────────────
  // Velocidad: el más rápido, sangrado, evasión, disparos de alto daño
  quick_shot:        { name:'Disparo rápido',         type:'damage', power:22, acc:100, priority:1.2,  effect:null,                                                                              flavor:'{atk} dispara una flecha rápida contra {def}.' },
  arrow_rain:        { name:'Lluvia de flechas',      type:'dot',    power:10, acc:100, priority:1.0,  effect:{ dotType:'bleed',  turns:3 },                                                    flavor:'{atk} lanza una lluvia de flechas sobre {def}.',       statusFlavor:'{def} sangra por las múltiples heridas.' },
  trip_wire:         { name:'Trampa',                 type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'evade',   value:{ chance:0.80 } },                       cooldown:2,  flavor:'{atk} coloca una trampa y se prepara para esquivar.' },
  aimed_shot:        { name:'Disparo preciso',        type:'damage', power:38, acc:85,  priority:0.8,  effect:null,                                                                              flavor:'{atk} apunta cuidadosamente y dispara contra {def}.' },
  explosive_arrow:   { name:'Flecha explosiva',       type:'damage', power:46, acc:80,  priority:1.0,  effect:null,                                                                              flavor:'{atk} dispara una flecha explosiva sobre {def}.' },
  hunter_mark:       { name:'Marca del cazador',      type:'damage', power:28, acc:100, priority:1.0,  effect:{ apply:'enemy', pierce:0.60 },                                                   cooldown:2,  flavor:'{atk} marca a {def} ignorando parte de su defensa.' },
  multishot:         { name:'Multidisparo',           type:'dot',    power:18, acc:100, priority:1.1,  effect:{ dotType:'bleed',  turns:4 },                                                    cooldown:2,  flavor:'{atk} dispara múltiples flechas causando sangrado.',  statusFlavor:'{def} sangra por las múltiples flechas.' },
  death_arrow:       { name:'Flecha de la muerte',   type:'damage', power:68, acc:55,  priority:1.0,  effect:null,                                                                              flavor:'{atk} dispara la flecha definitiva contra {def}.' },

  // ─── NIGROMANTE 💀 ──────────────────────────────────────────────────────────
  // Control: stun, veneno, drain vida, buff extremo con penalización
  bone_spear:        { name:'Lanza de hueso',         type:'damage', power:28, acc:100, priority:1.0,  effect:null,                                                                              flavor:'{atk} lanza una lanza de hueso contra {def}.' },
  wither:            { name:'Marchitar',              type:'dot',    power:6,  acc:100, priority:1.0,  effect:{ dotType:'poison', turns:4 },                                                    flavor:'{atk} marchita a {def} con energía necrótica.',        statusFlavor:'{def} queda MARCHITADO y perderá HP cada turno.' },
  soul_harvest:      { name:'Cosecha de almas',       type:'drain',  power:22, acc:100, priority:1.0,  effect:{ healPct:0.14 },                                                                 flavor:'{atk} cosecha el alma de {def} para recuperar vida.' },
  death_coil:        { name:'Espiral de la muerte',   type:'damage', power:16, acc:100, priority:1.1,  effect:{ apply:'enemy', status:'stunned', statusChance:0.35, freezeChance2:0.20 },       flavor:'{atk} lanza una espiral de energía mortal sobre {def}.', statusFlavor:'{def} queda PARALIZADO por la energía necrótica.' },
  plague:            { name:'Plaga',                  type:'dot',    power:14, acc:100, priority:1.0,  effect:{ dotType:'bleed',  turns:5 },                                                    cooldown:2,  flavor:'{atk} infecta a {def} con una plaga mortal.',         statusFlavor:'{def} queda PLAGADO y sufrirá sangrado cada turno.' },
  necrotic_touch:    { name:'Toque necrótico',        type:'drain',  power:30, acc:100, priority:1.0,  effect:{ healPct:0.20 },                                                                 cooldown:3,  flavor:'{atk} toca a {def} con energía necrótica y absorbe su vida.' },
  undead_resilience: { name:'Resiliencia no-muerta',  type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'def_up',  value:{ mult:1.6,  turns:3 } },                cooldown:3,  flavor:'{atk} canaliza la resiliencia de los no-muertos.' },
  lich_form:         { name:'Forma de Lich',          type:'buff',   power:0,  acc:100, priority:0.9,  effect:{ apply:'self', buffKey:'berserk', value:{ atkMult:1.8, defMult:0.6, turns:4 } },cooldown:5,  flavor:'{atk} se transforma en un Lich aumentando enormemente su poder.' },
};

// ══════════════════════════════════════════════════════════════════
//  ORDEN DE ATAQUE
// ══════════════════════════════════════════════════════════════════
function pickOrder(p1, p2, skill1Id, skill2Id) {
  const sk1 = SKILLS[skill1Id], sk2 = SKILLS[skill2Id];
  const pr1 = sk1 ? (sk1.priority || 1.0) : 1.0;
  const pr2 = sk2 ? (sk2.priority || 1.0) : 1.0;
  const s1  = pr1 * p1.spd * (0.92 + Math.random() * 0.16);
  const s2  = pr2 * p2.spd * (0.92 + Math.random() * 0.16);
  return s1 >= s2 ? [p1, p2, skill1Id, skill2Id] : [p2, p1, skill2Id, skill1Id];
}

// ══════════════════════════════════════════════════════════════════
//  FÓRMULA DE DAÑO
// ══════════════════════════════════════════════════════════════════
function calcDmg(atk, def, power, atkMult, defMult, shieldRed, pierce) {
  // Daño base del poder de la habilidad con multiplicador de ataque y azar
  const rand    = 0.88 + Math.random() * 0.24;
  const baseDmg = power * atkMult * rand;
  // defMult multiplica la DEF efectiva del defensor:
  //   def_up (1.55) → defensa más alta → recibe menos daño ✓
  //   berserk (0.75) → defensa reducida → recibe más daño ✓
  //   Si atk == def, los stats se anulan (statDiff = 0)
  const effDef  = def.def * defMult;
  const statDiff = (atk.atk - effDef) * 1.2 * (1 - (pierce || 0));
  return Math.max(1, Math.round((baseDmg + statDiff) * shieldRed));
}

// ══════════════════════════════════════════════════════════════════
//  MOTOR — un ataque individual
// ══════════════════════════════════════════════════════════════════
function doAttack(state, atk, def, skillId) {
  const events = [];

  if (!skillId || skillId === '__skip__') {
    events.push(`${atk.username} no actúa este turno.`);
    return { skipped:true, dmgDealt:0, healed:0, events };
  }

  const skill = SKILLS[skillId];
  if (!skill) {
    events.push(`${atk.username}: habilidad desconocida.`);
    return { skipped:true, dmgDealt:0, healed:0, events };
  }

  function flavor(tmpl) {
    if (!tmpl) return '';
    return tmpl.replace('{atk}', atk.username).replace('{def}', def.username);
  }

  events.push(flavor(skill.flavor));

  // Registrar cooldown si la habilidad lo tiene
  if (skill.cooldown && skill.cooldown > 0) {
    if (!atk.cooldowns) atk.cooldowns = {};
    atk.cooldowns[skillId] = skill.cooldown;
  }

  let missed = skill.acc < 100 && (Math.random() * 100 > skill.acc);

  // ── Determinar si el ataque va dirigido al RIVAL ─────────────
  // Solo los ataques dirigidos al rival pueden ser esquivados.
  // Los buffs aplicados a uno mismo (apply:'self') NO son esquivables:
  //   mana_shield, divine_shield, evasion, war_cry, shield_wall,
  //   berserk, smoke_bomb, resurrection, avenging_wrath → no esquivables.
  // Los buffs dirigidos al rival (apply:'enemy') SÍ pueden esquivarse:
  //   frost_bolt/shield_bash (status:stunned/frozen), execute → esquivables.
  const targetsSelf = skill.type === 'buff' && skill.effect?.apply === 'self';
  const targetsSelf2 = skill.type === 'heal';
  const isDirectedAtRival = !targetsSelf && !targetsSelf2;

  if (!missed && isDirectedAtRival) {
    if (def.buffs.evade) {
      missed = Math.random() < def.buffs.evade.chance;
      if (missed) events.push(`${def.username} ESQUIVA el ataque con su habilidad de evasión.`);
      delete def.buffs.evade;
    } else if (def.buffs.smoke) {
      missed = true;
      events.push(`${def.username} desaparece entre el HUMO — el ataque falla.`);
      delete def.buffs.smoke;
    } else if (def.buffs.immune) {
      missed = true;
      events.push(`${def.username} está protegido por el ESCUDO DIVINO — sin daño.`);
      delete def.buffs.immune;
    } else {
      // Evasión pasiva por velocidad: SPD × 0.5%
      const passiveEvadeChance = (def.spd || 0) * 0.005;
      if (passiveEvadeChance > 0 && Math.random() < passiveEvadeChance) {
        missed = true;
        events.push(`${def.username} esquiva gracias a su velocidad (${Math.round(passiveEvadeChance*100)}%).`);
      }
    }
  }
  if (missed && events.length === 1) events.push(`${atk.username} FALLA el ataque.`);
  if (missed) return { skipped:false, dmgDealt:0, healed:0, missed:true, events };

  const atkMult   = atk.buffs.atk_up  ? atk.buffs.atk_up.mult
                  : atk.buffs.berserk ? atk.buffs.berserk.atkMult : 1;
  const defMult   = def.buffs.def_up  ? def.buffs.def_up.mult
                  : def.buffs.berserk ? def.buffs.berserk.defMult : 1;
  const shieldRed = def.buffs.shield  ? def.buffs.shield.reduction : 1;

  let dmgDealt = 0, healed = 0;

  switch (skill.type) {
    case 'damage': {
      dmgDealt = calcDmg(atk, def, skill.power, atkMult, defMult, shieldRed, skill.effect?.pierce);
      if (skill.effect?.execute && def.hp / def.maxHp < skill.effect.execute.threshold) {
        dmgDealt = Math.round(dmgDealt * skill.effect.execute.bonusMult);
        events.push(`¡EJECUCIÓN LETAL! El golpe de ${atk.username} se multiplica.`);
      }
      def.hp -= dmgDealt;
      events.push(`${atk.username} → ${def.username}: −${dmgDealt} HP.`);
      if (def.buffs.shield && shieldRed < 1) {
        events.push(`El escudo mágico de ${def.username} absorbe parte del golpe.`);
        delete def.buffs.shield;
      }
      if (skill.effect?.apply === 'enemy' && skill.effect.status) {
        // statusChance: probabilidad de que el efecto de estado se aplique
        // Si no se define, el efecto se aplica siempre (100%)
        const statusChance = skill.effect.statusChance ?? 1.0;
        if (Math.random() < statusChance) {
          def.status = skill.effect.status;
          const chance2 = skill.effect.freezeChance2 || 0.20;
          def.statusTurns = Math.random() < chance2 ? 2 : 1;
          const label = def.status === 'stunned' ? 'ATURDIDO' : 'CONGELADO';
          events.push(flavor(skill.statusFlavor || `${def.username} queda ${label}.`));
          if (def.statusTurns === 2) events.push(`¡El efecto es tan fuerte que durará 2 turnos!`);
        } else {
          const label = skill.effect.status === 'stunned' ? 'aturdimiento' : 'congelación';
          events.push(`${def.username} resiste el efecto de ${label}.`);
        }
      }
      if (skill.effect?.backstabMult && Object.keys(def.buffs).length > 0) {
        const bonus = Math.round(dmgDealt * (skill.effect.backstabMult - 1));
        def.hp -= bonus; dmgDealt += bonus;
        events.push(`¡Apuñalada por la espalda! ${def.username} tenía buffs: −${bonus} HP extra.`);
      }
      if (skill.effect?.apply === 'self' && skill.effect.buffKey === 'evade') {
        // shadow_step: evasión 100% garantizada, maxTurns=4 de seguridad
        atk.buffs.evade = { chance: skill.effect.value.chance, maxTurns: 4 };
        events.push(`${atk.username} se funde con las sombras — esquivará el siguiente ataque.`);
      }
      break;
    }
    case 'drain': {
      dmgDealt = calcDmg(atk, def, skill.power, atkMult, defMult, shieldRed, 0);
      def.hp  -= dmgDealt;
      // Si la habilidad tiene healPct, cura % de maxHp; si tiene healAmt, fijo
      healed = skill.effect.healPct
        ? Math.round(atk.maxHp * skill.effect.healPct)
        : skill.effect.healAmt;
      atk.hp   = Math.min(atk.maxHp, atk.hp + healed);
      events.push(`${atk.username} drena ${dmgDealt} HP de ${def.username} y recupera ${healed} HP.`);
      if (def.buffs.shield && shieldRed < 1) delete def.buffs.shield;
      break;
    }
    case 'heal': {
      // Curación por porcentaje de vida máxima
      healed = Math.round(atk.maxHp * (skill.effect.healPct || 0.22));
      atk.hp = Math.min(atk.maxHp, atk.hp + healed);
      events.push(`${atk.username} se cura por +${healed} HP (${Math.round((skill.effect.healPct||0.22)*100)}% HP máx). (${atk.hp}/${atk.maxHp})`);
      break;
    }
    case 'dot': {
      // Daño base de la habilidad al lanzarla
      dmgDealt = calcDmg(atk, def, skill.power, atkMult, defMult, shieldRed, 0);
      def.hp  -= dmgDealt;
      if (def.buffs.shield && shieldRed < 1) delete def.buffs.shield;

      const dtype = skill.effect.dotType;

      if (dtype === 'poison') {
        // VENENO: 2% del HP máximo por turno. Acumula turnos.
        if (def.poison) {
          def.poison.turns += skill.effect.turns;
        } else {
          def.poison = { turns: skill.effect.turns };
        }
        const previewDmg = Math.round(def.maxHp * 0.08);
        events.push(`${atk.username} inflige ${dmgDealt} HP y ENVENENA a ${def.username} (~${previewDmg} HP/turno, 8% HP máx · ${def.poison.turns} turnos restantes).`);
        if (skill.statusFlavor) events.push(flavor(skill.statusFlavor));

      } else if (dtype === 'bleed') {
        // SANGRADO acumulable: empieza en 1% maxHp, +2% por cada aplicación mientras esté activo
        if (def.bleed && def.bleed.turns > 0) {
          def.bleed.turns += skill.effect.turns;
          def.bleed.pct    = Math.min((def.bleed.pct || 0.01) + 0.02, 0.16);
        } else {
          def.bleed = { turns: skill.effect.turns, pct: 0.01 };
        }
        const previewDmg2 = Math.round(def.maxHp * def.bleed.pct);
        events.push(`${atk.username} inflige ${dmgDealt} HP y provoca SANGRADO en ${def.username} (~${previewDmg2} HP/turno, ${Math.round(def.bleed.pct*100)}% HP máx · ${def.bleed.turns} turnos restantes).`);
        if (skill.statusFlavor) events.push(flavor(skill.statusFlavor));

      } else {
        // Consagración y otros dots con dpt fijo
        if (def.poison) {
          def.poison.turns += skill.effect.turns;
          def.poison.dpt    = Math.max(def.poison.dpt, skill.effect.dpt);
        } else {
          def.poison = { dpt: skill.effect.dpt, turns: skill.effect.turns };
        }
        events.push(`${atk.username} inflige ${dmgDealt} HP sobre ${def.username} (${def.poison.dpt} daño/turno · ${def.poison.turns} turnos).`);
        if (skill.statusFlavor) events.push(flavor(skill.statusFlavor));
      }
      break;
    }
    case 'buff': {
      const eff    = skill.effect;
      const target = eff.apply === 'enemy' ? def : atk;
      switch (eff.buffKey) {
        case 'shield':
          // Escudo de un solo golpe. maxTurns=4 de seguridad si nadie ataca.
          target.buffs.shield = { reduction: eff.value.reduction, maxTurns: 4 };
          events.push(`${target.username} activa un ESCUDO MÁGICO que reducirá el próximo golpe en ${Math.round((1-eff.value.reduction)*100)}%.`);
          break;
        case 'atk_up':
          // turns+1 para compensar el tick al final del turno de activación
          target.buffs.atk_up = { mult: eff.value.mult, turns: eff.value.turns + 1 };
          events.push(`${target.username}: ATAQUE ×${eff.value.mult} durante ${eff.value.turns} turnos.`);
          break;
        case 'def_up':
          target.buffs.def_up = { mult: eff.value.mult, turns: eff.value.turns + 1 };
          events.push(`${target.username}: DEFENSA ×${eff.value.mult} durante ${eff.value.turns} turnos.`);
          break;
        case 'evade':
          // Evasión de un solo uso. maxTurns=4 de seguridad.
          target.buffs.evade = { chance: eff.value.chance, maxTurns: 4 };
          events.push(`${target.username}: EVASIÓN ${Math.round(eff.value.chance*100)}% activada.`);
          break;
        case 'immune':
          // Inmunidad de un solo uso guardada como objeto (no boolean) para tickBuffs
          target.buffs.immune = { _active: true, maxTurns: 4 };
          events.push(`${target.username}: ESCUDO DIVINO activo — inmune al siguiente ataque.`);
          break;

        case 'berserk':
          // turns+1 para compensar el tick del turno de activación
          target.buffs.berserk = { atkMult: eff.value.atkMult, defMult: eff.value.defMult, turns: eff.value.turns + 1 };
          events.push(`${target.username}: FRENESÍ — ATK ×${eff.value.atkMult}, DEF ×${eff.value.defMult} por ${eff.value.turns} turnos.`);
          break;
        case 'smoke':
          // Humo de un solo uso. maxTurns=4 de seguridad.
          target.buffs.smoke = { _active: true, maxTurns: 4 };
          events.push(`${target.username} se envuelve en HUMO. El siguiente ataque del rival fallará.`);
          break;
        case 'res_buff':
          // Resurrección: sin límite de tiempo, solo se activa al morir
          target.buffs.res_buff = { pct: eff.value.pct };
          events.push(`${target.username}: RESURRECCIÓN preparada — revivirá con el ${Math.round(eff.value.pct*100)}% HP si cae.`);
          break;
      }
      break;
    }
  }



  return { skipped:false, dmgDealt, healed, missed:false, events };
}

function applyPoison(p, events) {
  // Veneno: 8% del HP máximo por turno, fijo
  if (p.poison && p.poison.turns > 0) {
    const dmg = Math.max(1, Math.round(p.maxHp * 0.08));
    p.hp -= dmg;
    if (--p.poison.turns <= 0) {
      delete p.poison;
      events.push(`☠️ VENENO: ${p.username} sufre ${dmg} HP (8% HP máx). El veneno se disipa.`);
    } else {
      events.push(`☠️ VENENO: ${p.username} sufre ${dmg} HP (8% HP máx). (${p.poison.turns} turnos restantes)`);
    }
  }
  // Sangrado: empieza en 1% maxHp, +2% por cada aplicación acumulada mientras esté activo
  if (p.bleed && p.bleed.turns > 0) {
    const pct = p.bleed.pct || 0.01;
    const dmg = Math.max(1, Math.round(p.maxHp * pct));
    p.hp -= dmg;
    if (--p.bleed.turns <= 0) {
      delete p.bleed;
      events.push(`🥸 SANGRADO: ${p.username} sufre ${dmg} HP (${Math.round(pct*100)}% HP máx). La hemorragia se detiene.`);
    } else {
      events.push(`🥸 SANGRADO: ${p.username} sufre ${dmg} HP (${Math.round(pct*100)}% HP máx). (${p.bleed.turns} turnos restantes)`);
    }
  }
}

function tickBuffs(p, events) {
  events = events || [];
  for (const k of Object.keys(p.buffs)) {
    const b = p.buffs[k];
    if (!b) { delete p.buffs[k]; continue; }
    if (typeof b === 'object') {
      // Buffs temporizados (atk_up, def_up, berserk): duran `turns` turnos
      if (b.turns !== undefined) {
        if (--b.turns <= 0) {
          delete p.buffs[k];
          const labels = {atk_up:'Aumento de ataque', def_up:'Aumento de defensa', berserk:'Frenesí'};
          if (labels[k]) events.push(`${p.username}: ${labels[k]} ha expirado.`);
        }
      }
      // Buffs de un solo uso con caducidad de seguridad (maxTurns)
      // shield, evade, counter: se eliminan al activarse, pero si el rival
      // no ataca nunca, caducan por seguridad tras maxTurns turnos
      else if (b.maxTurns !== undefined) {
        if (--b.maxTurns <= 0) {
          delete p.buffs[k];
          const labels = {shield:'Escudo mágico', evade:'Evasión'};
          if (labels[k]) events.push(`${p.username}: ${labels[k]} ha expirado sin activarse.`);
        }
      }
    } else if (typeof b === 'boolean') {
      // immune (divine_shield) y smoke: se activan al recibir un ataque.
      // Por seguridad, los guardamos con contador oculto.
      // En este caso los manejamos como maxTurns implícito.
      // Se convierten en objeto con maxTurns en el primer tick.
      p.buffs[k] = { _bool: true, maxTurns: 2 };
    }
  }
}

function tickCooldowns(p) {
  if (!p.cooldowns) return;
  for (const k of Object.keys(p.cooldowns)) {
    if (p.cooldowns[k] > 0) p.cooldowns[k]--;
    if (p.cooldowns[k] <= 0) delete p.cooldowns[k];
  }
}

function tickStatus(p) {
  if (!p.status) return;
  p.statusTurns = (p.statusTurns || 1) - 1;
  if (p.statusTurns <= 0) { p.status = null; p.statusTurns = 0; }
}

function checkRes(p, events) {
  if (p.hp <= 0 && p.buffs.res_buff) {
    p.hp = Math.max(1, Math.round(p.maxHp * p.buffs.res_buff.pct));
    delete p.buffs.res_buff;
    events.push(`✨ ¡RESURRECCIÓN! ${p.username} vuelve a la vida con ${p.hp} HP.`);
  }
}

function getWinner(state) {
  const d1 = state.p1.hp <= 0, d2 = state.p2.hp <= 0;
  if (d1 && d2) return 'empate';
  if (d1) return state.p2.username;
  if (d2) return state.p1.username;
  return null;
}

// ══════════════════════════════════════════════════════════════════
//  RESOLUCIÓN SIMULTÁNEA DEL TURNO
//
//  FIX CLAVE: si el primer ataque deja al segundo stunned/frozen,
//  su acción se cancela forzando sa = '__skip__'
// ══════════════════════════════════════════════════════════════════
function resolveTurn(matchId, db, io, startTimer) {
  const match = (db.matches || {})[matchId];
  if (!match || match.status !== 'active') return;
  if (match.state.phase === 'resolving') return;
  match.state.phase = 'resolving';

  const state   = match.state;
  const p1      = state.p1, p2 = state.p2;
  const pending = state.pendingActions || {};
  const allEvents = [];
  const results   = [];

  // ── 1. Acciones + stun preexistente ────────────────────────
  // tickStatus se llama UNA SOLA VEZ por turno, aquí al inicio.
  // NUNCA se vuelve a llamar más abajo en este mismo turno.
  let a1 = pending[match.player1] ?? null;
  let a2 = pending[match.player2] ?? null;

  if (p1.status === 'stunned' || p1.status === 'frozen') {
    const label = p1.status === 'stunned' ? 'ATURDIDO' : 'CONGELADO';
    allEvents.push(`${p1.username} está ${label} y pierde su turno.`);
    a1 = '__skip__';
    tickStatus(p1); // decrementa statusTurns; si llega a 0, borra status
    if (p1.status) allEvents.push(`${p1.username} seguirá ${p1.status === 'stunned' ? 'aturdido' : 'congelado'} el próximo turno.`);
  }
  if (p2.status === 'stunned' || p2.status === 'frozen') {
    const label = p2.status === 'stunned' ? 'ATURDIDO' : 'CONGELADO';
    allEvents.push(`${p2.username} está ${label} y pierde su turno.`);
    a2 = '__skip__';
    tickStatus(p2);
    if (p2.status) allEvents.push(`${p2.username} seguirá ${p2.status === 'stunned' ? 'aturdido' : 'congelado'} el próximo turno.`);
  }

  if (a1 === null) { a1 = '__skip__'; allEvents.push(`${p1.username} no eligió a tiempo — turno perdido.`); }
  if (a2 === null) { a2 = '__skip__'; allEvents.push(`${p2.username} no eligió a tiempo — turno perdido.`); }

  // ── 2. Orden de ataque ──────────────────────────────────────
  const [first, second, fa, sa_orig] = pickOrder(p1, p2, a1, a2);

  // ── 3. Primer ataque ────────────────────────────────────────
  const r1 = doAttack(state, first, second, fa);
  allEvents.push(...r1.events);
  results.push({
    player: first.username, skill: fa,
    dmgDealt: r1.dmgDealt, healed: r1.healed,
    skipped: r1.skipped,   missed: r1.missed || false,
    p1hp: p1.hp, p2hp: p2.hp,
    events: r1.events,
  });
  checkRes(p1, allEvents); checkRes(p2, allEvents);
  let winner = getWinner(state);

  // ── 4. Segundo ataque ────────────────────────────────────────
  // Si el primer ataque stuna/congela al segundo, cancela su acción.
  // NO se llama tickStatus aquí — el stun recién puesto dura hasta
  // el inicio del SIGUIENTE turno donde tickStatus lo decrementará.
  let sa = sa_orig;
  if (!winner) {
    if (second.status === 'stunned' || second.status === 'frozen') {
      const label = second.status === 'stunned' ? 'ATURDIDO' : 'CONGELADO';
      allEvents.push(`¡${second.username} queda ${label} y no puede contraatacar este turno!`);
      sa = '__skip__';
      // NO tickStatus aquí
    }

    let r2;
    // ── Caso especial: CONTRAATAQUE ────────────────────────────
    // El segundo jugador eligió 'counter'. Es la habilidad más lenta
    // del juego (priority 0.1), así que siempre actúa segundo.
    // Devuelve el DOBLE del daño que le hizo el primero.
    // Si el primero no hizo daño (skip, buff, heal, fallo), se pierde.
    if (sa === 'counter') {
      const cdEvents = [];
      cdEvents.push(`${second.username} adopta postura de contraataque.`);
      // Registrar cooldown de counter
      if (!second.cooldowns) second.cooldowns = {};
      second.cooldowns['counter'] = SKILLS.counter.cooldown;

      if (r1.dmgDealt > 0) {
        // El contraataque es INESQUIVABLE
        const counterDmg = Math.round(r1.dmgDealt * 2);
        first.hp -= counterDmg;
        cdEvents.push(`¡CONTRAATAQUE! ${second.username} devuelve ${counterDmg} HP a ${first.username} (×2 del daño recibido).`);
        r2 = { skipped:false, dmgDealt:counterDmg, healed:0, missed:false, events:cdEvents };
      } else {
        cdEvents.push(`${first.username} no atacó — el contraataque de ${second.username} se pierde.`);
        r2 = { skipped:true, dmgDealt:0, healed:0, missed:false, events:cdEvents };
      }
    } else {
      r2 = doAttack(state, second, first, sa);
    }

    allEvents.push(...r2.events);
    results.push({
      player: second.username, skill: sa,
      dmgDealt: r2.dmgDealt, healed: r2.healed,
      skipped: r2.skipped,   missed: r2.missed || false,
      p1hp: p1.hp, p2hp: p2.hp,
      events: r2.events,
    });
    checkRes(p1, allEvents); checkRes(p2, allEvents);
    winner = getWinner(state);
  }

  // ── 5. Final de turno: veneno + tick de buffs ───────────────
  applyPoison(p1, allEvents); applyPoison(p2, allEvents);
  tickBuffs(p1, allEvents); tickBuffs(p2, allEvents);
  tickCooldowns(p1); tickCooldowns(p2);
  checkRes(p1, allEvents); checkRes(p2, allEvents);
  if (!winner) winner = getWinner(state);

  const turnMsg = `[T${state.turn}] ${allEvents.join(' | ')}`;
  state.log.unshift(turnMsg);
  state.turn++;
  state.phase          = 'choosing';
  state.timerStart     = Date.now();
  state.pendingActions = {};

  if (winner) {
    match.status = 'finished';
    match.winner = winner;
    if (winner === 'empate') {
      state.log.unshift('¡Empate!');
      allEvents.push('¡El combate termina en EMPATE!');
    } else {
      state.log.unshift(`🏆 ¡${winner} gana el combate!`);
      allEvents.push(`🏆 ¡${winner} gana el combate!`);
      const loser = winner === match.player1 ? match.player2 : match.player1;
      if (db.players?.[winner]) db.players[winner].wins   = (db.players[winner].wins   || 0) + 1;
      if (db.players?.[loser])  db.players[loser].losses  = (db.players[loser].losses  || 0) + 1;
    }
  }

  db.matches[matchId] = match;
  writeDB(db);

  io.emit('match-update', {
    type: 'turn-resolved',
    matchId, results, match, winner, turnMsg, allEvents,
  });

  // Arrancar el timer del siguiente turno si el combate sigue activo
  if (!winner && startTimer) startTimer(matchId);
}

// ══════════════════════════════════════════════════════════════════
//  MÓDULO — rutas + timers
// ══════════════════════════════════════════════════════════════════
module.exports = function(io, userSockets) {
  const matchTimers = {};

  function clearTimer(id) {
    if (matchTimers[id]) { clearTimeout(matchTimers[id]); delete matchTimers[id]; }
  }
  function startTimer(id) {
    clearTimer(id);
    matchTimers[id] = setTimeout(() => {
      try {
        const db = readDB();
        if ((db.matches?.[id])?.status === 'active' && db.matches[id].state.phase === 'choosing') {
          resolveTurn(id, db, io, startTimer);
        }
      } catch(e) { console.error('Timer error:', e); }
    }, TURN_MS);
  }

  // ── GET /matches ──────────────────────────────────────────
  router.get('/matches', authMiddleware, (req, res) => {
    const db = readDB();
    if (req.user.role === 'teacher') return res.json(Object.values(db.matches || {}));
    res.json(Object.values(db.matches || {}).filter(m =>
      m.player1 === req.user.username || m.player2 === req.user.username
    ));
  });

  // ── GET /match/:id ────────────────────────────────────────
  router.get('/match/:id', authMiddleware, (req, res) => {
    const db = readDB();
    const raw = (db.matches || {})[req.params.id];
    if (!raw) return res.status(404).json({ error: 'No encontrado' });
    const m = JSON.parse(JSON.stringify(raw));
    if (req.user.role !== 'teacher') {
      const me    = req.user.username;
      const rival = m.player1 === me ? m.player2 : m.player1;
      const pa    = m.state.pendingActions || {};
      m.state.myAction       = pa[me]    ?? null;
      m.state.rivalSubmitted = pa[rival] != null;
      delete m.state.pendingActions;
    }
    res.json(m);
  });

  // ── POST /create-match ────────────────────────────────────
  router.post('/create-match', teacherOnly, (req, res) => {
    const { player1, player2 } = req.body;
    if (!player1 || !player2)  return res.status(400).json({ error: 'Faltan jugadores' });
    if (player1 === player2)   return res.status(400).json({ error: 'Mismo jugador' });
    const db = readDB();
    if (!db.players?.[player1]) return res.status(404).json({ error: `${player1} no existe` });
    if (!db.players?.[player2]) return res.status(404).json({ error: `${player2} no existe` });

    const p1d = db.players[player1], p2d = db.players[player2];

    const makePS = (p, u) => {
      // Usar loadout si tiene entre 1 y 4 habilidades válidas
      // Si no, usar todas las habilidades desbloqueadas (hasta 4)
      const maxSlots = Math.min((p.skills || []).length, 4);
      const loadout = (p.loadout && p.loadout.length >= 1 && p.loadout.length <= 4)
        ? p.loadout
        : (p.skills || []).slice(0, maxSlots);
      return {
        username: u, cls: p.cls,
        hp: p.hp + p.def * 3, maxHp: p.hp + p.def * 3,
        atk: p.atk, def: p.def, spd: p.spd,
        skills: loadout,
        buffs: {}, poison: null, bleed: null, status: null, statusTurns: 0, cooldowns: {},
      };
    };

    const mid = 'match_' + Date.now();
    const match = {
      id: mid, player1, player2, status: 'active', winner: null,
      createdAt: new Date().toISOString(),
      state: {
        turn: 1, phase: 'choosing', timerStart: Date.now(),
        pendingActions: {},
        p1: makePS(p1d, player1),
        p2: makePS(p2d, player2),
        log: ['¡Combate iniciado! Elegid vuestra habilidad (30 s).'],
      },
    };

    if (!db.matches) db.matches = {};
    db.matches[mid] = match;
    writeDB(db);
    startTimer(mid);

    const s1 = userSockets[player1], s2 = userSockets[player2];
    if (s1) io.to(s1).emit('battle-invite', { matchId: mid, opponent: player2 });
    if (s2) io.to(s2).emit('battle-invite', { matchId: mid, opponent: player1 });
    io.emit('match-created', { matchId: mid, player1, player2 });
    res.status(201).json({ message: 'Combate creado', match });
  });

  // ── POST /action ──────────────────────────────────────────
  router.post('/action', authMiddleware, (req, res) => {
    const { matchId, skillId } = req.body;
    const username = req.user.username;
    if (!matchId || !skillId) return res.status(400).json({ error: 'Faltan datos' });

    const db    = readDB();
    const match = (db.matches || {})[matchId];
    if (!match)                    return res.status(404).json({ error: 'No encontrado' });
    if (match.status !== 'active') return res.status(400).json({ error: 'Combate terminado' });
    if (username !== match.player1 && username !== match.player2)
      return res.status(403).json({ error: 'No participas' });

    const pa = match.state.pendingActions || {};
    if (pa[username] != null) return res.status(400).json({ error: 'Ya enviaste tu acción' });

    const ps = match.state.p1.username === username ? match.state.p1 : match.state.p2;
    if (skillId !== '__skip__' && !ps.skills.includes(skillId))
      return res.status(403).json({ error: 'No tienes esa habilidad en tu loadout' });
    // Validar cooldown
    if (skillId !== '__skip__' && ps.cooldowns && ps.cooldowns[skillId] > 0)
      return res.status(400).json({ error: `${skillId} está en cooldown (${ps.cooldowns[skillId]} turnos restantes)` });

    pa[username] = skillId;
    match.state.pendingActions = pa;
    db.matches[matchId] = match;
    writeDB(db);

    const rival = username === match.player1 ? match.player2 : match.player1;
    const rSock = userSockets[rival];
    if (rSock) io.to(rSock).emit('match-update', { type:'action-submitted', matchId, player: username });

    // Ambos jugadores deben enviar acción.
    // El jugador stunado/congelado envía '__skip__' desde el panel de stun.
    const bothDone = pa[match.player1] != null && pa[match.player2] != null;
    if (bothDone) { clearTimer(matchId); resolveTurn(matchId, db, io, startTimer); }

    res.json({ message: 'Acción registrada', waiting: !bothDone });
  });

  // ── DELETE /matches — Eliminar TODOS los combates ──────────
  router.delete('/matches', teacherOnly, (req, res) => {
    const db = readDB();
    const matches = db.matches || {};
    // Cancelar todos los timers activos y notificar a jugadores
    Object.keys(matches).forEach(id => {
      clearTimer(id);
      if (matches[id].status === 'active') {
        io.emit('match-update', {
          type: 'turn-resolved', matchId: id,
          match: { ...matches[id], status:'finished', winner:'deleted' },
          winner: 'deleted', results: [],
          allEvents: ['⚠ El docente ha eliminado todos los combates.'],
          turnMsg: 'Combates eliminados por el docente.',
        });
      }
    });
    db.matches = {};
    writeDB(db);
    res.json({ message: 'Todos los combates eliminados' });
  });

  // ── DELETE /match/:id ─────────────────────────────────────
  // FIX: emite match-update para que los jugadores vean el fin
  router.delete('/match/:id', teacherOnly, (req, res) => {
    const db = readDB();
    const match = (db.matches || {})[req.params.id];
    if (!match) return res.status(404).json({ error: 'No encontrado' });

    clearTimer(req.params.id);

    // Si el combate estaba activo, notificar a los jugadores
    if (match.status === 'active') {
      match.status = 'finished';
      match.winner = 'deleted';
      match.state.log.unshift('[Docente] El combate fue eliminado por el docente.');
      io.emit('match-update', {
        type: 'turn-resolved',
        matchId: req.params.id,
        match,
        winner: 'deleted',
        results: [],
        allEvents: ['⚠ El docente ha eliminado este combate.'],
        turnMsg: 'Combate eliminado por el docente.',
      });
    }

    delete db.matches[req.params.id];
    writeDB(db);
    res.json({ message: 'Eliminado' });
  });

  return router;
};