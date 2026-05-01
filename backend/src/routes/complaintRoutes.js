// 1. MODULE IMPORTS
const express = require('express');
const router = express.Router();
const db = require('./../db'); 
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

// 2. HELPER VARIABLES
const issueToDepartmentMap = {
  "Garbage Collection Delay": "Local Council",
  "Illegal Waste Dumping": "Local Council",
  "Street Cleaning Issue": "Local Council",
  "Drainage Blockage / Flooding": "Local Council",
  "Broken Road / Pothole": "Local Council",
  "Damaged Footpath": "Local Council",
  "Traffic Signal Malfunction": "Local Council",
  "Public Park Maintenance Issue": "Local Council",
  "Public Space Maintenance Issue": "Local Council",
  "Dengue Mosquito Breeding Site": "Public Health Inspector",
  "Food Hygiene Complaint": "Public Health Inspector",
  "Unsanitary Business Premises": "Public Health Inspector",
  "Public Sanitation Issue": "Public Health Inspector",
  "Waste Causing Health Hazard": "Public Health Inspector",
  "Noise Complaint": "Police",
  "Parking Violation": "Police",
  "Vandalism": "Police",
  "Suspicious Activity": "Police",
  "Public Disorder": "Police",
  "Water Supply Interruption": "Water Board",
  "Low Water Pressure": "Water Board",
  "Pipe Leak": "Water Board",
  "Water Contamination": "Water Board",
  "Sewer Line Blockage": "Water Board",
  "Illegal Tree Cutting": "Environmental Authority",
  "Air Pollution": "Environmental Authority",
  "Water Body Pollution (River/Canal)": "Environmental Authority",
  "Industrial Waste Disposal": "Environmental Authority",
  "Environmental Damage Complaint": "Environmental Authority",
  "Unauthorized Construction": "Urban Development Authority",
  "Building Code Violation": "Urban Development Authority",
  "Land Use Violation": "Urban Development Authority",
  "Unsafe Construction Site": "Urban Development Authority",
  "Power Outage": "Electricity Board",
  "Streetlight Breakdown": "Electricity Board",
  "Fallen Electrical Line": "Electricity Board",
  "Unsafe Electrical Connection": "Electricity Board",
  "Transformer Issue": "Electricity Board",
  "Bus Stop Maintenance Issue": "Transport Authority",
  "Unsafe Bus Operation": "Transport Authority",
  "Route Mismanagement": "Transport Authority",
  "Public Transport Safety Concern": "Transport Authority",
  "Resident Verification Issue": "Grama Niladhari",
  "Local Documentation Concern": "Grama Niladhari",
  "Community-Level Dispute (Non-Criminal)": "Grama Niladhari"
};

// 3. HELPER FUNCTIONS
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

// 4. CONFIGURATION & MIDDLEWARE
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage: storage });

// 5. API ROUTES
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as count FROM complaints');
    const [pending] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'PENDING'");
    const [resolved] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'RESOLVED'");
    const [inProgress] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN PROGRESS'");

    res.json({ 
      success: true, 
      data: { total: total[0].count, pending: pending[0].count, resolved: resolved[0].count, active: inProgress[0].count } 
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ success: false, message: "Stats sync failed" });
  }
});

router.get('/admin/performance', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT a.name, a.department, COUNT(c.complaint_id) as total_cases
      FROM authorities a
      LEFT JOIN complaints c ON a.authority_id = c.authority_id
      GROUP BY a.authority_id
      ORDER BY total_cases DESC
      LIMIT 5
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Admin Performance Error:", err);
    res.status(500).json({ success: false, message: "Performance data sync failed" });
  }
});

