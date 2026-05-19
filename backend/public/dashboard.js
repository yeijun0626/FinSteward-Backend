let expenseChartInstance = null;    
let viewDate = new Date();
let allExpenses = [];
let categoriesList = [];
let currentSummaryTab = 'net';
let currentType = 'expense';
let currentBudget = 0;
let currentBudgetObj = null;

const formatCurrency = (val) => {
    if (!val) return "0";
    const num = String(val).replace(/[^0-9-]/g, '');
    if (num === "" || num === "-") return num;
    return Number(num).toLocaleString('ko-KR');
};

const parseCurrency = (val) => {
    if (!val) return 0;
    const num = String(val).replace(/,/g, '');
    return isNaN(num) ? 0 : Number(num);
};

const applyComma = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = 'text';
    el.addEventListener('input', (e) => {
        e.target.value = formatCurrency(e.target.value);
    });
};

applyComma('budgetInput');
applyComma('manualAmount');

function filterAndRender() {
    const searchInp = document.getElementById('searchInput');
    const keyword = searchInp ? searchInp.value.toLowerCase() : "";
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    const filtered = allExpenses.filter(item => {
        const d = new Date(item.expense_date);
        return d.getFullYear() === year && (d.getMonth() + 1) === month && 
               (item.description || "").toLowerCase().includes(keyword);
    });
    
    renderSummary(filtered);
    renderList(filtered);
    updateChart(filtered);
    updateAIReport(filtered);
}

function renderSummary(data) {
    let inc = 0, exp = 0;
    data.forEach(item => {
        const amt = Number(item.amount);
        if (amt > 0) inc += amt; else exp += Math.abs(amt);
    });
    const net = inc - exp;
    
    const totalDisplay = document.getElementById('totalDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = `${currentSummaryTab === 'net' ? (net > 0 ? '+' : '') + net.toLocaleString() : (currentSummaryTab === 'inc' ? inc.toLocaleString() : exp.toLocaleString())}원`;
    }

    const remainEl = document.getElementById('remainingBudgetText');
    const analysisEl = document.getElementById('budgetAnalysisText');

    if (currentBudgetObj && currentBudgetObj.amount > 0) {
        const budgetAmount = Number(currentBudgetObj.amount);
        const spentAmount = Number(currentBudgetObj.spent || 0);
        const remaining = budgetAmount - spentAmount;

        if (remainEl) {
            const endDate = currentBudgetObj.end_date.slice(0, 10);
            const formattedDate = endDate.replace(/-/g, '/');
            const day = getKoreanDay(endDate);
            remainEl.innerHTML = `${remaining.toLocaleString()}원 <span style="font-size:13px; font-weight:normal; color:rgba(255,255,255,0.8); margin-left:8px;">(~${formattedDate}(${day}))</span>`;
        }

        if (analysisEl) {
            if (spentAmount > budgetAmount) {
                analysisEl.innerText = "⚠️ 예산보다 소비가 심합니다! 절약이 필요해요.";
            } else if (inc < exp) {
                analysisEl.innerText = "📉 수입보다 지출이 많습니다. 주의하세요!";
            } else {
                analysisEl.innerText = "✅ 계획적인 소비를 하고 계시네요!";
            }
        }
    } else {
        if (remainEl) remainEl.innerText = "0원";
        if (analysisEl) analysisEl.innerText = "설정된 예산이 없습니다.";
    }
}

function renderList(data) {
    const listDiv = document.getElementById('expenseList');
    if (!listDiv) return;
    listDiv.innerHTML = data.map(item => {
        const id = item.expense_id || item.id;
        const receiptUrl = item.receipt_url || '';
        return `
        <div class="expense-item" onclick="editEntry(${id})" style="cursor:pointer; display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #f1f5f9;">
            <div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">
                    ${item.expense_date.slice(0, 10)}
                </div>
                <div style="font-weight:bold; color:#1e293b;">${item.description}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:bold; color:${item.amount > 0 ? '#10b981' : '#ef4444'};">
                    ${item.amount.toLocaleString()}원
                </div>
                <button onclick="event.stopPropagation(); showReceipt(${id}, '${receiptUrl}')" style="border:none; background:#e0f2fe; color:#0284c7; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:11px; margin-top:5px; margin-right:5px;">📷 영수증</button>
                <button onclick="event.stopPropagation(); deleteEntry(${id})" style="border:none; background:#fee2e2; color:#ef4444; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:11px; margin-top:5px;">삭제</button>
            </div>
        </div>
    `}).join('');
}

