const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');
const crypto = require('crypto');

const getUserId = (req) => req.user.userId || req.user.id || req.user.user_id;

router.post('/', auth, (req, res) => {
    const userId = getUserId(req);
    const { name, parent_team_id } = req.body;
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const insertTeamQuery = 'INSERT INTO teams (name, parent_team_id, invite_code) VALUES (?, ?, ?)';
    db.query(insertTeamQuery, [name, parent_team_id || null, inviteCode], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const newTeamId = result.insertId;
        const insertMemberQuery = "INSERT INTO team_members (user_id, team_id, role) VALUES (?, ?, 'admin')";
        db.query(insertMemberQuery, [userId, newTeamId], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "성공", team_id: newTeamId, invite_code: inviteCode });
        });
    });
});

router.post('/join', auth, (req, res) => {
    const userId = getUserId(req);
    const { invite_code } = req.body;

    const findTeamQuery = 'SELECT team_id FROM teams WHERE invite_code = ?';
    db.query(findTeamQuery, [invite_code], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "코드 오류" });

        const teamId = results[0].team_id;
        const joinQuery = "INSERT INTO team_members (user_id, team_id, role) VALUES (?, ?, 'member')";
        db.query(joinQuery, [userId, teamId], (err2) => {
            if (err2) {
                if (err2.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "이미 가입됨" });
                return res.status(500).json({ error: err2.message });
            }
            res.json({ message: "성공", team_id: teamId });
        });
    });
});

router.get('/my', auth, (req, res) => {
    const userId = getUserId(req);
    const query = 'SELECT t.name, t.invite_code, tm.role FROM team_members tm JOIN teams t ON tm.team_id = t.team_id WHERE tm.user_id = ? LIMIT 1';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json(null);
        res.json(results[0]);
    });
});

module.exports = router;