const showSection = (sectionId) => {
    document.querySelectorAll('.auth-box').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
};

const requestAction = async (url, payload, successMsg, callback) => {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            if (successMsg) alert(successMsg);
            if (callback) callback(data);
        } else {
            alert(`요청 실패: ${data.message}`);
        }
    } catch (e) {
        alert("서버 연결 실패. 서버가 켜져 있는지 확인하세요.");
    }
};

document.getElementById('loginBtn').onclick = () => {
    const email = document.getElementById('loginId').value;
    const password = document.getElementById('loginPw').value;

    if (!email || !password) {
        alert("이메일과 비밀번호를 입력해주세요.");
        return;
    }

    requestAction('/api/login', { email, password }, null, (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user ? data.user.name : 'User');
        window.location.href = 'dashboard.html';
    });
};

document.getElementById('signupBtn').onclick = () => {
    const account_type = document.getElementById('sigAccountType').value;
    const email = document.getElementById('sigEmail').value;
    const name = document.getElementById('sigId').value;
    const password = document.getElementById('sigPw').value;
    const passwordConfirm = document.getElementById('sigPwConfirm').value;

    if (!email || !name || !password || !passwordConfirm) {
        alert("모든 정보를 입력해주세요.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    requestAction('/api/users', { email, password, name, account_type }, "가입 성공! 로그인해주세요.", () => showSection('loginSection'));
};

document.getElementById('findIdBtn').onclick = () => {
    const email = document.getElementById('findIdEmail').value;
    if (!email) {
        alert("이메일을 입력해주세요.");
        return;
    }
    alert("아이디 찾기 요청: " + email);
};

document.getElementById('findPwBtn').onclick = () => {
    const username = document.getElementById('findPwId').value;
    const email = document.getElementById('findPwEmail').value;
    if (!username || !email) {
        alert("아이디와 이메일을 입력해주세요.");
        return;
    }
    alert("비밀번호 찾기 요청: " + username + " / " + email);
};

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const activeSection = document.querySelector('.auth-box.active');
        if (activeSection) {
            const btn = activeSection.querySelector('button');
            if (btn) btn.click();
        }
    }
});