function updateChart(data) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const expenseData = data.filter(item => item.amount < 0);
    const categoryTotals = {};
    const safeCategories = categoriesList || [];

    expenseData.forEach(item => {
        const catId = item.category_id || 8; 
        const cat = safeCategories.find(c => (c.category_id || c.id) == catId);
        const catName = cat ? cat.name : '기타';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Math.abs(item.amount);
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if (window.expenseChartInstance) {
        window.expenseChartInstance.destroy(); 
    }

    if (labels.length === 0) {
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = 'block';
    window.expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right' } }
        }
    });
}

async function updateAIReport(data) {
    const reportEl = document.getElementById('aiReport');
    if (!reportEl) return;

    let expTotal = 0;
    let incTotal = 0;
    data.forEach(item => {
        const amt = Number(item.amount);
        if (amt < 0) expTotal += Math.abs(amt);
        else incTotal += amt;
    });

    try {
        const res = await fetch('/api/expense/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                expenses: data, 
                budget: currentBudget,
                income: incTotal, 
                totalExpense: expTotal
            })
        });

        if (res.ok) {
            const result = await res.json();
            reportEl.innerHTML = result.report;
        } else {
            reportEl.innerText = "분석 실패";
        }
    } catch (e) {
        reportEl.innerText = "서버 연결 실패";
    }
}

function getKoreanDay(dateString) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateString).getDay()];
}

async function loadBudget() {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    try {
        const res = await fetch(`/api/expense/budget?date=${todayStr}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            currentBudgetObj = data.amount ? data : null;
        } else {
            currentBudgetObj = null;
        }
    } catch (e) {
    }
}

async function loadExpenses() {
    try {
        const res = await fetch('/api/expense/list', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            allExpenses = data;
            filterAndRender();
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/category', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            categoriesList = await res.json();
            sortCategoriesList();
            renderCategoryGrid();
        }
    } catch (e) {}
}

function sortCategoriesList() {
    const order = JSON.parse(localStorage.getItem('categoryOrder')) || [];
    categoriesList.sort((a, b) => {
        let idxA = order.indexOf(String(a.category_id || a.id));
        let idxB = order.indexOf(String(b.category_id || b.id));
        if(idxA === -1) idxA = 999;
        if(idxB === -1) idxB = 999;
        return idxA - idxB;
    });
}

function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    categoriesList.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'cat-item';
        div.dataset.id = cat.category_id || cat.id;
        
        const iconHtml = (cat.icon && cat.icon.startsWith('data:image')) 
            ? `<img src="${cat.icon}" class="cat-icon">` 
            : `<div class="cat-icon">${cat.icon || '✨'}</div>`;
            
        div.innerHTML = `${iconHtml}<span style="font-size:12px;text-align:center;word-break:keep-all;">${cat.name}</span>`;
        
        div.onclick = () => {
            document.querySelectorAll('.cat-item').forEach(el => el.style.borderColor = '#e2e8f0');
            div.style.borderColor = '#2563eb';
            document.getElementById('manualCategory').value = cat.category_id || cat.id;
        };
        grid.appendChild(div);
    });
}

function openCategoryModal() {
    const presets = ['🛒','🍽️','📱','🎮','🚌','👕','🚗','🍷','🚬','💻','✈️','❤️','🐶','🔧','🏠','🛋️','🎁','🤝','🎲','🍰','👶','🥕','🍒','⚙️'];
    const presetDiv = document.getElementById('presetIcons');
    if(presetDiv) {
        presetDiv.innerHTML = presets.map(p => `<div style="font-size:24px;cursor:pointer;text-align:center;" onclick="selectIcon('${p}')">${p}</div>`).join('');
    }
    
    const iconVal = document.getElementById('selectedIconVal');
    const preview = document.getElementById('iconPreview');
    if(iconVal) iconVal.value = '✨';
    if(preview) preview.innerHTML = '✨';
    
    const name = document.getElementById('newCatName');
    const custom = document.getElementById('customCatIcon');
    const modal = document.getElementById('categoryModal');
    if(name) name.value = '';
    if(custom) custom.value = '';
    if(modal) modal.style.display = 'flex';
}

window.selectIcon = function(val) {
    const iconVal = document.getElementById('selectedIconVal');
    const preview = document.getElementById('iconPreview');
    if(iconVal) iconVal.value = val;
    if(preview) preview.innerHTML = val;
};

document.getElementById('customCatIcon')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 64; 
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 64, 64);
            const base64 = canvas.toDataURL('image/png');
            document.getElementById('selectedIconVal').value = base64;
            document.getElementById('iconPreview').innerHTML = `<img src="${base64}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('saveCatBtn')?.addEventListener('click', async () => {
    const icon = document.getElementById('selectedIconVal').value;
    const name = document.getElementById('newCatName').value;
    if (!name) return;

    const res = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ icon, name })
    });

    if (res.ok) {
        document.getElementById('categoryModal').style.display = 'none';
        document.getElementById('manageCatModal').style.display = 'flex';
        await loadCategories();
        document.getElementById('manageCatBtn').click();
    }
});

