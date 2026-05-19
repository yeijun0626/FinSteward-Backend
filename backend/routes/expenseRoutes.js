const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { analyzeReceipt, generateReport } = require('../services/ocrService');

const getUserId = (req) => req.user.userId || req.user.id || req.user.user_id;

router.get('/list', auth, (req, res) => {
    const userId = getUserId(req);
    const query = 'SELECT *, image_url AS receipt_url FROM expense WHERE user_id = ? ORDER BY expense_date DESC';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/budget', auth, (req, res) => {
    const userId = getUserId(req);
    const dateStr = req.query.date ? req.query.date.slice(0, 10) : new Date().toISOString().slice(0, 10);

    const budgetQuery = 'SELECT * FROM budget WHERE user_id = ? AND start_date <= ? AND end_date >= ? ORDER BY budget_id DESC LIMIT 1';
    
    db.query(budgetQuery, [userId, dateStr, dateStr], (err, budgetRows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (budgetRows.length === 0) return res.json({ amount: 0, spent: 0 });

        const budget = budgetRows[0];
        const expenseQuery = 'SELECT SUM(amount) as totalSpent FROM expense WHERE user_id = ? AND expense_date >= ? AND expense_date <= ? AND amount < 0';
        
        db.query(expenseQuery, [userId, budget.start_date, budget.end_date], (err, expRows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            budget.spent = expRows[0].totalSpent ? Math.abs(expRows[0].totalSpent) : 0;
            res.json(budget);
        });
    });
});

router.post('/budget/check', auth, (req, res) => {
    const userId = getUserId(req);
    const { start_date, end_date } = req.body;
    const query = 'SELECT * FROM budget WHERE user_id = ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))';
    db.query(query, [userId, end_date, start_date, end_date, start_date], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ overlap: results.length > 0, existing: results[0] });
    });
});

router.post('/budget', auth, (req, res) => {
    const userId = getUserId(req);
    const { amount, start_date, end_date, period_type } = req.body;
    
    const deleteQuery = 'DELETE FROM budget WHERE user_id = ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))';
    db.query(deleteQuery, [userId, end_date, start_date, end_date, start_date], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const insertQuery = 'INSERT INTO budget (user_id, amount, start_date, end_date, period_type) VALUES (?, ?, ?, ?, ?)';
        db.query(insertQuery, [userId, amount, start_date, end_date, period_type], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "성공" });
        });
    });
});

router.post('/ocr', auth, upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "파일 없음" });

        const imageUrl = req.file.path;

        db.query('SELECT category_id, name FROM category', async (err, catRows) => {
            if (err) return res.status(500).json({ error: "카테고리 조회 실패" });

            const categoryPrompt = catRows.map(c => `${c.category_id}:${c.name}`).join(', ');
            
            const ocrResult = await analyzeReceipt(imageUrl, categoryPrompt);
            
            if (!ocrResult) return res.status(500).json({ error: "분석 실패" });

            const userId = getUserId(req);
            const description = `[${ocrResult.storeName || '알 수 없음'}] ${ocrResult.itemName || '인식 내역'}`;
            const amount = Number(ocrResult.totalAmount || 0);
            const date = new Date().toISOString().slice(0, 10);
            const aiCategory = ocrResult.categoryId || 8;

            const finalCategoryId = catRows.some(c => c.category_id === aiCategory) ? aiCategory : 8;

            const query = 'INSERT INTO expense (user_id, description, amount, expense_date, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [userId, description, amount, date, finalCategoryId, imageUrl], (err2, result) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ message: "성공", id: result.insertId, imageUrl: imageUrl });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "서버 에러" });
    }
});

router.post('/:id/receipt', auth, upload.single('receipt'), (req, res) => {
    const userId = getUserId(req);
    if (!req.file) return res.status(400).json({ message: "업로드된 파일이 없습니다." });

    const imageUrl = req.file.path;

    const query = 'UPDATE expense SET image_url = ? WHERE expense_id = ? AND user_id = ?';
    db.query(query, [imageUrl, req.params.id, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "내역 없음" });
        res.json({ message: "성공", receipt_url: imageUrl });
    });
});

router.post('/report', auth, async (req, res) => {
    try {
        const { expenses, budget, income, totalExpense } = req.body;
        const report = await generateReport(expenses, budget, income, totalExpense);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ error: "리포트 생성 실패" });
    }
});

router.get('/:id', auth, (req, res) => {
    const userId = getUserId(req);
    const query = 'SELECT *, image_url AS receipt_url FROM expense WHERE expense_id = ? AND user_id = ?';
    db.query(query, [req.params.id, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});

router.put('/:id', auth, (req, res) => {
    const userId = getUserId(req);
    const { description, amount, expense_date, category_id } = req.body;
    const query = 'UPDATE expense SET description=?, amount=?, expense_date=?, category_id=? WHERE expense_id=? AND user_id=?';
    db.query(query, [description, amount, expense_date, category_id || 8, req.params.id, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "성공" });
    });
});

router.delete('/:id', auth, (req, res) => {
    const userId = getUserId(req);
    const query = 'DELETE FROM expense WHERE expense_id = ? AND user_id = ?';
    db.query(query, [req.params.id, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "삭제" });
    });
});

module.exports = router;