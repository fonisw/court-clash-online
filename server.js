const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const rooms = new Map();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'COURT CLASH', rooms: rooms.size }));
function cleanCode(code) { return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3); }
io.on('connection', socket => {
  socket.on('create-room', (data = {}, cb = () => {}) => {
    let code = cleanCode(data.code);
    if (code.length !== 3) return cb({ ok: false, message: '방 코드는 3글자여야 합니다.' });
    if (rooms.has(code)) return cb({ ok: false, message: '이미 사용 중인 방 코드입니다. 다시 만들어 주세요.' });
    const room = { code, password: String(data.password || ''), mode: data.mode === '2v2' ? '2v2' : '1v1', players: new Map(), started: false };
    rooms.set(code, room); joinRoom(socket, room); cb({ ok: true, code, players: room.players.size });
  });
  socket.on('join-room', (data = {}, cb = () => {}) => {
    const code = cleanCode(data.code), room = rooms.get(code);
    if (!room) return cb({ ok: false, message: '방을 찾을 수 없습니다.' });
    if (room.password !== String(data.password || '')) return cb({ ok: false, message: '비밀번호가 맞지 않습니다.' });
    const max = room.mode === '2v2' ? 4 : 2;
    if (room.players.size >= max) return cb({ ok: false, message: '방이 가득 찼습니다.' });
    joinRoom(socket, room); cb({ ok: true, code, mode: room.mode, players: room.players.size });
    io.to(code).emit('room-update', { code, mode: room.mode, players: room.players.size, started: room.started });
  });
  socket.on('start-match', () => { const code = socket.data.roomCode; const room = rooms.get(code); if (!room) return; room.started = true; io.to(code).emit('match-start', { players: room.players.size }); });
  socket.on('player-state', state => {
    const code = socket.data.roomCode; const room = rooms.get(code); if (!room || !room.players.has(socket.id) || !state || typeof state !== 'object') return;
    const safe = { x: clampNum(state.x, -4.5, 4.5), z: clampNum(state.z, 0.5, 10), jump: clampNum(state.jump, 0, 1.5), hasBall: !!state.hasBall, score: clampNum(state.score, 0, 999), rivalScore: clampNum(state.rivalScore, 0, 999), ball: safeBall(state.ball), playing: !!state.playing, sentAt: Date.now() };
    room.players.set(socket.id, safe);
    socket.to(code).emit('peer-state', { id: socket.id, state: safe });
  });
  socket.on('disconnect', () => {
    const code = socket.data.roomCode; if (!code) return;
    const room = rooms.get(code); if (!room) return;
    room.players.delete(socket.id); socket.to(code).emit('peer-left');
    if (!room.players.size) rooms.delete(code); else io.to(code).emit('room-update', { code, mode: room.mode, players: room.players.size, started: room.started });
  });
});
function joinRoom(socket, room) { socket.join(room.code); socket.data.roomCode = room.code; room.players.set(socket.id, null); }
function clampNum(v, min, max) { v = Number(v); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : 0; }
function safeBall(b) { if (!b || typeof b !== 'object') return null; return { x: clampNum(b.x, -5, 5), z: clampNum(b.z, 0, 11), y: clampNum(b.y, 0, 3), flight: clampNum(b.flight, 0, 3), loose: !!b.loose, kind: String(b.kind || '').slice(0, 20) }; }
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log(`COURT CLASH listening on ${port}`));
