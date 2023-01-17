let loginContainer = document.getElementById('loginContainer');
let serviceContainer = document.getElementById('serviceContainer');
let submitEq = document.getElementById('submitEq');
let messages = document.getElementById('messages');
let remaining = document.getElementById('remaining');
let result = document.getElementById('result');

let token, ws, equation;

// LOGIN
async function submitForm(e, form) {
    e.preventDefault();

    let data = await fetch('http://localhost:4444/login', {
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

    token = await data.json();
    token = token.token;
    if (token) {
        document.title = 'Calculator - CalcRegex 2023';
        loginContainer.style.display = 'none';
        serviceContainer.style.display = 'block';
        openWsConnection(token); // Trying to open connection with WebSocket
    } else {
        document.title = 'Login - CalcRegex 2023';
        loginContainer.style.display = 'block';
        serviceContainer.style.display = 'none';
    }
}

// SEND EQUATION
async function submitEquation(e, form) {
    e.preventDefault();
    messages.style.opacity = '0';
    equation = form.equation.value;

    if (ws && equation != '') ws.send(equation); // Equation sended correctly
    else { // Error while sending equation
        let newMessage = document.createElement('div');
        newMessage.textContent = 'You\'re not login or equation is empty';
        messages.appendChild(newMessageDiv);
        messages.style.opacity = '100%';
    }
}

// OPEN WS CONNECTION
const openWsConnection = (jwtAuth) => {
    ws = new WebSocket('ws://localhost:4444/ws?token=' + jwtAuth);

    ws.onmessage = (event) => {
        let data = event.data.split(' ');
        console.log(data)
        switch (data[0]) {
            case 'Remaining':
                remaining.innerHTML = 'REMAINING ' + '<span class="colored">' + data[1] + '</span>';
                if (data[1] == 0) {
                    submitEq.disabled = true;
                    messages.textContent = 'You\'ve no more attempts... You\'re being redirected';
                    messages.style.opacity = '100%';
                    setTimeout(() => { window.location.reload() }, 4000)
                }
                break;
            case 'Result':
                if (data[1] == 'Invalid') {
                    messages.textContent = 'Invalid operation... Write it well.';
                    messages.style.opacity = '100%';
                }
                else result.innerHTML = data[1];
                break;
            default:
                messages.textContent = event.data;
                messages.style.opacity = '100%';
                break;
        }
    }
}