const express = require('express');
const router = express.Router();
const db = require('./../db'); 
const multer = require('multer');
const path = require('path');

const issueToDepartmentMap = {
  "Garbage Collection Delay": "Local Council", "Illegal Waste Dumping": "Local Council", "Street Cleaning Issue": "Local Council", "Drainage Blockage / Flooding": "Local Council", "Broken Road / Pothole": "Local Council", "Damaged Footpath": "Local Council", "Traffic Signal Malfunction": "Local Council", "Public Park Maintenance Issue": "Local Council", "Public Space Maintenance Issue": "Local Council",
  "Dengue Mosquito Breeding Site": "Public Health Inspector", "Food Hygiene Complaint": "Public Health Inspector", "Unsanitary Business Premises": "Public Health Inspector", "Public Sanitation Issue": "Public Health Inspector", "Waste Causing Health Hazard": "Public Health Inspector",
  "Noise Complaint": "Police", "Parking Violation": "Police", "Vandalism": "Police", "Suspicious Activity": "Police", "Public Disorder": "Police",
  "Water Supply Interruption": "Water Board", "Low Water Pressure": "Water Board", "Pipe Leak": "Water Board", "Water Contamination": "Water Board", "Sewer Line Blockage": "Water Board",
  "Illegal Tree Cutting": "Environmental Authority", "Air Pollution": "Environmental Authority", "Water Body Pollution (River/Canal)": "Environmental Authority", "Industrial Waste Disposal": "Environmental Authority", "Environmental Damage Complaint": "Environmental Authority",
  "Unauthorized Construction": "Urban Development Authority", "Building Code Violation": "Urban Development Authority", "Land Use Violation": "Urban Development Authority", "Unsafe Construction Site": "Urban Development Authority",
  "Power Outage": "Electricity Board", "Streetlight Breakdown": "Electricity Board", "Fallen Electrical Line": "Electricity Board", "Unsafe Electrical Connection": "Electricity Board", "Transformer Issue": "Electricity Board",
  "Bus Stop Maintenance Issue": "Transport Authority", "Unsafe Bus Operation": "Transport Authority", "Route Mismanagement": "Transport Authority", "Public Transport Safety Concern": "Transport Authority",
  "Resident Verification Issue": "Grama Niladhari", "Local Documentation Concern": "Grama Niladhari", "Community-Level Dispute (Non-Criminal)": "Grama Niladhari"
};

function extractCity(locationText) {
  if (!locationText) return 'Colombo'; 
  const text = locationText.toLowerCase();
  
  if (text.includes('kadawatha')) return 'Kadawatha';
  if (text.includes('dehiwala') || text.includes('mount lavinia')) return 'Dehiwala';
  if (text.includes('kaduwela') || text.includes('malabe')) return 'Kaduwela';
  if (text.includes('negombo')) return 'Negombo';
  if (text.includes('gampaha')) return 'Gampaha';
  
  return 'Colombo';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage: storage });

