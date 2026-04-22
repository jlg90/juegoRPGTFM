const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors   = require('cors');
const path   = require('path');
const jwt    = require('jsonwebtoken');
const fs     = require('fs');

const SECRET  = 'clavesecretaRPG_2026';
const DB_PATH = path.join(__dirname, 'data/db.json');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Mapa username → socket.id para saber quién está online
const userSockets = {};

function readDB()      { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8'); }

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const authRoutes   = require('./routes/auth');
const playerRoutes = require('./routes/players');
const battleRoutes = require('./routes/battle');

app.use('/api/auth',    authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/battle',  battleRoutes(io, userSockets));

io.on('connection', (socket) => {

  // El cliente envía su JWT para identificarse
  // El frontend lo emite en el evento 'connect' del socket
  socket.on('auth', (token) => {
    try {
      const decoded = jwt.verify(token, SECRET);
      userSockets[decoded.username] = socket.id;
      socket.username = decoded.username;
      socket.role     = decoded.role;
    } catch (e) {}
  });

  socket.on('disconnect', () => {
    if (!socket.username) return;
    delete userSockets[socket.username];

    if (socket.role === 'teacher') return;

    try {
      const db    = readDB();
      const match = Object.values(db.matches || {}).find(m =>
        m.status === 'active' &&
        (m.player1 === socket.username || m.player2 === socket.username)
      );
      if (!match) return;

      const winner = match.player1 === socket.username ? match.player2 : match.player1;
      match.status = 'finished';
      match.winner = winner;
      match.state.log.unshift(`[Abandono] ${socket.username} se desconectó. ${winner} gana.`);

      if (db.players[winner])          db.players[winner].wins    = (db.players[winner].wins    || 0) + 1;
      if (db.players[socket.username]) db.players[socket.username].losses = (db.players[socket.username].losses || 0) + 1;

      writeDB(db);
      io.emit('match-update', { matchId: match.id, match, winner, reason: 'disconnect' });
    } catch (e) {}
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`ArcaneClass en http://localhost:${PORT}`);
});