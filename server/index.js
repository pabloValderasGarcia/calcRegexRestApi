const express = require('express');
const bodyparser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyparser.json());
app.use(cors());

// LOGIN GET DATA (EMAIL AND PASSWORD)
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

// GET SERVICE PAGE CHECKING CORRECT TOKEN
const verifyToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) return res.status(401).json({ error: 'Denied access...' });
    try {
        jwt.verify(token, process.env.PRIVATE_KEY);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Not a valid token...' });
    }
}
app.post('/service', verifyToken, async (req, res) => {
    if (!req.body.equation) return res.status(418).json({ error: 'Equation required...' });
    let websocket = new WebSocket();
    res.json({
        'state': true,
        'websocket': ws
    });
});

// SERVER LISTENING
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running: ${PORT}`)
})