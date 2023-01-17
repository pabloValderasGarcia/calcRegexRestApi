// ---------- REQUIREMENTS
const express = require('express'); // Express
const bodyparser = require('body-parser'); // Body-Parser
const jwt = require('jsonwebtoken'); // JWT
const bcrypt = require('bcrypt'); // BCrypt
const cors = require('cors'); // CORS
const WebSocket = require('ws'); // WS
const url = require('url'); // URL
const spawner = require('child_process').spawn; // For Python Calc Script
require('dotenv').config(); // DotENV


// ---------- EXPRESS

// Set express app
const app = express();
app.use(bodyparser.json());
app.use(cors());

// Login an user with his email and password
app.post('/login', async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const token = jwt.sign({
        email: req.body.email,
        password: password
    }, process.env.PRIVATE_KEY)

    res.json({
        token: token
    });
});

// Server listening...
const PORT = process.env.PORT || 3001;
let expressServer = app.listen(PORT, () => {
    console.log(`Server running: ${PORT}`)
})


// ---------- WEBSOCKET

// WebSocket to recieve and send data between client and server
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
                    // Use Python
                    let process = spawner('python', ['calc.py', JSON.stringify({
                        data_sent: message,
                        data_returned: undefined
                    })])
                    process.stdout.on('data', (data, isBinary) => {
                        result = isBinary ? data : data.toString();

                        // If is a valid operation
                        if (isNumeric(result.trim())) {
                            remaining--;
                            ws.send('Remaining ' + remaining);
                            ws.send('Result ' + result);
                        } else {
                            ws.send('Invalid operation... Write it well.');
                        }
                    })
                }
            }
        });
    });
});

function isNumeric(value) {
    return /^-?\d+$/.test(value);
}