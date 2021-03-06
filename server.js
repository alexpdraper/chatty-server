// server.js
const uuid = require('node-uuid');
const randomColor = require('randomcolor');
const express = require('express');
const SocketServer = require('ws').Server;

// Set the port to 4000
const PORT = 4000;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

wss.broadcast = function (data) {
  wss.clients.forEach((client) => {
    client.send(data);
  });
};

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  // Change to clients.count
  wss.broadcast(JSON.stringify({type: 'usercount', numUsers: wss.clients.length}));

  ws.send(JSON.stringify({type: 'setColor', color: randomColor()}));

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    parsedMessage.id = uuid.v1();
    switch(parsedMessage.type) {
      case 'message':
        if (/^colou?rize/i.test(parsedMessage.content)) {
          ws.send(JSON.stringify({type: 'setColor', color: randomColor()}));
        } else {
          console.log(`User ${parsedMessage.username} said ${parsedMessage.content}`);
          wss.broadcast(JSON.stringify(parsedMessage));
        }
        break;
      case 'notification':
        console.log(`Notification: ${parsedMessage.content}`);
        wss.broadcast(JSON.stringify(parsedMessage));
        break;
      default:
        console.log('Received message:', parsedMessage);
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    wss.broadcast(JSON.stringify({type: 'usercount', numUsers: wss.clients.length}));
  });
});