const express = require('express');
const router = express.Router();
const db = require('../db'); 
const auth = require('../middlewares/auth');

router.get('/', auth, (req, res) => {
    db.query('SELECT * FROM category', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/', auth, (req, res) => {
    const { name, icon } = req.body;
    db.query('INSERT INTO category (name, icon) VALUES (?, ?)', [name, icon || '✨'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, icon });
    });
});

router.delete('/:id', auth, (req, res) => {
    const catId = req.params.id;
    db.query('UPDATE expense SET category_id = 8 WHERE category_id = ?', [catId], (err1) => {
        db.query('DELETE FROM category WHERE category_id = ?', [catId], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "deleted" });
        });
    });
});
module.exports = router;