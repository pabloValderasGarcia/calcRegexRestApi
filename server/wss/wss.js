const WebSocket = require('ws'); // WS
const url = require('url'); // URL
const jwt = require('jsonwebtoken'); // JWT
const parser = require('../jison/grammar'); // JISON Parser

function initWSS(expressServer) {
    const wss = new WebSocket.Server({ server: expressServer, path: '/ws' })
    var wsClients = []; // Saving clients when they open ws

    wss.on('connection', (ws, req) => {
        var token = url.parse(req.url, true).query.token;
        let remaining = 5, /* Remaining tries to client sending regexs */ result = null;

        jwt.verify(token, process.env.PRIVATE_KEY, (err, decoded) => {
            if (err) ws.close();
            else wsClients[token] = ws;
        });

        ws.on('message', (data, isBinary) => {
            const message = isBinary ? data : data.toString();
            jwt.verify(token, process.env.PRIVATE_KEY, (err) => {
                if (err) {
                    ws.send('Error: Your token is no longer valid...');
                    ws.close();
                } else {
                    if (remaining <= 0) {
                        ws.send('Remaining ' + 0);
                        ws.close();
                    } else {
                        result = parser.parse(message.toString());
                        
                        // If is a valid operation
                        if (typeof result != 'object') {
                            remaining--;
                            ws.send(JSON.stringify({ 
                                message: 'remaining', 
                                remaining: remaining, 
                                value: result 
                            }));
                        } else {
                            ws.send(JSON.stringify({
                                message: 'error',
                                column: result.column,
                                value: message
                            }));
                        }
                    }
                }
            });
        });
    });
}

module.exports = initWSS;