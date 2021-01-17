const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, getRoomUsers, userLeaves } = require('./utils/users');


// set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'chatBot'
// Run on client connection
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      
      socket.join(user.room);

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to chat app!'));

      // Broadcast when a user connects
      socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

      // Send users and room info 
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });


    // Listen to chatMessage from client
    socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () =>{
      const user = userLeaves(socket.id);
      if (user) {
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} left the chat`));
        
        // Send users and room info 
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
});

const PORT = 3000 || process.env.PORT;


server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));