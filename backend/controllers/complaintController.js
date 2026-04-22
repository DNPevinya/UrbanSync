const pool = require('../config/db');

exports.submitComplaint = async (req, res) => {
    try {
        const { 
            user_id, 
            category, 
            title, 
            description, 
            location_text, 
            latitude, 
            longitude 
        } = req.body;

        const image_url = req.file ? `/uploads/complaints/${req.file.filename}` : null;

        const query = `
            INSERT INTO complaints 
            (user_id, category, title, description, location_text, latitude, longitude, status, image_url, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())
        `;

        const [result] = await pool.execute(query, [
            user_id, category, title, description, location_text, latitude, longitude, image_url
        ]);

        res.status(201).json({ 
            success: true, 
            message: 'Complaint submitted successfully!',
            complaintId: result.insertId 
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: 'Failed to save complaint' });
    }
};