document.getElementById('manageCatBtn')?.addEventListener('click', () => {
    const listDiv = document.getElementById('manageCatList');
    if(!listDiv) return;
    listDiv.innerHTML = categoriesList.map(cat => {
        const id = cat.category_id || cat.id;
        const iconHtml = (cat.icon && cat.icon.startsWith('data:image')) 
            ? `<img src="${cat.icon}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` 
            : `<span style="font-size:24px;">${cat.icon || '✨'}</span>`;
        return `
        <div class="draggable-cat" draggable="true" data-id="${id}" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f1f5f9; cursor:grab; background:#fff;">
            <div style="display:flex; align-items:center; gap:15px;">
                <span style="color:#cbd5e1; font-size:18px;">⣿</span>
                ${iconHtml}
                <span style="font-weight:bold;">${cat.name}</span>
            </div>
            <button onclick="deleteCategory(${id})" style="background:#fee2e2; color:#ef4444; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">삭제</button>
        </div>
        `;
    }).join('');
    document.getElementById('manageCatModal').style.display = 'flex';
    setupDragAndDrop();
});

function showAlert(title, msg, icon) {
    const modal = document.getElementById('alertModal');
    if (!modal) return;
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMsg').innerText = msg;
    document.getElementById('alertIcon').innerText = icon;
    document.getElementById('alertCancelBtn').style.display = 'none';
    modal.style.display = 'flex';
    document.getElementById('alertConfirmBtn').onclick = () => { modal.style.display = 'none'; };
}

function showConfirm(title, msg, icon, onConfirm) {
    const modal = document.getElementById('alertModal');
    if (!modal) return;
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMsg').innerText = msg;
    document.getElementById('alertIcon').innerText = icon;
    document.getElementById('alertCancelBtn').style.display = 'block';
    modal.style.display = 'flex';
    document.getElementById('alertConfirmBtn').onclick = () => { onConfirm(); modal.style.display = 'none'; };
    document.getElementById('alertCancelBtn').onclick = () => { modal.style.display = 'none'; };
}

