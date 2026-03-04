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

//  REGISTRATION 
router.post('/register', async (req, res) => {
    const { fullName, phone, email, district, division, password } = req.body;

    try {
        // 1. Check if email exists in the users table
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "This email is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Insert into 'users' table 
        const userSql = `INSERT INTO users (email, password, role) VALUES (?, ?, 'citizen')`;
        const [userResult] = await db.query(userSql, [email, hashedPassword]);
        
        const newUserId = userResult.insertId; 

        // 3. Insert into 'citizens' table 
        const citizenSql = `INSERT INTO citizens (user_id, fullName, phone, district, division) 
                            VALUES (?, ?, ?, ?, ?)`;
        
        await db.query(citizenSql, [newUserId, fullName, phone, district, division]);

        res.status(201).json({ message: "Citizen registered successfully!" });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- LOGIN (JOINING USERS AND CITIZENS) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Use an INNER JOIN to get the login credentials and profile details in one go
        const loginQuery = `
            SELECT u.user_id, u.email, u.password, u.role, 
                   c.fullName, c.phone, c.district, c.division, c.profilePicture
            FROM users u
            JOIN citizens c ON u.user_id = c.user_id
            WHERE u.email = ?
        `;

        const [users] = await db.query(loginQuery, [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.status(200).json({ 
            message: "Login successful!",
            user: {
                id: user.user_id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                district: user.district,
                division: user.division,
                profilePicture: user.profilePicture || null 
            }
        });

    } catch (error) {
        console.error("Login DB Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- UPDATE PROFILE (UPDATING CITIZENS TABLE) ---
router.put('/update-profile', upload.single('profileImage'), async (req, res) => {
    const { email, fullName, phone, district, division, currentPassword, newPassword, deleteImage } = req.body;

    try {
        // 1. Fetch data from both tables to verify
        const fetchSql = `
            SELECT u.*, c.profilePicture 
            FROM users u 
            JOIN citizens c ON u.user_id = c.user_id 
            WHERE u.email = ?
        `;
        const [users] = await db.query(fetchSql, [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found." });
        
        const user = users[0];

        // 2. Password Change Logic (Updates 'users' table)
        let finalPassword = user.password;
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password required." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect current password." });
            }
            const salt = await bcrypt.genSalt(10);
            finalPassword = await bcrypt.hash(newPassword, salt);
            
            // Update the users table specifically for the password
            await db.query("UPDATE users SET password = ? WHERE user_id = ?", [finalPassword, user.user_id]);
        }

        // 3. Image Logic
        let profilePicPath = user.profilePicture; 
        if (deleteImage === 'true') {
            profilePicPath = null;
        } else if (req.file) {
            profilePicPath = `/uploads/${req.file.filename}`;
        }

        // 4. Update 'citizens' table for profile info
        const updateCitizenSql = `
            UPDATE citizens 
            SET fullName = ?, phone = ?, district = ?, division = ?, profilePicture = ?
            WHERE user_id = ?
        `;
        
        await db.query(updateCitizenSql, [fullName, phone, district, division, profilePicPath, user.user_id]);

        res.status(200).json({ 
            message: "Profile updated successfully!",
            profilePicture: profilePicPath 
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Failed to update profile details." });
    }
});

module.exports = router;