router.get('/admin/all-recent', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*, 
        a.name AS authority_name, 
        cit.fullName AS citizen_name
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Admin Recent Activity Error:", err);
    res.status(500).json({ success: false, message: "Master list sync failed" });
  }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT c.*, a.name as authority_name, a.region 
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      ORDER BY c.created_at DESC
    `;
    const [complaints] = await db.query(sql);
    res.status(200).json({ success: true, data: complaints });
  } catch (error) { 
    res.status(500).json({ success: false, message: "Error fetching complaints" }); 
  }
});

router.get('/admin/authorities', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT authority_id, name FROM authorities ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching authorities" });
  }
});

router.get('/admin/officers/:authorityId', authMiddleware, async (req, res) => {
  try {
    const sql = `SELECT user_id, full_name AS fullName FROM officers WHERE authority_id = ?`;
    const [rows] = await db.query(sql, [req.params.authorityId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Officer Fetch Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching officers" });
  }
});

router.patch('/reassign/:id', async (req, res) => {
  const { new_authority_id, reason } = req.body;
  const complaintId = req.params.id;

  try {
    await db.query(`UPDATE complaints SET authority_id = ?, status = 'PENDING' WHERE complaint_id = ?`, [new_authority_id, complaintId]);
    res.status(200).json({ success: true, message: "Reassigned successfully!" });
  } catch (error) { 
    console.error("Reassign error:", error);
    res.status(500).json({ success: false, message: "Failed to reassign." }); 
  }
});

router.get('/admin/authorities-list', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.authority_id, a.name, a.department, a.region, 
        COUNT(o.officer_id) as officer_count
      FROM authorities a
      LEFT JOIN officers o ON a.authority_id = o.authority_id AND UPPER(o.status) = 'ACTIVE'
      GROUP BY a.authority_id
      ORDER BY a.authority_id DESC
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch Authorities Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch authorities." });
  }
});

router.post('/admin/add-authority', authMiddleware, async (req, res) => {
  const { name, department, region } = req.body;
  try {
    const query = `INSERT INTO authorities (name, department, region) VALUES (?, ?, ?)`;
    await db.query(query, [name, department, region]);
    res.status(201).json({ success: true, message: "Authority created successfully!" });
  } catch (err) {
    console.error("Add Authority Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create authority." });
  }
});

router.put('/admin/update-authority/:id', authMiddleware, async (req, res) => {
  const { name, department, region } = req.body;
  try {
    const query = `UPDATE authorities SET name = ?, department = ?, region = ? WHERE authority_id = ?`;
    await db.query(query, [name, department, region, req.params.id]);
    res.json({ success: true, message: "Authority updated!" });
  } catch (err) {
    console.error("Update Auth Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update." });
  }
});

router.delete('/admin/delete-authority/:id', authMiddleware, async (req, res) => {
  const { fallback_authority_id } = req.body;
  const authIdToDelete = req.params.id;

  try {
    if (fallback_authority_id) {
      await db.query(`UPDATE complaints SET authority_id = ? WHERE authority_id = ?`, [fallback_authority_id, authIdToDelete]);
    }
    await db.query(`DELETE FROM authorities WHERE authority_id = ?`, [authIdToDelete]);
    
    res.json({ success: true, message: "Authority deleted and complaints reassigned!" });
  } catch (err) {
    console.error("Delete Auth Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
});

router.get('/admin/departments-list', authMiddleware, async (req, res) => {
  try {
    const query = `SELECT DISTINCT department FROM authorities WHERE department IS NOT NULL AND department != '' ORDER BY department ASC`;
    const [rows] = await db.query(query);
    const departments = rows.map(row => row.department);
    res.json({ success: true, data: departments });
  } catch (err) {
    console.error("Fetch Departments Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch departments." });
  }
});

router.get('/admin/regions-list', authMiddleware, async (req, res) => {
  try {
    const query = `SELECT DISTINCT region FROM authorities WHERE region IS NOT NULL AND region != '' ORDER BY region ASC`;
    const [rows] = await db.query(query);
    const regions = rows.map(row => row.region);
    res.json({ success: true, data: regions });
  } catch (err) {
    console.error("Fetch Regions Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch regions." });
  }
});

router.delete('/admin/delete-complaint/:id', authMiddleware, async (req, res) => {
  const complaintId = req.params.id;
  try {
    await db.query(`DELETE FROM complaints WHERE complaint_id = ?`, [complaintId]);
    res.json({ success: true, message: "Complaint permanently deleted." });
  } catch (err) {
    console.error("Delete Complaint Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete complaint." });
  }
});

router.get('/admin/analytics', authMiddleware, async (req, res) => {
  try {
    const [kpiRows] = await db.query(`
      SELECT 
        COUNT(*) as total_complaints,
        COALESCE(SUM(CASE WHEN UPPER(status) IN ('PENDING', 'IN PROGRESS') THEN 1 ELSE 0 END), 0) as active_complaints,
        COALESCE(SUM(CASE WHEN UPPER(status) = 'RESOLVED' THEN 1 ELSE 0 END), 0) as resolved_complaints,
        COALESCE(AVG(CASE WHEN UPPER(status) = 'RESOLVED' THEN DATEDIFF(resolved_at, created_at) END), 0) as avg_resolution_days
      FROM complaints
    `);
    
    const kpis = kpiRows[0];
    const total = kpis.total_complaints || 0;
    const resolved = kpis.resolved_complaints || 0;
    const completionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    const [trendRows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month_name,
        COUNT(*) as received,
        COALESCE(SUM(CASE WHEN UPPER(status) = 'RESOLVED' THEN 1 ELSE 0 END), 0) as resolved
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at), month_name
      ORDER BY YEAR(created_at), MONTH(created_at) ASC
    `);

    const [districtRows] = await db.query(`
      SELECT 
        COALESCE(a.region, 'Unassigned') as district,
        COUNT(c.complaint_id) as count
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      GROUP BY a.region
      ORDER BY count DESC
      LIMIT 5
    `);

    const [performanceRows] = await db.query(`
      SELECT 
        a.name as authority_name,
        COUNT(c.complaint_id) as total_handled,
        COALESCE(SUM(CASE WHEN UPPER(c.status) = 'RESOLVED' THEN 1 ELSE 0 END), 0) as resolved_count
      FROM complaints c
      JOIN authorities a ON c.authority_id = a.authority_id
      GROUP BY a.authority_id
      ORDER BY total_handled DESC
      LIMIT 5
    `);

    const authorityPerformance = performanceRows.map(auth => {
      const rate = auth.total_handled > 0 ? Math.round((auth.resolved_count / auth.total_handled) * 100) : 0;
      return { ...auth, rate };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          active: kpis.active_complaints || 0,
          completionRate: completionRate,
          avgResolution: kpis.avg_resolution_days ? parseFloat(kpis.avg_resolution_days).toFixed(1) : "0.0",
          satisfaction: "4.7" 
        },
        trends: trendRows, 
        districts: districtRows,
        authorities: authorityPerformance
      }
    });

  } catch (err) {
    console.error("Analytics Error:", err.message); 
    res.status(500).json({ success: false, message: "Failed to load analytics." });
  }
});

