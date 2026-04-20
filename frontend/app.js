let isLoginMode = true;

function togglePasswordVisibility(inputId, eyeSpan) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        eyeSpan.innerText = "⊖";
    } else {
        input.type = "password";
        eyeSpan.innerText = "⊙";
    }
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'switchMode') {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        const authForm = document.getElementById('authForm');
        const signUpFields = document.getElementById('signUpFields');
        const confirmField = document.getElementById('confirmPasswordField');
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const messageText = document.getElementById('message');
        const switchModeLink = document.getElementById('switchMode');

        authForm.reset();
        messageText.innerText = "";
        
        document.querySelectorAll('.toggle-password').forEach(span => span.innerText = "⊙");
        document.querySelectorAll('input').forEach(input => {
            if(input.id.includes('password') || input.id.includes('Password')) input.type = "password";
        });

        if (isLoginMode) {
            formTitle.innerText = "FinSteward AI 로그인";
            submitBtn.innerText = "로그인";
            signUpFields.style.display = "none";
            confirmField.style.display = "none";
            switchModeLink.innerText = "회원가입"; 
        } else {
            formTitle.innerText = "FinSteward AI 회원가입";
            submitBtn.innerText = "가입하기";
            signUpFields.style.display = "block";
            confirmField.style.display = "block";
            switchModeLink.innerText = "로그인"; 
        }
    }
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = document.getElementById('message');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!isLoginMode) {
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            messageText.innerText = "비밀번호가 일치하지 않습니다.";
            messageText.style.color = "red";
            return;
        }
    }

    const endpoint = isLoginMode ? '/api/login' : '/api/users';
    const payload = { email, password };
    if (!isLoginMode) {
        payload.name = document.getElementById('name').value;
        payload.account_type = document.getElementById('accountType').value;
    }

    try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user.name);
                window.location.href = 'dashboard.html';
            } else {
                alert("가입 성공! 로그인해 주세요.");
                isLoginMode = false;
                document.getElementById('switchMode').click();
            }
        } else {
            
            messageText.innerText = data.message || "회원가입에 실패했습니다.";
            messageText.style.color = "red";
        }
    } catch (err) {
        messageText.innerText = "서버와 통신할 수 없습니다.";
        messageText.style.color = "red";
    }
    
});