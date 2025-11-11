// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('User connecté:', socket.id);
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
    socket.on('disconnect', () => {
        console.log('User déconnecté');
    });
});

server.listen(3000, () => console.log('Chat server sur :3000'));