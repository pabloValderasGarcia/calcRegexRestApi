let loginContainer = document.getElementById('loginContainer');
let serviceContainer = document.getElementById('serviceContainer');
let token = null;

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
    } else {
        document.title = 'Login - CalcRegex 2023';
        loginContainer.style.display = 'block';
        serviceContainer.style.display = 'none';
    }
}

// SEND EQUATION
async function submitEquation(e, form) {
    e.preventDefault();

    let data = await fetch('http://localhost:4444/service', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            token: token,
            equation: form.equation.value
        })
    });
}