// 1. MODULE IMPORTS
const express = require('express');
const router = express.Router();
const db = require('./../db'); 
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// 2. CONFIGURATION & MIDDLEWARE
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 3. API ROUTES
router.get('/locations', async (req, res) => {
    try {
        const query = `
            SELECT d.name AS district_name, divi.name AS division_name 
            FROM districts d
            JOIN divisions divi ON d.district_id = divi.district_id
            ORDER BY d.name, divi.name
        `;
        const [rows] = await db.query(query);

        const locationData = {};
        rows.forEach(row => {
            if (!locationData[row.district_name]) {
                locationData[row.district_name] = [];
            }
            locationData[row.district_name].push(row.division_name);
        });

        res.status(200).json({ success: true, data: locationData });
    } catch (error) {
        console.error("Fetch Locations Error:", error);
        res.status(500).json({ success: false, message: "Failed to load locations." });
    }
});

router.post('/register', async (req, res) => {
    const { fullName, phone, email, district, division, password, nic, division_id, divisionId } = req.body;

    try {
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "This email is already registered." });
        }

        const [existingNic] = await db.query("SELECT * FROM citizens WHERE nic = ?", [nic]);
        if (existingNic.length > 0) {
            return res.status(409).json({ message: "An account with this NIC already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userSql = `INSERT INTO users (email, password, role) VALUES (?, ?, 'citizen')`;
        const [userResult] = await db.query(userSql, [email, hashedPassword]);
        const newUserId = userResult.insertId; 

        // --- THE CATCH-ALL FIX ---
        let final_division_id = division_id || divisionId || req.body.division_id || req.body.divisionId || null;
        let divisionSearchText = division || req.body.location || req.body.city || req.body.selectedDivision || null;
        
        if (!final_division_id && divisionSearchText) {
            const [divResults] = await db.query(`
                SELECT division_id 
                FROM divisions 
                WHERE LOWER(name) LIKE CONCAT('%', LOWER(?), '%') 
                LIMIT 1
            `, [divisionSearchText.trim()]);
            
            if (divResults.length > 0) {
                final_division_id = divResults[0].division_id;
            }
        }

        const citizenSql = `INSERT INTO citizens (user_id, fullName, phone, nic, status, division_id) VALUES (?, ?, ?, ?, 'Active', ?)`;
        await db.query(citizenSql, [newUserId, fullName, phone, nic, final_division_id]);

        res.status(201).json({ message: "Citizen registered successfully!" });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

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
            // FIXED: Added d.district_id so the frontend has all raw IDs if needed
            const citizenQuery = `
                SELECT c.*, d.name AS division, d.district_id, dist.name AS district
                FROM citizens c 
                LEFT JOIN divisions d ON c.division_id = d.division_id 
                LEFT JOIN districts dist ON d.district_id = dist.district_id
                WHERE c.user_id = ?
            `;
            const [citizens] = await db.query(citizenQuery, [user.user_id]);
            
            if (citizens.length > 0) {
                if (citizens[0].status === 'Suspended') {
                    return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
                }

                userProfile.fullName = citizens[0].fullName;
                userProfile.phone = citizens[0].phone;
                userProfile.district = citizens[0].district;
                userProfile.division = citizens[0].division; 
                userProfile.division_id = citizens[0].division_id; // <--- NEW: Raw ID for frontend
                userProfile.district_id = citizens[0].district_id; // <--- NEW: Raw ID for frontend
                userProfile.profilePicture = citizens[0].profilePicture || null;
                userProfile.nic = citizens[0].nic;

                let cleanPhone = citizens[0].phone.toString().replace(/\s+/g, '').replace(/^0+/, '');
                let formattedPhone = `+94${cleanPhone}`;

                const secret = process.env.JWT_SECRET || 'urbansync_default_secret';
                const token = jwt.sign(
                    { id: userProfile.id, email: userProfile.email, role: userProfile.role },
                    secret,
                    { expiresIn: '24h' }
                );

                return res.status(200).json({
                    status: "2FA_REQUIRED",
                    message: "Password verified. Proceed to OTP.",
                    phone: formattedPhone,
                    userProfile: userProfile,
                    token: token
                });
            }
        }
        else if (user.role === 'officer') {
            const officerQuery = `
                SELECT o.full_name, o.authority_id, o.status, a.name as authority_name, 
                       dept.name as dept_type
                FROM officers o
                LEFT JOIN authorities a ON o.authority_id = a.authority_id
                LEFT JOIN departments dept ON a.department_id = dept.department_id
                WHERE o.user_id = ?
            `;
            const [officers] = await db.query(officerQuery, [user.user_id]);
            
            if (officers.length > 0) {
                if (officers[0].status === 'Inactive') {
                    return res.status(403).json({ message: "Your account has been deactivated. Please contact the Super Admin." });
                }

                userProfile.fullName = officers[0].full_name;
                userProfile.authority_id = officers[0].authority_id;
                userProfile.authorityName = officers[0].authority_name; 
                userProfile.deptType = officers[0].dept_type; 
            }
        }

        const secret = process.env.JWT_SECRET || 'urbansync_default_secret';
        const token = jwt.sign(
            { id: userProfile.id, email: userProfile.email, role: userProfile.role },
            secret,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: "Login successful!", user: userProfile, token: token });

    } catch (error) {
        console.error("Login DB Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.put('/update-profile', upload.single('profileImage'), async (req, res) => {
    const { email, fullName, phone, district, division, currentPassword, newPassword, deleteImage, division_id, divisionId } = req.body;

    try {
        const fetchSql = `
            SELECT u.*, c.profilePicture, c.nic 
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
            if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });
            
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

        // --- THE CATCH-ALL FIX FOR UPDATES ---
        let final_div_id = division_id || divisionId || req.body.division_id || req.body.divisionId || null;
        let divisionSearchText = division || req.body.location || req.body.city || req.body.selectedDivision || null;
        
        if (!final_div_id && divisionSearchText) {
            const [divResults] = await db.query(`
                SELECT division_id 
                FROM divisions 
                WHERE LOWER(name) LIKE CONCAT('%', LOWER(?), '%') 
                LIMIT 1
            `, [divisionSearchText.trim()]);
            
            if (divResults.length > 0) {
                final_div_id = divResults[0].division_id;
            }
        }

        const updateCitizenSql = `
            UPDATE citizens 
            SET fullName = ?, phone = ?, profilePicture = ?, division_id = ?
            WHERE user_id = ?
        `;
        
        await db.query(updateCitizenSql, [fullName, phone, profilePicPath, final_div_id, user.user_id]);

        res.status(200).json({ message: "Profile updated successfully!", profilePicture: profilePicPath });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Failed to update profile details." });
    }
});

router.get('/notifications/:userId', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.params.userId]);
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

router.post('/update-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        const isBcryptMatch = await bcrypt.compare(currentPassword, user.password);
        const isPlainTextMatch = currentPassword === user.password; 
        
        if (!isBcryptMatch && !isPlainTextMatch) {
            return res.status(400).json({ 
                success: false, 
                message: "Authentication Failed: The current password you entered does not match our records." 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        res.json({ success: true, message: "Security credentials updated successfully!" });

    } catch (error) {
        res.status(500).json({ message: "Internal Server error" });
    }
});

// 4. ADMIN ROUTES
router.get('/admin/citizens', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.citizen_id, 
                c.fullName, 
                u.email, 
                c.phone, 
                c.nic, 
                dist.name AS district, 
                divi.name AS division, 
                c.status,
                u.created_at 
            FROM citizens c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN divisions divi ON c.division_id = divi.division_id
            LEFT JOIN districts dist ON divi.district_id = dist.district_id
            WHERE u.role = 'citizen'
            ORDER BY u.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Fetch Citizens Error:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch citizen list." });
    }
});

router.patch('/admin/suspend-citizen/:id', authMiddleware, async (req, res) => {
    const { status } = req.body; 
    try {
        await db.query('UPDATE citizens SET status = ? WHERE citizen_id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Account status updated to ${status}` });
    } catch (err) {
        console.error("Suspension Error:", err.message);
        res.status(500).json({ success: false, message: "Failed to update citizen status." });
    }
});

