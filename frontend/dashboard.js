document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('receiptFile');
    const resultText = document.getElementById('resultText');
    const resultDiv = document.getElementById('analysisResult');
    const token = localStorage.getItem('token');

    if (!fileInput.files[0]) {
        alert("파일을 선택해주세요!");
        return;
    }

    if (!token) {
        alert("인증 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = 'index.html';
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    resultDiv.style.display = "block";
    resultText.innerText = "AI 분석 중...";

    try {
        const response = await fetch('http://localhost:3000/api/receipt/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            resultText.style.color = "blue";
            resultText.innerText = `[분석 완료]\n상점: ${result.storeName}\n금액: ${result.amount.toLocaleString()}원`;
        } else {
            resultText.style.color = "red";
            resultText.innerText = "실패: " + result.message;
        }
    } catch (error) {
        console.error(error);
        resultText.style.color = "red";
        resultText.innerText = "서버 통신 에러";
    }
});