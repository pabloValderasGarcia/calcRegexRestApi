var WebSocketServer = require("ws").Server;

var wss = new WebSocketServer({ port: 4444 });
var clients = [];

wss.on('connection', function connection(ws, request, client) {
    clients.push({
        token: request.token,
        socket: ws
    });
    ws.send(JSON.stringify(connected));
    clientMaster.send(JSON.stringify(newClient));

    ws.on('message', wss.broadcast);

    ws.on('close', ws => {
        ''
    })
});