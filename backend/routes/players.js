const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');
const SECRET  = 'clavesecretaRPG_2026';

function readDB()      { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8'); }

const BASE_SKILLS = {
  mage:       ['fireball','frost_bolt','arcane_blast','mana_shield'],
  warrior:    ['brutal_strike','shield_bash','war_cry','shield_wall'],
  rogue:      ['stab','poison','evasion','backstab'],
  paladin:    ['holy_strike','heal','divine_shield','consecration'],
  druid:      ['thorn_whip','entangle','regeneration','barkskin'],
  warlock:    ['shadow_bolt','life_tap','curse','dark_pact'],
  archer:     ['quick_shot','arrow_rain','trip_wire','aimed_shot'],
  necromancer:['bone_spear','wither','soul_harvest','death_coil'],
};

const BASE_STATS = {
  mage:       { atk:8, def:3, spd:5, hp:80  },
  warrior:    { atk:5, def:8, spd:4, hp:120 },
  rogue:      { atk:6, def:4, spd:9, hp:90  },
  paladin:    { atk:6, def:6, spd:5, hp:100 },
  druid:      { atk:6, def:5, spd:7, hp:90  },
  warlock:    { atk:9, def:3, spd:6, hp:75  },
  archer:     { atk:7, def:4, spd:9, hp:85  },
  necromancer:{ atk:8, def:4, spd:5, hp:90  },
};

const UNLOCK_COSTS = {
  lightning:2, drain_life:3, meteor:4, blizzard:5,
  whirlwind:2, counter:3, berserk:4, execute:5,
  critical:2, smoke_bomb:3, hemorrhage:4, shadow_step:5,
  judgment:2, holy_nova:3, avenging_wrath:4, resurrection:5,
  // Druida
  nature_wrath:2, spore_cloud:3, wild_growth:4, shapeshifter:5,
  // Brujo
  soul_drain:2, corruption:3, fel_flame:4, void_rift:5,
  // Arquero
  explosive_arrow:2, hunter_mark:3, multishot:4, death_arrow:5,
  // Nigromante
  plague:2, necrotic_touch:3, undead_resilience:4, lich_form:5,
};

const CLASS_SKILLS = {
  mage:       ['fireball','frost_bolt','arcane_blast','mana_shield','lightning','drain_life','meteor','blizzard'],
  warrior:    ['brutal_strike','shield_bash','war_cry','shield_wall','whirlwind','counter','berserk','execute'],
  rogue:      ['stab','poison','evasion','backstab','critical','smoke_bomb','hemorrhage','shadow_step'],
  paladin:    ['holy_strike','heal','divine_shield','consecration','judgment','holy_nova','avenging_wrath','resurrection'],
  druid:      ['thorn_whip','entangle','regeneration','barkskin','nature_wrath','spore_cloud','wild_growth','shapeshifter'],
  warlock:    ['shadow_bolt','life_tap','curse','dark_pact','soul_drain','corruption','fel_flame','void_rift'],
  archer:     ['quick_shot','arrow_rain','trip_wire','aimed_shot','explosive_arrow','hunter_mark','multishot','death_arrow'],
  necromancer:['bone_spear','wither','soul_harvest','death_coil','plague','necrotic_touch','undead_resilience','lich_form'],
};

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

// GET /api/players
router.get('/', authMiddleware, (req, res) => {
  const db = readDB();
  const safe = Object.fromEntries(
    Object.entries(db.players).map(([name, p]) => {
      const { password, ...rest } = p;
      return [name, rest];
    })
  );
  res.json(safe);
});

// POST /api/players/create
router.post('/create', teacherOnly, async (req, res) => {
  const { username, password, cls } = req.body;
  if (!username || !password || !cls) return res.status(400).json({ error: 'Faltan campos' });
  const db = readDB();
  if (db.players[username]) return res.status(409).json({ error: 'Ya existe' });

  const base = BASE_STATS[cls];
  if (!base) return res.status(400).json({ error: 'Clase no válida' });

  const hashed = await bcrypt.hash(password, 10);
  const baseSkills = [...BASE_SKILLS[cls]];
  db.players[username] = {
    username, password: hashed, cls,
    atk: base.atk, def: base.def, spd: base.spd, hp: base.hp,
    pts_available: 0, pts_spent: 0, pts_total: 0,
    wins: 0, losses: 0,
    skills: baseSkills,
    loadout: [...baseSkills],
  };
  writeDB(db);
  const { password: _, ...safePlayer } = db.players[username];
  res.status(201).json({ message: 'Alumno creado', player: safePlayer });
});

// POST /api/players/grant-points
router.post('/grant-points', teacherOnly, (req, res) => {
  const { username, points } = req.body;
  const pts = Number(points);
  if (!username || isNaN(pts) || pts === 0) return res.status(400).json({ error: 'Datos incorrectos' });
  const db = readDB();
  if (!db.players[username]) return res.status(404).json({ error: 'No encontrado' });
  db.players[username].pts_available += pts;
  db.players[username].pts_total     += pts;
  writeDB(db);
  res.json({ message: `${pts} pts → ${username}`, pts_available: db.players[username].pts_available });
});

// POST /api/players/upgrade
router.post('/upgrade', authMiddleware, (req, res) => {
  const { upgrades } = req.body;
  if (!upgrades || req.user.role !== 'student') return res.status(403).json({ error: 'No permitido' });
  const db = readDB();
  const player = db.players[req.user.username];
  if (!player) return res.status(404).json({ error: 'No encontrado' });
  const maxStats = { atk:25, def:25, spd:25, hp:400 };
  const totalCost = Object.entries(upgrades).reduce((s,[,v]) => s + (v||0), 0);
  if (totalCost === 0) return res.status(400).json({ error: 'Sin mejoras' });
  if (totalCost > player.pts_available) return res.status(400).json({ error: 'Puntos insuficientes' });
  for (const [stat, amount] of Object.entries(upgrades)) {
    if (amount > 0 && player[stat] !== undefined) {
      // HP: cada punto gastado suma 5 de vida (máx 400)
      const gain = stat === 'hp' ? amount * 5 : amount;
      player[stat] = Math.min(player[stat] + gain, maxStats[stat] || 25);
    }
  }
  player.pts_available -= totalCost;
  player.pts_spent     += totalCost;
  writeDB(db);
  const { password, ...safe } = player;
  res.json({ message: 'OK', player: safe });
});

// POST /api/players/buy-skill
router.post('/buy-skill', authMiddleware, (req, res) => {
  const { skillId } = req.body;
  if (!skillId || req.user.role !== 'student') return res.status(403).json({ error: 'No permitido' });
  const db = readDB();
  const player = db.players[req.user.username];
  if (!player) return res.status(404).json({ error: 'No encontrado' });
  const cost = UNLOCK_COSTS[skillId];
  if (cost === undefined) return res.status(400).json({ error: 'Habilidad no válida' });
  if (!CLASS_SKILLS[player.cls]?.includes(skillId)) return res.status(403).json({ error: 'No es de tu clase' });
  if (player.skills.includes(skillId)) return res.status(409).json({ error: 'Ya la tienes' });
  if (player.pts_available < cost) return res.status(400).json({ error: 'Puntos insuficientes' });
  player.skills.push(skillId);
  player.pts_available -= cost;
  player.pts_spent     += cost;
  writeDB(db);
  const { password, ...safe } = player;
  res.json({ message: 'Desbloqueada', player: safe });
});

// POST /api/players/set-loadout
router.post('/set-loadout', authMiddleware, (req, res) => {
  const { loadout } = req.body;
  if (!loadout || !Array.isArray(loadout)) return res.status(400).json({ error: 'Falta loadout' });
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Solo alumnos' });
  const db = readDB();
  const player = db.players[req.user.username];
  if (!player) return res.status(404).json({ error: 'No encontrado' });

  const minRequired = Math.min(player.skills.length, 2);
  if (loadout.length < minRequired)
    return res.status(400).json({ error: `El loadout debe tener al menos ${minRequired} habilidades` });
  if (loadout.length > 4)
    return res.status(400).json({ error: 'El loadout no puede tener más de 4 habilidades' });
  if (new Set(loadout).size !== loadout.length)
    return res.status(400).json({ error: 'No puede haber habilidades repetidas' });
  for (const sid of loadout) {
    if (!player.skills.includes(sid))
      return res.status(403).json({ error: `No tienes la habilidad: ${sid}` });
  }

  player.loadout = loadout;
  writeDB(db);
  const { password, ...safe } = player;
  res.json({ message: 'Loadout guardado', player: safe });
});

// POST /api/players/reset-points
// Resetea stats a los valores base, elimina habilidades desbloqueadas
// y devuelve todos los puntos gastados al pool disponible.
router.post('/reset-points', authMiddleware, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Solo alumnos' });
  const db = readDB();
  const player = db.players[req.user.username];
  if (!player) return res.status(404).json({ error: 'No encontrado' });

  const base = BASE_STATS[player.cls];
  if (!base) return res.status(400).json({ error: 'Clase no válida' });

  // Devolver TODOS los puntos gastados (stats + habilidades)
  player.pts_available = player.pts_total;
  player.pts_spent     = 0;

  // Resetear stats al valor base de la clase
  player.atk = base.atk;
  player.def = base.def;
  player.spd = base.spd;
  player.hp  = base.hp;

  // Resetear habilidades a las 4 habilidades base
  const baseSkills   = [...BASE_SKILLS[player.cls]];
  player.skills      = baseSkills;
  player.loadout     = [...baseSkills];

  writeDB(db);
  const { password, ...safe } = player;
  res.json({ message: 'Personaje reseteado correctamente', player: safe });
});

// DELETE /api/players/:username
router.delete('/:username', teacherOnly, (req, res) => {
  const db = readDB();
  if (!db.players[req.params.username]) return res.status(404).json({ error: 'No encontrado' });
  delete db.players[req.params.username];
  writeDB(db);
  res.json({ message: 'Eliminado' });
});

module.exports = router;