router.get('/admin/officers-list', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id, u.email, u.created_at,
        o.officer_id, o.full_name, o.employee_id_code, o.status,
        a.name AS authority_name, a.authority_id
      FROM users u
      JOIN officers o ON u.user_id = o.user_id
      LEFT JOIN authorities a ON o.authority_id = a.authority_id
      WHERE u.role = 'officer'
      ORDER BY u.created_at DESC
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch Officers Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch officers." });
  }
});

router.get('/admin/next-employee-id/:authorityId', authMiddleware, async (req, res) => {
  try {
    const [authRows] = await db.query('SELECT authority_code FROM authorities WHERE authority_id = ?', [req.params.authorityId]);
    if (authRows.length === 0) return res.json({ employee_id: 'EMP-001' }); 
    const prefix = authRows[0].authority_code || 'GEN';
    const [countRows] = await db.query('SELECT COUNT(*) as count FROM officers WHERE authority_id = ?', [req.params.authorityId]);
    const nextNum = countRows[0].count + 1;
    const paddedNum = nextNum.toString().padStart(3, '0');
    res.json({ success: true, employee_id: `EMP-${prefix}-${paddedNum}` });
  } catch (err) {
    console.error("ID Gen Error:", err.message);
    res.status(500).json({ success: false });
  }
});

