// ---------- REQUIREMENTS

const express = require('express'); // Express
const mongoose = require('mongoose'); // Mongoose DB Users
const bodyparser = require('body-parser'); // Body-Parser
const jwt = require('jsonwebtoken'); // JWT
const bcrypt = require('bcrypt'); // BCrypt
const cors = require('cors'); // CORS
const initWSS = require('./wss/wss'); // WSS
const initProxy = require('./proxy/proxy'); // Proxy
const geoip = require('geoip-lite'); // Geolocation
const http = require('http'); // HTTPS
require('dotenv').config(); // DotENV

// ---------- MONGOOSE

mongoose.set('strictQuery', false);

// Connect
let DBUser = process.env.DB_USER;
let DBPassword = process.env.DB_PASSWORD;
let DBPort = process.env.DB_PORT;
let DBName = process.env.DB_NAME;
mongoose.connect('mongodb://' + DBUser + ':' + DBPassword + 
'@localhost:' + DBPort + '/' + DBName + '?authSource=admin', () => {
    console.log('Connect to DB!');
});

// Models
const User = require('./models/User');

// ---------- GEOLOCATION SERVER

let latitudeServer, longitudeServer, rangeServer;
function setGeolocationServer() {
    latitudeServer = parseFloat(process.env.LATITUDE_SERVER);
    longitudeServer = parseFloat(process.env.LONGITUDE_SERVER);
    rangeServer = parseFloat(process.env.RANGE_SERVER);
}

// ---------- EXPRESS

// Set express app
const app = express();
app.use(bodyparser.json());
app.use(cors());

// Register an user with his email and password
app.post('/register', async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    let password = req.body.password;
    if (typeof password != 'string') {
        return res.json({ 
            status: 'wrongPassword',
            message: 'Password must be a string...' 
        });
    }
    password = await bcrypt.hash(password, salt);
    
    // Create user
    let user = new User({
        username: req.body.username,
        email: req.body.email,
        password: password
    })

    // Save user
    try { await user.save(); res.json({ message: 'User created successfully. Redirecting...' });
    } catch (err) { res.json({ status: 'alreadyExists', message: 'Email already exists...' }); }
});

// Login an user with his email and password
app.post('/login', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    
    // If user registered, login it
    let user = await User.find({ email: email });
    if (user.length) {
        if (email && password) {
            bcrypt.compare(password, user[0].password, async (err, ress) => {
                if (!ress) {
                    return res.json({ 
                        status: 'noUser',
                        message: 'Incorrect email or password...' 
                    });
                } else {
                    const salt = await bcrypt.genSalt(10);
                    password = await bcrypt.hash(password, salt);
                    const token = jwt.sign({
                        email: email,
                        password: password
                    }, process.env.PRIVATE_KEY)
                
                    res.json({ token: token });
                }
            });
        } else res.json({ message: 'Data required...' });
    } else res.json({ status: 'noUser', message: 'Incorrect email or password...' });
});

// Check Geolocation
app.post('/position', async (req, res) => {
    const latitude = req.body.lat;
    const longitude = req.body.long;
    latitudeServer = latitude;
    longitudeServer = longitude;
    
    // Check if the device is in range
    if (latitude <= latitudeServer + rangeServer && latitude >= latitudeServer - rangeServer && 
        longitude <= longitudeServer + rangeServer && longitude >= longitudeServer - rangeServer) {
        res.json({ status: 'ok', message: "Let's work" });
    } else res.json({ status: 'error', message: 'You need to be near or at the company to work...' });
});

// Server listening...
const PORT = process.env.PORT;
let expressServer = app.listen(PORT, async () => {
    setGeolocationServer();
    initProxy();
    initWSS(expressServer);
    console.log('Server running: ' + PORT)
})