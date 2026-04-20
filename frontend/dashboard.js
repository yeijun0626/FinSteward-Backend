let myChart = null;
let viewDate = new Date();
let allExpenses = [];
let currentSummaryTab = 'net';
let currentTotals = { net: 0, inc: 0, exp: 0 };
let currentType = 'expense';

async function loadExpenses() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }
    document.getElementById('userNameDisplay').innerText = localStorage.getItem('userName');
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    document.getElementById('currentMonthDisplay').innerText = `${year}.${month < 10 ? '0'+month : month}`;
    try {
        const response = await fetch('http://localhost:3000/api/expense/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allExpenses = await response.json();
        filterAndRender();
    } catch (e) { console.error(e); }
}

function filterAndRender() {
    const searchKeyword = document.getElementById('searchInput').value.toLowerCase();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const filtered = allExpenses.filter(item => {
        const d = new Date(item.expense_date);
        return d.getFullYear() === year && (d.getMonth() + 1) === month && item.description.toLowerCase().includes(searchKeyword);
    });
    renderSummary(filtered);
    renderList(filtered);
}

function renderSummary(data) {
    let inc = 0, exp = 0;
    data.forEach(item => {
        const amt = Number(item.amount);
        if (amt > 0) inc += amt; else exp += Math.abs(amt);
    });
    currentTotals = { net: inc - exp, inc, exp };
    updateSummaryDisplay();
}

function updateSummaryDisplay() {
    const display = document.getElementById('totalDisplay');
    let val = currentSummaryTab === 'net' ? currentTotals.net : (currentSummaryTab === 'inc' ? currentTotals.inc : currentTotals.exp);
    display.innerText = `${val > 0 && currentSummaryTab === 'net' ? '+' : ''}${val.toLocaleString()}원`;
    ['Net', 'Inc', 'Exp'].forEach(tab => {
        const el = document.getElementById(`tab${tab}`);
        const isCurrent = currentSummaryTab === tab.toLowerCase();
        el.style.opacity = isCurrent ? '1' : '0.7';
        el.style.borderBottom = isCurrent ? '2px solid #fff' : 'none';
    });
}

function renderList(data) {
    const listDiv = document.getElementById('expenseList');
    listDiv.innerHTML = data.map(item => `
        <div class="expense-item" onclick="editEntry(${item.expense_id || item.id})" style="cursor:pointer;">
            <div>
                <div style="font-size: 11px; color: #94a3b8;">${item.expense_date.slice(0, 10)}</div>
                <div style="font-weight: bold;">${item.description}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: ${item.amount > 0 ? '#10b981' : '#ef4444'};">
                    ${item.amount > 0 ? '+' : ''}${Math.floor(item.amount).toLocaleString()}원
                </div>
                <button onclick="event.stopPropagation(); deleteEntry(${item.expense_id || item.id})" style="border:none; background:none; color:#cbd5e1; cursor:pointer;">삭제</button>
            </div>
        </div>
    `).join('');
}

window.editEntry = function(id) {
    const item = allExpenses.find(e => (e.expense_id || e.id) === id);
    if (!item) return;
    document.getElementById('manualModal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = '내역 수정';
    document.getElementById('editId').value = id;
    
    let merchant = "";
    let desc = item.description;
    
    if (item.description.startsWith('[')) {
        const idx = item.description.indexOf(']');
        if (idx !== -1) {
            merchant = item.description.substring(1, idx);
            desc = item.description.substring(idx + 1).trim();
        }
    }
    
    document.getElementById('manualMerchant').value = merchant;
    document.getElementById('manualDesc').value = desc;
    document.getElementById('manualAmount').value = Math.abs(item.amount);
    document.getElementById('manualDate').value = item.expense_date.slice(0, 10);
    document.getElementById('manualCategory').value = item.category_id;
    currentType = item.amount > 0 ? 'income' : 'expense';
    updateTypeUI();
};

window.deleteEntry = async function(id) {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`http://localhost:3000/api/expense/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) loadExpenses(); else alert("삭제 실패");
};

document.getElementById('receiptFile').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('aiReport').innerText = "분석 중...";
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://localhost:3000/api/receipt/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
    });
    if (res.ok) { document.getElementById('aiReport').innerText = "완료"; loadExpenses(); }
    else { document.getElementById('aiReport').innerText = "실패"; }
    e.target.value = '';
};

document.getElementById('openModalBtn').onclick = () => {
    document.getElementById('manualModal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = '내역 입력';
    document.getElementById('editId').value = '';
    document.getElementById('manualMerchant').value = '';
    document.getElementById('manualDesc').value = '';
    document.getElementById('manualAmount').value = '';
    document.getElementById('manualDate').value = new Date().toISOString().split('T')[0];
    currentType = 'expense';
    updateTypeUI();
};

function updateTypeUI() {
    const isExp = currentType === 'expense';
    document.getElementById('typeExp').style.background = isExp ? '#ef4444' : '#f1f5f9';
    document.getElementById('typeExp').style.color = isExp ? '#fff' : '#1e293b';
    document.getElementById('typeInc').style.background = isExp ? '#f1f5f9' : '#10b981';
    document.getElementById('typeInc').style.color = isExp ? '#1e293b' : '#fff';
}

document.getElementById('typeExp').onclick = () => { currentType = 'expense'; updateTypeUI(); };
document.getElementById('typeInc').onclick = () => { currentType = 'income'; updateTypeUI(); };
document.getElementById('closeModalBtn').onclick = () => document.getElementById('manualModal').style.display = 'none';

document.getElementById('saveManualBtn').onclick = async () => {
    const editId = document.getElementById('editId').value;
    const merchant = document.getElementById('manualMerchant').value;
    const desc = document.getElementById('manualDesc').value;
    let amount = document.getElementById('manualAmount').value;
    const date = document.getElementById('manualDate').value;
    const cat = document.getElementById('manualCategory').value;

    amount = currentType === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    const url = editId ? `http://localhost:3000/api/expense/${editId}` : 'http://localhost:3000/api/expense';
    const method = editId ? 'PUT' : 'POST';

    const finalDesc = merchant ? `[${merchant}] ${desc}` : desc;

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ description: finalDesc, amount, expense_date: date, category_id: cat })
    });
    if (res.ok) { document.getElementById('manualModal').style.display = 'none'; loadExpenses(); }
};

document.getElementById('tabNet').onclick = () => { currentSummaryTab = 'net'; updateSummaryDisplay(); };
document.getElementById('tabInc').onclick = () => { currentSummaryTab = 'inc'; updateSummaryDisplay(); };
document.getElementById('tabExp').onclick = () => { currentSummaryTab = 'exp'; updateSummaryDisplay(); };
document.getElementById('prevMonth').onclick = () => { viewDate.setMonth(viewDate.getMonth() - 1); loadExpenses(); };
document.getElementById('nextMonth').onclick = () => { viewDate.setMonth(viewDate.getMonth() + 1); loadExpenses(); };
document.getElementById('searchInput').oninput = filterAndRender;
document.addEventListener('DOMContentLoaded', loadExpenses);