// Init Proxy
function initProxy() {
    // Requirements
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const https = require('https');
    const fs = require("fs");
    const express = require('express'); // Express
    const app = express();

    // Use Proxy
    app.use('/', createProxyMiddleware({
        target: process.env.API_URL,
        changeOrigin: true
    }));

    // Listening
    https.createServer({ 
        key: fs.readFileSync('./proxy/keys/key.pem'), 
        cert: fs.readFileSync('./proxy/keys/cert.pem') 
    }, app)
    .listen(443, () => {
        console.log('Proxy running: 443');
    })
}

module.exports = initProxy;