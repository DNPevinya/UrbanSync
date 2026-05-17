const express = require('express');
const router = express.Router();
const db = require('./../db'); 

//  Fetch Categories for the dropdown
router.get('/categories', async (req, res) => {
    try {
        const [results] = await db.query('SELECT category_id, name FROM categories ORDER BY name ASC');
        res.json({ success: true, data: results });
    } catch (err) {
        console.error("Fetch Categories Error:", err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
});

//  Fetch Departments for the dropdown
router.get('/departments-list', async (req, res) => {
    try {
        const [results] = await db.query('SELECT department_id, name FROM departments ORDER BY name ASC');
        res.json({ success: true, data: results });
    } catch (err) {
        console.error("Fetch Departments Error:", err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
});

//  Add a new specific Complaint Issue 
router.post('/issues', async (req, res) => {
    try {
        const { category_id, department_id, issue_name } = req.body;
        const query = 'INSERT INTO complaint_issues (category_id, department_id, issue_name) VALUES (?, ?, ?)';
        await db.query(query, [category_id, department_id, issue_name]);
        res.json({ success: true, message: 'Issue Added Successfully!' });
    } catch (err) {
        console.error("Add Issue Error:", err);
        res.status(500).json({ success: false, message: 'Failed to add issue' });
    }
});

//  Add a new Location (District & Division)
router.post('/locations', async (req, res) => {
    try {
        const { district, division } = req.body;

        const [existingDistricts] = await db.query('SELECT district_id FROM districts WHERE LOWER(name) = LOWER(?)', [district]);
        let targetDistrictId;
        
        if (existingDistricts.length > 0) {
            targetDistrictId = existingDistricts[0].district_id;
        } else {
            const [newDistResult] = await db.query('INSERT INTO districts (name) VALUES (?)', [district]);
            targetDistrictId = newDistResult.insertId;
        }

        await db.query('INSERT INTO divisions (name, district_id) VALUES (?, ?)', [division, targetDistrictId]);
        res.json({ success: true, message: 'Location Added!' });
    } catch (err) {
        console.error("Add Location Error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;