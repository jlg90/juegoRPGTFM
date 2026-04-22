const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');
const SECRET  = 'clavesecretaRPG_2026';

function readDB() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  const db = readDB();

  if (username === 'docente') {
    const match = await bcrypt.compare(password, db.config.teacherPassword);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ username: 'docente', role: 'teacher' }, SECRET, { expiresIn: '8h' });
    return res.json({ token, role: 'teacher', username: 'docente' });
  }

  const player = db.players[username];
  if (!player) return res.status(404).json({ error: 'Usuario no encontrado' });

  const match = await bcrypt.compare(password, player.password);
  if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign({ username, role: 'student' }, SECRET, { expiresIn: '8h' });
  const { password: _, ...safePlayer } = player;
  res.json({ token, role: 'student', username, player: safePlayer });
});

module.exports = router;