// VARIABLES

let loginContainer = document.getElementById('loginContainer');
let serviceContainer = document.getElementById('serviceContainer');
let submitEq = document.getElementById('submitEq');
let messages = document.getElementById('messages');
let loginMessages = document.getElementById('loginMessages');
let remaining = document.getElementById('remaining');
let result = document.getElementById('result');

let token, ws, equation;
let locationEnabled = false;

// REGISTER
async function register(e, form) {
    e.preventDefault();

    let data = await fetch('https://localhost:443/register', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            username: form.username.value,
            email: form.email.value,
            password: form.password.value
        })
    });

    data = await data.json();
    if (data.status) {
        loginMessages.innerHTML = data.message;
        loginMessages.style.opacity = '100%';
    } else {
        loginMessages.innerHTML = data.message;
        loginMessages.style.opacity = '100%';
        loginMessages.style.backgroundColor = 'rgb(92, 175, 128)';
        setTimeout(() => { window.location.href = 'service.html'; }, 1000);
    }
}

// LOGIN
async function login(e, form) {
    e.preventDefault();

    checkLocation(); // Execute location checker

    let data = await fetch('https://localhost:443/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            email: form.email.value,
            password: form.password.value
        })
    });

    data = await data.json();
    if (data.status != 'noUser') {
        token = data.token;
        if (token) {
            document.title = 'Calculator - CalcRegex 2023';
            loginContainer.style.display = 'none';
            serviceContainer.style.display = 'block';
            openWsConnection(token); // Open connection with WebSocket
        } else {
            document.title = 'Login - CalcRegex 2023';
            loginContainer.style.display = 'block';
            serviceContainer.style.display = 'none';
        }
    } else {
        loginMessages.innerHTML = data.message;
        loginMessages.style.opacity = '100%';
    }
}

// CHECK LOCATION
function checkLocation() {
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            locationEnabled = true;
            const crd = pos.coords;
    
            let data = await fetch('https://localhost:443/position', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    lat: crd.latitude,
                    long: crd.longitude
                })
            });
            data = await data.json();

            if (data.status == 'error') {
                messages.style.opacity = '100%';
                messages.textContent = 'You need to be near or at the company to work...';
                submitEq.disabled = true;
                if (ws) ws.close();
            }
        }, 
        (error) => {
            messages.style.opacity = '100%';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    locationEnabled = false;
                    submitEq.disabled = true;
                    messages.textContent = 'User denied the request for Geolocation... Enable it and reload.';
                    ws.close();
                    break;
                case error.POSITION_UNAVAILABLE:
                    messages.textContent = 'Location information is unavailable...';
                    break;
                case error.TIMEOUT:
                    messages.textContent = 'The request to get user location timed out...';
                    break;
                case error.UNKNOWN_ERROR:
                    messages.textContent = 'An unknown error occurred...';
                    break;
            }
        }, 
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// SEND EQUATION
async function submitEquation(e, form) {
    e.preventDefault();

    messages.style.opacity = '0';
    equation = form.equation.value;

    if (ws && equation != '' && locationEnabled) ws.send(equation); // Equation sended correctly
    else { // Error while sending equation
        let newMessage = document.createElement('div');
        newMessage.textContent = 'You\'re not login or equation is empty';
        messages.appendChild(newMessage);
        messages.style.opacity = '100%';
    }
}

// OPEN WS CONNECTION
const openWsConnection = (jwtAuth) => {
    ws = new WebSocket('ws://localhost:4444/ws?token=' + jwtAuth);

    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);
        result.innerHTML = '<span class="loader" id="equationLoader"></span>';

        let equationLoader = document.getElementById('equationLoader');
        equationLoader.style.opacity = '100%';
        submitEq.disabled = true;

        setTimeout(() => {
            submitEq.disabled = false;
            equationLoader.style.opacity = '0';
            
            switch (data.message) {
                case 'remaining':
                    remaining.innerHTML = 'REMAINING ' + '<span class="colored">' + data.remaining + '</span>';
                    result.innerHTML = data.value;
                    if (data.remaining == 0) {
                        submitEq.disabled = true;
                        messages.textContent = 'You\'ve no more attempts... You\'re being redirected';
                        messages.style.opacity = '100%';
                        setTimeout(() => { window.location.reload() }, 4000)
                    }
                    break;
                case 'error':
                    let operation = data.value.split('');
                    let error = operation.splice(data.column - 1).join('');
                    operation = operation.join('') + '<span class="error">' + error + '</span>';

                    messages.textContent = 'Invalid operation... Write it well.';
                    messages.style.opacity = '100%';
                    result.innerHTML = operation;
                    break;
                default:
                    messages.textContent = event.data;
                    messages.style.opacity = '100%';
                    break;
            }
        }, Math.floor(Math.random() * (6000 - 1000 + 1) + 1000));
    }
}