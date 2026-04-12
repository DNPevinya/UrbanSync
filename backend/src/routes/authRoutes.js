const express = require('express');
const router = express.Router();
const db = require('./../db'); 
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'), 
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// =========================================================================
// 1. REGISTRATION (CITIZENS ONLY)
// =========================================================================
router.post('/register', async (req, res) => {
    const { fullName, phone, email, district, division, password } = req.body;

    try {
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "This email is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userSql = `INSERT INTO users (email, password, role) VALUES (?, ?, 'citizen')`;
        const [userResult] = await db.query(userSql, [email, hashedPassword]);
        
        const newUserId = userResult.insertId; 

        const citizenSql = `INSERT INTO citizens (user_id, fullName, phone, district, division) VALUES (?, ?, ?, ?, ?)`;
        await db.query(citizenSql, [newUserId, fullName, phone, district, division]);

        res.status(201).json({ message: "Citizen registered successfully!" });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// =========================================================================
// 2. SMART LOGIN (CITIZENS, OFFICERS, ADMINS)
// =========================================================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = users[0];

        const isBcryptMatch = await bcrypt.compare(password, user.password);
        const isPlainTextMatch = password === user.password; 
        
        if (!isBcryptMatch && !isPlainTextMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        let userProfile = { id: user.user_id, email: user.email, role: user.role };

        if (user.role === 'citizen') {
            const [citizens] = await db.query(`SELECT * FROM citizens WHERE user_id = ?`, [user.user_id]);
            if (citizens.length > 0) {
                userProfile.fullName = citizens[0].fullName;
                userProfile.phone = citizens[0].phone;
                userProfile.district = citizens[0].district;
                userProfile.division = citizens[0].division;
                userProfile.profilePicture = citizens[0].profilePicture || null;
            }
        } 
        else if (user.role === 'officer') {
            // UPDATED: Use a JOIN to grab the Authority Name alongside the Officer data
            const officerQuery = `
                SELECT o.full_name, o.authority_id, a.name as authority_name, a.department as dept_type
                FROM officers o
                JOIN authorities a ON o.authority_id = a.authority_id
                WHERE o.user_id = ?
            `;
            const [officers] = await db.query(officerQuery, [user.user_id]);
            
            if (officers.length > 0) {
                userProfile.fullName = officers[0].full_name;
                userProfile.authority_id = officers[0].authority_id;
                userProfile.authorityName = officers[0].authority_name; // The department name!
                userProfile.deptType = officers[0].dept_type; 
            }
        }

        res.status(200).json({ message: "Login successful!", user: userProfile });

    } catch (error) {
        console.error("Login DB Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// =========================================================================
// 3. UPDATE PROFILE (CITIZENS ONLY)
// =========================================================================
router.put('/update-profile', upload.single('profileImage'), async (req, res) => {
    const { email, fullName, phone, district, division, currentPassword, newPassword, deleteImage } = req.body;

    try {
        const fetchSql = `
            SELECT u.*, c.profilePicture 
            FROM users u 
            JOIN citizens c ON u.user_id = c.user_id 
            WHERE u.email = ?
        `;
        const [users] = await db.query(fetchSql, [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found." });
        
        const user = users[0];

        let finalPassword = user.password;
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) return res.status(400).json({ message: "Current password required." });
            
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: "Incorrect current password." });
            
            const salt = await bcrypt.genSalt(10);
            finalPassword = await bcrypt.hash(newPassword, salt);
            
            await db.query("UPDATE users SET password = ? WHERE user_id = ?", [finalPassword, user.user_id]);
        }

        let profilePicPath = user.profilePicture; 
        if (deleteImage === 'true') {
            profilePicPath = null;
        } else if (req.file) {
            profilePicPath = `/uploads/${req.file.filename}`;
        }

        const updateCitizenSql = `
            UPDATE citizens 
            SET fullName = ?, phone = ?, district = ?, division = ?, profilePicture = ?
            WHERE user_id = ?
        `;
        
        await db.query(updateCitizenSql, [fullName, phone, district, division, profilePicPath, user.user_id]);

        res.status(200).json({ message: "Profile updated successfully!", profilePicture: profilePicPath });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Failed to update profile details." });
    }
});


// GET ALL NOTIFICATIONS FOR A SPECIFIC CITIZEN
router.get('/notifications/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", 
      [req.params.userId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
});

router.patch('/notifications/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. UPDATE PASSWORD (OFFICERS & ADMINS)
// =========================================================================
router.post('/update-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        // 🎯 THE HYBRID CHECK
        const isBcryptMatch = await bcrypt.compare(currentPassword, user.password);
        const isPlainTextMatch = currentPassword === user.password; // For your seeded data
        
        if (!isBcryptMatch && !isPlainTextMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication Failed: The current password you entered does not match our records." 
            });
        }

        // Hash the new one so it's secure from now on
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        res.json({ success: true, message: "Security credentials updated successfully!" });

    } catch (error) {
        res.status(500).json({ message: "Internal Server error" });
    }
});

module.exports = router;