window.deleteCategory = function(id) {
    if(id >= 1 && id <= 8) {
        showAlert("삭제 불가", "해당 카테고리는 필수 항목이라 지울 수 없습니다!", "🔒");
        return;
    }

    showConfirm("삭제 확인", "정말 이 카테고리를 삭제하시겠습니까?", "🗑️", async () => {
        try {
            const res = await fetch(`/api/category/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (res.ok) {
                await loadCategories();
                document.getElementById('manageCatBtn').click(); 
            } else {
                const data = await res.json();
                if (data.error && data.error.includes('foreign key constraint fails')) {
                    showAlert("삭제 불가", "해당 카테고리는 필수 항목이라 지울 수 없습니다!", "🚫");
                } else {
                    showAlert("삭제 실패", "알 수 없는 오류가 발생했습니다.", "❌");
                }
            }
        } catch (e) {
            showAlert("통신 에러", "서버와 연결할 수 없습니다.", "📡");
        }
    });
};

function setupDragAndDrop() {
    const items = document.querySelectorAll('.draggable-cat');
    const list = document.getElementById('manageCatList');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function() {
            draggedItem = item;
            setTimeout(() => item.style.opacity = '0.5', 0);
        });
        item.addEventListener('dragend', function() {
            setTimeout(() => {
                item.style.opacity = '1';
                draggedItem = null;
                const newOrder = Array.from(document.querySelectorAll('.draggable-cat')).map(el => el.dataset.id);
                localStorage.setItem('categoryOrder', JSON.stringify(newOrder));
                sortCategoriesList();
            }, 0);
        });
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-cat:not([style*="opacity: 0.5"])')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

window.editEntry = async function(id) {
    const res = await fetch(`/api/expense/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    
    const eid = document.getElementById('editId');
    const mtitle = document.getElementById('modalTitle');
    if (eid) eid.value = data.expense_id || data.id;
    if (mtitle) mtitle.innerText = '내역 수정';
    
    const parts = data.description.match(/\[(.*?)\] (.*)/);
    const mmer = document.getElementById('manualMerchant');
    const mdes = document.getElementById('manualDesc');
    const mamt = document.getElementById('manualAmount');
    const mdat = document.getElementById('manualDate');

    if (mmer) mmer.value = parts ? parts[1] : '';
    if (mdes) mdes.value = parts ? parts[2] : data.description;
    if (mamt) mamt.value = formatCurrency(Math.abs(data.amount));
    if (mdat) mdat.value = data.expense_date.slice(0, 10);
    
    const catInput = document.getElementById('manualCategory');
    if(catInput) catInput.value = data.category_id || '';
    
    document.querySelectorAll('.cat-item').forEach(el => el.style.borderColor = '#e2e8f0');
    const targetCat = document.querySelector(`.cat-item[data-id="${data.category_id || ''}"]`);
    if(targetCat) targetCat.style.borderColor = '#2563eb';

    currentType = data.amount > 0 ? 'income' : 'expense';
    updateTypeUI();
    const modal = document.getElementById('manualModal');
    if(modal) modal.style.display = 'flex';
};

window.deleteEntry = function(id) {
    showConfirm("삭제 확인", "삭제하시겠습니까?", "🗑️", async () => {
        await fetch(`/api/expense/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        loadExpenses();
    });
};

function updateTypeUI() {
    const isExp = currentType === 'expense';
    const te = document.getElementById('typeExp');
    const ti = document.getElementById('typeInc');
    if (te) { te.style.background = isExp ? '#ef4444' : '#f1f5f9'; te.style.color = isExp ? '#fff' : '#1e293b'; }
    if (ti) { ti.style.background = isExp ? '#f1f5f9' : '#10b981'; ti.style.color = isExp ? '#1e293b' : '#fff'; }
}

let calDate = new Date();
let selectedRange = { start: null, end: null };
let calendarViewMode = 'days'; 

function togglePeriodUI(type) {
    document.getElementById('ui-month').style.display = type === 'month' ? 'block' : 'none';
    document.getElementById('ui-year').style.display = type === 'year' ? 'block' : 'none';
    document.getElementById('ui-custom').style.display = type === 'custom' ? 'block' : 'none';
    if (type === 'custom') renderCustomCalendar();
}

function renderCustomCalendar() {
    const grid = document.getElementById('calGrid');
    const header = document.getElementById('calHeader');
    if (!grid || !header) return;
    
    grid.innerHTML = '';
    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    header.innerHTML = `
        <span onclick="calendarViewMode='years'; renderCustomCalendar();" style="cursor:pointer; hover:text-decoration:underline;">${year}년</span> 
        <span onclick="calendarViewMode='months'; renderCustomCalendar();" style="cursor:pointer; hover:text-decoration:underline;">${month + 1}월</span>
    `;

    if (calendarViewMode === 'days') {
        renderDays(year, month, grid);
    } else if (calendarViewMode === 'months') {
        renderMonths(grid);
    } else if (calendarViewMode === 'years') {
        renderYears(year, grid);
    }
}

function renderDays(year, month, grid) {
    const days = ['일','월','화','수','목','금','토'];
    days.forEach(d => grid.innerHTML += `<div style="color:#94a3b8; font-weight:bold; padding:5px 0;">${d}</div>`);

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';

    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.innerText = i;
        dayDiv.style.padding = '8px 0';
        dayDiv.style.cursor = 'pointer';
        dayDiv.style.borderRadius = '10px';
        dayDiv.style.fontSize = '13px';
        
        if (selectedRange.start === dateStr || selectedRange.end === dateStr) {
            dayDiv.style.background = '#1d4ed8'; 
            dayDiv.style.color = '#fff';
            dayDiv.style.fontWeight = 'bold';
        } else if (selectedRange.start && selectedRange.end && dateStr > selectedRange.start && dateStr < selectedRange.end) {
            dayDiv.style.background = '#dbeafe'; 
            dayDiv.style.color = '#1e40af';
        }

        dayDiv.onclick = () => {
            if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
                selectedRange.start = dateStr;
                selectedRange.end = null;
            } else {
                if (dateStr < selectedRange.start) {
                    selectedRange.end = selectedRange.start;
                    selectedRange.start = dateStr;
                } else {
                    selectedRange.end = dateStr;
                }
            }
            const sInp = document.getElementById('customStart');
            const eInp = document.getElementById('customEnd');
            if(sInp) sInp.value = selectedRange.start || '';
            if(eInp) eInp.value = selectedRange.end || '';
            renderCustomCalendar();
        };
        grid.appendChild(dayDiv);
    }
}

function renderMonths(grid) {
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    for (let i = 0; i < 12; i++) {
        const div = document.createElement('div');
        div.innerText = `${i + 1}월`;
        div.style.padding = '15px 0';
        div.style.cursor = 'pointer';
        div.style.borderRadius = '10px';
        if (calDate.getMonth() === i) {
            div.style.background = '#2563eb';
            div.style.color = '#fff';
        }
        div.onclick = () => {
            calDate.setMonth(i);
            calendarViewMode = 'days';
            grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            renderCustomCalendar();
        };
        grid.appendChild(div);
    }
}

function renderYears(currentYear, grid) {
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    for (let i = currentYear - 4; i <= currentYear + 7; i++) {
        const div = document.createElement('div');
        div.innerText = `${i}년`;
        div.style.padding = '15px 0';
        div.style.cursor = 'pointer';
        div.style.borderRadius = '10px';
        if (currentYear === i) {
            div.style.background = '#2563eb';
            div.style.color = '#fff';
        }
        div.onclick = () => {
            calDate.setFullYear(i);
            calendarViewMode = 'days';
            grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            renderCustomCalendar();
        };
        grid.appendChild(div);
    }
}

function changeCalMonth(val) {
    if (calendarViewMode === 'days') {
        calDate.setMonth(calDate.getMonth() + val);
    } else if (calendarViewMode === 'years') {
        calDate.setFullYear(calDate.getFullYear() + (val * 12));
    }
    renderCustomCalendar();
}

document.getElementById('customStart')?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        selectedRange.start = val;
        const [y, m] = val.split('-').map(Number);
        calDate.setFullYear(y);
        calDate.setMonth(m - 1);
        renderCustomCalendar();
    }
});

document.getElementById('customEnd')?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        selectedRange.end = val;
        if (selectedRange.start && val < selectedRange.start) {
            const temp = selectedRange.start;
            selectedRange.start = val;
            selectedRange.end = temp;
            document.getElementById('customStart').value = selectedRange.start;
            document.getElementById('customEnd').value = selectedRange.end;
        }
        renderCustomCalendar();
    }
});

document.getElementById('confirmBudgetBtn')?.addEventListener('click', async () => {
    const pTypeEl = document.querySelector('input[name="pType"]:checked');
    if (!pTypeEl) return;
    const pType = pTypeEl.value;
    const amount = parseCurrency(document.getElementById('budgetInput').value);
    let start = "", end = "";

    if (pType === 'month') {
        const val = document.getElementById('budgetMonthInp').value;
        if (!val) return alert("월을 선택하세요.");
        start = `${val}-01`;
        const lastDay = new Date(val.split('-')[0], val.split('-')[1], 0).getDate();
        end = `${val}-${String(lastDay).padStart(2, '0')}`;
    } else if (pType === 'year') {
        const val = document.getElementById('budgetYearInp').value;
        if (!val) return alert("연도를 입력하세요.");
        start = `${val}-01-01`;
        end = `${val}-12-31`;
    } else {
        start = document.getElementById('customStart').value;
        end = document.getElementById('customEnd').value;
    }

    if (!start || !end) return alert("날짜를 확인해주세요.");

    const checkRes = await fetch('/api/expense/budget/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ start_date: start, end_date: end })
    });
    const checkData = await checkRes.json();

    if (checkData.overlap) {
        const existing = checkData.existing;
        const msg = `이미 ${existing.start_date.slice(0,10)} ~ ${existing.end_date.slice(0,10)} 기간에 ${existing.amount.toLocaleString()}원의 예산이 있습니다. 현재 설정한 기간으로 수정하시겠습니까?`;
        showConfirm("예산 중복", msg, "⚠️", () => executeSaveBudget(amount, start, end, pType));
    } else {
        executeSaveBudget(amount, start, end, pType);
    }
});

async function executeSaveBudget(amount, start, end, pType) {
    const res = await fetch('/api/expense/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ amount, start_date: start, end_date: end, period_type: pType })
    });

    if (res.ok) {
        document.getElementById('budgetModal').style.display = 'none';
        await loadBudget();
        loadExpenses();
    }
}

document.getElementById('setBudgetBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('budgetModal');
    const input = document.getElementById('budgetInput');
    if (input) input.value = formatCurrency(currentBudget || 0);

    const monthInp = document.getElementById('budgetMonthInp');
    if (monthInp) {
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        monthInp.value = `${y}-${m}`;
    }

    if (modal) modal.style.display = 'flex';
});

document.getElementById('saveManualBtn')?.addEventListener('click', () => {
    const editId = document.getElementById('editId').value;
    const merchant = document.getElementById('manualMerchant').value;
    const desc = document.getElementById('manualDesc').value;
    const amountVal = parseCurrency(document.getElementById('manualAmount').value);
    const date = document.getElementById('manualDate').value;
    const cat = document.getElementById('manualCategory').value;

    showConfirm(editId ? "수정" : "저장", "진행하시겠습니까?", "💾", async () => {
        const amount = currentType === 'expense' ? -Math.abs(amountVal) : Math.abs(amountVal);
        const url = editId ? `/api/expense/${editId}` : '/api/expense';
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ 
                description: `[${merchant}] ${desc}`, 
                amount, 
                expense_date: date, 
                category_id: cat || null 
            })
        });
        if (res.ok) {
            document.getElementById('manualModal').style.display = 'none';
            loadExpenses();
        }
    });
});

document.getElementById('openModalBtn')?.addEventListener('click', () => {
    const form = document.getElementById('manualForm');
    if(form) form.reset();
    document.getElementById('editId').value = '';
    const title = document.getElementById('modalTitle');
    if(title) title.innerText = '내역 직접 입력';
    const dateInp = document.getElementById('manualDate');
    if(dateInp) dateInp.value = new Date().toISOString().split('T')[0];
    const catInp = document.getElementById('manualCategory');
    if(catInp) catInp.value = '';
    document.querySelectorAll('.cat-item').forEach(el => el.style.borderColor = '#e2e8f0');
    currentType = 'expense';
    updateTypeUI();
    const modal = document.getElementById('manualModal');
    if(modal) modal.style.display = 'flex';
});

document.getElementById('typeExp')?.addEventListener('click', () => { currentType = 'expense'; updateTypeUI(); });
document.getElementById('typeInc')?.addEventListener('click', () => { currentType = 'income'; updateTypeUI(); });
document.getElementById('closeModalBtn')?.addEventListener('click', () => { 
    const m = document.getElementById('manualModal');
    if(m) m.style.display = 'none'; 
});

document.getElementById('tabNet')?.addEventListener('click', () => { currentSummaryTab = 'net'; filterAndRender(); });
document.getElementById('tabInc')?.addEventListener('click', () => { currentSummaryTab = 'inc'; filterAndRender(); });
document.getElementById('tabExp')?.addEventListener('click', () => { currentSummaryTab = 'exp'; filterAndRender(); });

document.getElementById('prevMonth')?.addEventListener('click', async () => { 
    viewDate.setMonth(viewDate.getMonth() - 1); 
    const d = document.getElementById('currentMonthDisplay');
    if (d) d.innerText = `${viewDate.getFullYear()}.${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    await loadBudget(); 
    loadExpenses(); 
});

document.getElementById('nextMonth')?.addEventListener('click', async () => { 
    viewDate.setMonth(viewDate.getMonth() + 1); 
    const d = document.getElementById('currentMonthDisplay');
    if (d) d.innerText = `${viewDate.getFullYear()}.${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    await loadBudget(); 
    loadExpenses(); 
});

document.getElementById('logoutBtn')?.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });
document.getElementById('searchInput')?.addEventListener('input', filterAndRender);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const al = document.getElementById('alertModal');
        const ma = document.getElementById('manualModal');
        const cm = document.getElementById('categoryModal');
        const bm = document.getElementById('budgetModal');

        if (al && al.style.display === 'flex') {
            document.getElementById('alertConfirmBtn')?.click();
        } else if (ma && ma.style.display === 'flex') {
            document.getElementById('saveManualBtn')?.click();
        } else if (cm && cm.style.display === 'flex') {
            document.getElementById('saveCatBtn')?.click();
        } else if (bm && bm.style.display === 'flex') {
            document.getElementById('confirmBudgetBtn')?.click();
        }
    }
});

document.getElementById('receiptFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusMsg = document.getElementById('aiStatusMsg');
    statusMsg.innerText = "🤖 AI가 영수증을 분석 중입니다...";
    statusMsg.style.color = "#2563eb";

    const formData = new FormData();
    formData.append('receipt', file); 

    try {
        const res = await fetch('/api/expense/ocr', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if (res.ok) {
            statusMsg.innerText = "✨ 영수증 분석 및 자동 저장 완료!";
            statusMsg.style.color = "#10b981";
            loadExpenses();
        } else {
            const errData = await res.json();
            statusMsg.innerText = `❌ 실패: ${errData.error || '분석 오류'}`;
            statusMsg.style.color = "#ef4444";
        }
    } catch (err) {
        statusMsg.innerText = "❌ 서버 연결 실패";
        statusMsg.style.color = "#ef4444";
    }
    e.target.value = ''; 
});

async function loadUserInfo() {
    const userDisplay = document.getElementById('userNameDisplay');
    if (!userDisplay) return;

    const storedName = localStorage.getItem('userName') || localStorage.getItem('name');
    if (storedName) {
        userDisplay.innerText = `${storedName}님`;
        return;
    }

    try {
        const res = await fetch('/api/user/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const userData = await res.json();
            const userName = userData.name || userData.username || userData.userId || '사용자';
            userDisplay.innerText = `${userName}님`;
            localStorage.setItem('userName', userName);
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadBudget();
    await loadCategories(); 
    loadExpenses();
});

let currentReceiptExpenseId = null;

window.showReceipt = (expenseId, receiptUrl) => {
    currentReceiptExpenseId = expenseId;
    const modal = document.getElementById("receiptModal");
    const img = document.getElementById("receiptImage");
    const text = document.getElementById("noReceiptText");
    const saveBtn = document.getElementById("uploadReceiptBtn");
    const fileInput = document.getElementById("receiptFileInput");

    fileInput.value = "";
    saveBtn.style.display = "none";

    if (receiptUrl && receiptUrl !== 'null' && receiptUrl !== 'undefined' && receiptUrl.trim() !== '') {
        img.src = receiptUrl;
        img.style.display = "block";
        text.style.display = "none";
    } else {
        img.src = "";
        img.style.display = "none";
        text.style.display = "block";
    }

    modal.style.display = "block";
};

document.getElementById('receiptFileInput').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById("receiptImage");
            img.src = e.target.result;
            img.style.display = "block";
            document.getElementById("noReceiptText").style.display = "none";
            document.getElementById("uploadReceiptBtn").style.display = "block";
        };
        reader.readAsDataURL(this.files[0]);
    }
});

document.getElementById('uploadReceiptBtn').onclick = async () => {
    const fileInput = document.getElementById('receiptFileInput');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    try {
        const res = await fetch(`/api/expense/${currentReceiptExpenseId}/receipt`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        if (res.ok) {
            alert('영수증이 저장되었습니다.');
            document.getElementById("receiptModal").style.display = "none";
            location.reload();
        } else {
            alert('저장 실패');
        }
    } catch (e) {
        alert('서버 오류 발생');
    }
};

document.addEventListener('click', (e) => {
    const modal = document.getElementById("receiptModal");
    if (e.target.classList.contains('close-modal') || e.target === modal) {
        if(modal) modal.style.display = "none";
    }
});