router.post('/admin/add-officer', authMiddleware, async (req, res) => {
  const { full_name, email, authority_id, employee_id_code } = req.body;
  const tempPassword = crypto.randomBytes(4).toString('hex'); 

  try {
    const [existing] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const [userResult] = await db.query(
      `INSERT INTO users (email, password, role) VALUES (?, ?, 'officer')`, 
      [email, hashedPassword]
    );
    const newUserId = userResult.insertId;

    await db.query(
      `INSERT INTO officers (user_id, authority_id, full_name, employee_id_code, status) VALUES (?, ?, ?, ?, 'Active')`,
      [newUserId, authority_id, full_name, employee_id_code]
    );

    res.status(201).json({ success: true, message: "Officer added!", tempPassword: tempPassword });
  } catch (err) {
    console.error("Add Officer Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create officer." });
  }
});

router.put('/admin/update-officer/:userId', authMiddleware, async (req, res) => {
  const { full_name, email, authority_id, status } = req.body;
  const userId = req.params.userId;

  try {
    await db.query(`UPDATE users SET email = ? WHERE user_id = ?`, [email, userId]);
    await db.query(
      `UPDATE officers SET full_name = ?, authority_id = ?, status = ? WHERE user_id = ?`,
      [full_name, authority_id, status, userId]
    );
    res.json({ success: true, message: "Officer updated successfully!" });
  } catch (err) {
    console.error("Update Officer Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update officer." });
  }
});

router.delete('/admin/delete-officer/:userId', authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  try {
    await db.query(`DELETE FROM officers WHERE user_id = ?`, [userId]);
    await db.query(`DELETE FROM users WHERE user_id = ?`, [userId]);
    res.json({ success: true, message: "Officer deleted." });
  } catch (err) {
    console.error("Delete Officer Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete officer." });
  }
});

router.post('/forgot-password-init', async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT user_id, role FROM users WHERE email = ?', [email]);
        
        if (users.length === 0 || users[0].role !== 'citizen') {
            return res.status(404).json({ message: "No citizen account found with this email." });
        }

        const [citizens] = await db.query('SELECT phone FROM citizens WHERE user_id = ?', [users[0].user_id]);
        
        if (citizens.length === 0) {
            return res.status(404).json({ message: "Phone number not found for this account." });
        }

        let cleanPhone = citizens[0].phone.toString().replace(/\s+/g, '').replace(/^0+/, '');
        let formattedPhone = `+94${cleanPhone}`;

        res.status(200).json({ success: true, phone: formattedPhone });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        
        res.status(200).json({ success: true, message: "Password reset successfully!" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;