router.post('/submit', upload.array('images', 3), async (req, res) => {
  const { user_id, category, title, description, location_text, latitude, longitude } = req.body;
  let image_url = null;
  if (req.files && req.files.length > 0) image_url = req.files.map(file => `/uploads/${file.filename}`).join(',');

  try {
    if (latitude && longitude) {
        const duplicateCheckQuery = `
            SELECT complaint_id 
            FROM complaints 
            WHERE category = ? 
            AND UPPER(status) NOT IN ('RESOLVED', 'REJECTED', 'CANCELLED')
            AND latitude IS NOT NULL AND longitude IS NOT NULL
            AND ST_Distance_Sphere(point(longitude, latitude), point(?, ?)) <= 50
            LIMIT 1
        `;
        const [existingComplaints] = await db.query(duplicateCheckQuery, [category, longitude, latitude]);

        if (existingComplaints.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An issue of this exact type has already been reported at this location. Our team is aware and it is currently in our system."
            });
        }
    }

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
    res.status(500).json({ success: false, message: "Failed to save complaint." });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const [complaints] = await db.query(`SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC`, [req.params.userId]);
    res.status(200).json({ success: true, data: complaints });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch complaints." }); }
});

router.get('/stats/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      const [total] = await db.query('SELECT COUNT(*) as count FROM complaints WHERE user_id = ?', [userId]);
      const [pending] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Pending'", [userId]);
      const [resolved] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Resolved'", [userId]);
      res.json({ total: total[0].count, pending: pending[0].count, resolved: resolved[0].count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/authority/:authorityId', async (req, res) => {
  try {
    const { authorityId } = req.params;
    const query = `
      SELECT 
        c.*, 
        cit.fullName AS citizen_name, 
        cit.phone AS citizen_phone
      FROM complaints c
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      WHERE c.authority_id = ?
      ORDER BY c.created_at DESC
    `;
    const [rows] = await db.query(query, [authorityId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching joined data" });
  }
});

router.patch('/officer/reject-complaint/:id', async (req, res) => {
  const complaintId = req.params.id;
  const { reason, officerName } = req.body; 

  try {
    const rejectionNote = `\n[ESCALATED BY ${officerName || 'OFFICER'}]: ${reason}`;

    const query = `
      UPDATE complaints 
      SET 
        status = 'REJECTED',
        admin_notes = CONCAT(IFNULL(admin_notes, ''), ?)
      WHERE complaint_id = ?
    `;
    
    await db.query(query, [rejectionNote, complaintId]);
    
    res.json({ success: true, message: "Complaint escalated to Super Admin." });
  } catch (err) {
    console.error("Rejection Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to reject complaint." });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*, 
        a.name as authority_name,
        cit.fullName as citizen_name,
        cit.phone as citizen_phone,
        u.email as citizen_email
      FROM complaints c 
      LEFT JOIN authorities a ON c.authority_id = a.authority_id 
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      LEFT JOIN users u ON c.user_id = u.user_id 
      WHERE c.complaint_id = ?
    `;
    const [complaint] = await db.query(sql, [req.params.id]);
    
    if (complaint.length > 0) {
      res.status(200).json({ success: true, data: complaint[0] });
    } else {
      res.status(404).json({ success: false, message: "Not found" });
    }
  } catch (error) { 
    console.error("Fetch Complaint Route Error:", error.message);
    res.status(500).json({ success: false, message: "Error fetching complaint." }); 
  }
});

router.patch('/update-status/:id', async (req, res) => {
  const { status } = req.body;
  const complaintId = req.params.id;

  try {
    const [complaintData] = await db.query("SELECT user_id, title FROM complaints WHERE complaint_id = ?", [complaintId]);
    if (complaintData.length === 0) return res.status(404).json({ success: false, message: "Not found" });

    const { user_id, title } = complaintData[0];
    await db.query(`
  UPDATE complaints 
  SET 
    status = ?, 
    resolved_at = CASE WHEN UPPER(?) = 'RESOLVED' THEN NOW() ELSE resolved_at END 
  WHERE complaint_id = ?
`, [status, status, complaintId]);
    
    const notificationMsg = `Update on "${title}": Your complaint is now ${status.toUpperCase()}.`;
    await db.query(`INSERT INTO notifications (user_id, complaint_id, message) VALUES (?, ?, ?)`, [user_id, complaintId, notificationMsg]);

    res.status(200).json({ success: true, message: "Status updated and citizen notified!" });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to update status." }); }
});

// 6. EXPORTS
module.exports = router;