// 1. SUBMIT COMPLAINT
router.post('/submit', upload.array('images', 3), async (req, res) => {
  const { user_id, category, title, description, location_text, latitude, longitude } = req.body;
  let image_url = null;
  if (req.files && req.files.length > 0) image_url = req.files.map(file => `/uploads/${file.filename}`).join(',');

  try {
    const targetDept = issueToDepartmentMap[title] || "Local Council"; 
    const targetCity = extractCity(location_text);
    let assigned_authority_id = null;
    
    const findAuthSql = `SELECT authority_id FROM authorities WHERE department = ? AND region = ? LIMIT 1`;
    const [authResults] = await db.query(findAuthSql, [targetDept, targetCity]);

    if (authResults.length > 0) {
      assigned_authority_id = authResults[0].authority_id;
    } else {
      const fallbackDistrict = (targetCity === 'Kadawatha' || targetCity === 'Negombo') ? 'Gampaha' : 'Colombo';
      const fallbackSql = `SELECT authority_id FROM authorities WHERE department = ? AND region = ? LIMIT 1`;
      const [fallbackResults] = await db.query(fallbackSql, [targetDept, fallbackDistrict]);
      if (fallbackResults.length > 0) assigned_authority_id = fallbackResults[0].authority_id;
    }

    const insertSql = `
      INSERT INTO complaints (user_id, category, title, description, location_text, latitude, longitude, status, image_url, authority_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;
    const values = [user_id, category, title, description, location_text, latitude || null, longitude || null, image_url, assigned_authority_id];
    const [result] = await db.query(insertSql, values);

    res.status(201).json({ success: true, message: "Complaint submitted successfully!", complaint_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save complaint to database." });
  }
});

// 2. GET SINGLE USER COMPLAINTS (For Citizen App)
router.get('/user/:userId', async (req, res) => {
  try {
    const [complaints] = await db.query(`SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC`, [req.params.userId]);
    res.status(200).json({ success: true, data: complaints });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch complaints." }); }
});

// 3. GET SPECIFIC AUTHORITY COMPLAINTS (For Officer Dashboard)
router.get('/authority/:authorityId', async (req, res) => {
  try {
    const [complaints] = await db.query(`SELECT * FROM complaints WHERE authority_id = ? ORDER BY created_at DESC`, [req.params.authorityId]);
    res.status(200).json({ success: true, data: complaints });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch complaints." }); }
});

// 4. GET ALL COMPLAINTS (For Super Admin Dashboard)
router.get('/admin/all', async (req, res) => {
  try {
    const sql = `
      SELECT c.*, a.name as authority_name, a.region 
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      ORDER BY c.created_at DESC
    `;
    const [complaints] = await db.query(sql);
    res.status(200).json({ success: true, data: complaints });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch all complaints." }); }
});

// GET SINGLE COMPLAINT DETAILS (Updated with Authority Name)
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT c.*, a.name as authority_name 
      FROM complaints c 
      LEFT JOIN authorities a ON c.authority_id = a.authority_id 
      WHERE c.complaint_id = ?
    `;
    const [complaint] = await db.query(sql, [req.params.id]);
    
    if (complaint.length > 0) {
      res.status(200).json({ success: true, data: complaint[0] });
    } else {
      res.status(404).json({ success: false, message: "Complaint not found" });
    }
  } catch (error) {
    console.error("Fetch Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint details." });
  }
});

// 6. GET CITIZEN DASHBOARD STATS
router.get('/stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const [total] = await db.query('SELECT COUNT(*) as count FROM complaints WHERE user_id = ?', [userId]);
        const [pending] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Pending'", [userId]);
        const [resolved] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Resolved'", [userId]);
        res.json({ total: total[0].count, pending: pending[0].count, resolved: resolved[0].count });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;

// =========================================================================
// UPDATE COMPLAINT STATUS
// =========================================================================
router.patch('/update-status/:id', async (req, res) => {
  const { status } = req.body;
  const complaintId = req.params.id;

  try {
    // 1. Get the user_id and title of the complaint so we can personalize the message
    const [complaintData] = await db.query(
      "SELECT user_id, title FROM complaints WHERE complaint_id = ?", 
      [complaintId]
    );

    if (complaintData.length === 0) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const { user_id, title } = complaintData[0];

    // 2. Update the complaint status
    const updateSql = `UPDATE complaints SET status = ? WHERE complaint_id = ?`;
    await db.query(updateSql, [status, complaintId]);
    
    // 3. AUTO-NOTIFICATION: Create the message based on the new status
    const notificationMsg = `Update on "${title}": Your complaint is now ${status.toUpperCase()}.`;
    const notifSql = `INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`;
    await db.query(notifSql, [user_id, complaintId, notificationMsg]);

    res.status(200).json({ 
      success: true, 
      message: "Status updated and notification sent to citizen!" 
    });

  } catch (error) {
    console.error("Update Status & Notif Error:", error);
    res.status(500).json({ success: false, message: "Failed to update status." });
  }
});

// GET all complaints assigned to a specific authority
router.get('/authority/:authorityId', async (req, res) => {
  try {
    const { authorityId } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM complaints WHERE authority_id = ? AND status != 'CANCELLED' ORDER BY created_at DESC", 
      [authorityId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error fetching complaints" });
  }
});
