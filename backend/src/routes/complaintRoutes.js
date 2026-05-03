// 1. MODULE IMPORTS
const express = require('express');
const router = express.Router();
const db = require('./../db'); 
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

// 2. CONFIGURATION & MIDDLEWARE
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage: storage });

// 3. API ROUTES
router.get('/form-data', async (req, res) => {
  try {
    const query = `
      SELECT c.category_id, c.name AS category_name, i.issue_id, i.issue_name 
      FROM categories c
      LEFT JOIN complaint_issues i ON c.category_id = i.category_id
      ORDER BY c.category_id, i.issue_id
    `;
    const [rows] = await db.query(query);

    const formData = {};
    rows.forEach(row => {
      if (!formData[row.category_name]) {
        formData[row.category_name] = {
          id: row.category_id,
          issues: []
        };
      }
      if (row.issue_name) {
        formData[row.category_name].issues.push({
          id: row.issue_id,
          name: row.issue_name
        });
      }
    });

    res.status(200).json({ success: true, data: formData });
  } catch (error) {
    console.error("Fetch Form Data Error:", error);
    res.status(500).json({ success: false, message: "Failed to load complaint categories." });
  }
});

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
      SELECT a.name, d.name AS department, COUNT(c.complaint_id) as total_cases
      FROM authorities a
      LEFT JOIN departments d ON a.department_id = d.department_id
      LEFT JOIN complaints c ON a.authority_id = c.authority_id
      GROUP BY a.authority_id
      ORDER BY total_cases DESC
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
        cat.name AS category,
        divi.name AS division,
        a.name AS authority_name, 
        cit.fullName AS citizen_name
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN divisions divi ON c.division_id = divi.division_id
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
      SELECT 
        c.*, 
        cat.name AS category,
        divi.name AS division,
        a.name as authority_name, 
        auth_div.name AS region 
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN divisions divi ON c.division_id = divi.division_id
      LEFT JOIN divisions auth_div ON a.division_id = auth_div.division_id
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
        a.authority_id, a.name, a.department_id, a.division_id,
        d.name AS department, 
        divi.name AS region, 
        COUNT(o.officer_id) as officer_count
      FROM authorities a
      LEFT JOIN departments d ON a.department_id = d.department_id
      LEFT JOIN divisions divi ON a.division_id = divi.division_id
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
  const { name, department_id, division_id } = req.body;
  try {
    const query = `INSERT INTO authorities (name, department_id, division_id) VALUES (?, ?, ?)`;
    await db.query(query, [name, department_id, division_id]);
    res.status(201).json({ success: true, message: "Authority created successfully!" });
  } catch (err) {
    console.error("Add Authority Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create authority." });
  }
});

router.put('/admin/update-authority/:id', authMiddleware, async (req, res) => {
  const { name, department_id, division_id } = req.body;
  try {
    const query = `UPDATE authorities SET name = ?, department_id = ?, division_id = ? WHERE authority_id = ?`;
    await db.query(query, [name, department_id, division_id, req.params.id]);
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
    const [rows] = await db.query(`SELECT department_id, name FROM departments ORDER BY name ASC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch Departments Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch departments." });
  }
});

router.get('/admin/divisions-list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT division_id, name FROM divisions ORDER BY name ASC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch Divisions Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch divisions." });
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
        COALESCE(divi.name, 'Unassigned') as district,
        COUNT(c.complaint_id) as count
      FROM complaints c
      LEFT JOIN authorities a ON c.authority_id = a.authority_id
      LEFT JOIN divisions divi ON a.division_id = divi.division_id
      GROUP BY a.division_id
      ORDER BY count DESC
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
  const { user_id, title, description, location_text, latitude, longitude, category_id, division_id } = req.body;
  let image_url = null;
  if (req.files && req.files.length > 0) image_url = req.files.map(file => `/uploads/${file.filename}`).join(',');

  try {
    if (latitude && longitude && category_id) {
        const duplicateCheckQuery = `
            SELECT complaint_id 
            FROM complaints 
            WHERE category_id = ? 
            AND UPPER(status) NOT IN ('RESOLVED', 'REJECTED', 'CANCELLED')
            AND latitude IS NOT NULL AND longitude IS NOT NULL
            AND ST_Distance_Sphere(point(longitude, latitude), point(?, ?)) <= 50
            LIMIT 1
        `;
        const [existingComplaints] = await db.query(duplicateCheckQuery, [category_id, longitude, latitude]);

        if (existingComplaints.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An issue of this exact type has already been reported at this location. Our team is aware and it is currently in our system."
            });
        }
    }

    let targetDept = "Local Council";
    try {
        const [deptResults] = await db.query(`
            SELECT d.name AS department_name 
            FROM complaint_issues ci
            JOIN departments d ON ci.department_id = d.department_id
            WHERE ci.issue_name = ? LIMIT 1
        `, [title]);
        if (deptResults.length > 0) targetDept = deptResults[0].department_name;
    } catch (e) { console.error("Dynamic Department Lookup Failed:", e.message); }

    let targetCity = 'Colombo'; 
    let final_division_id = division_id || null; 

    if (!final_division_id && location_text) {
        const [divResults] = await db.query(`
            SELECT division_id, name 
            FROM divisions 
            WHERE LOWER(?) LIKE CONCAT('%', LOWER(name), '%') 
            LIMIT 1
        `, [location_text]);
        if (divResults.length > 0) {
            final_division_id = divResults[0].division_id;
            targetCity = divResults[0].name;
        }
    } else if (final_division_id) {
        const [divName] = await db.query(`SELECT name FROM divisions WHERE division_id = ? LIMIT 1`, [final_division_id]);
        if (divName.length > 0) targetCity = divName[0].name;
    }
    
    let assigned_authority_id = null;
    const findAuthSql = `
      SELECT a.authority_id 
      FROM authorities a
      JOIN departments d ON a.department_id = d.department_id
      JOIN divisions divi ON a.division_id = divi.division_id
      WHERE d.name = ? AND divi.name = ? LIMIT 1
    `;
    const [authResults] = await db.query(findAuthSql, [targetDept, targetCity]);

    if (authResults.length > 0) {
      assigned_authority_id = authResults[0].authority_id;
    } else {
      const fallbackDistrict = (targetCity === 'Kadawatha' || targetCity === 'Negombo') ? 'Gampaha' : 'Colombo';
      const fallbackSql = `
        SELECT a.authority_id 
        FROM authorities a
        JOIN departments d ON a.department_id = d.department_id
        JOIN divisions divi ON a.division_id = divi.division_id
        WHERE d.name = ? AND divi.name = ? LIMIT 1
      `;
      const [fallbackResults] = await db.query(fallbackSql, [targetDept, fallbackDistrict]);
      if (fallbackResults.length > 0) assigned_authority_id = fallbackResults[0].authority_id;
    }

    const insertSql = `
      INSERT INTO complaints (user_id, title, description, location_text, latitude, longitude, status, image_url, authority_id, category_id, division_id) 
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
    `;
    const values = [user_id, title, description, location_text, latitude || null, longitude || null, image_url, assigned_authority_id, category_id || null, final_division_id];
    const [result] = await db.query(insertSql, values);

    res.status(201).json({ success: true, message: "Complaint submitted successfully!", complaint_id: result.insertId });
  } catch (error) {
    console.error("Submit Complaint Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to save complaint." });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*, 
        cat.name AS category,
        divi.name AS division
      FROM complaints c 
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN divisions divi ON c.division_id = divi.division_id
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC
    `;
    const [complaints] = await db.query(query, [req.params.userId]);
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
        cat.name AS category,
        divi.name AS division,
        cit.fullName AS citizen_name, 
        cit.phone AS citizen_phone
      FROM complaints c
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN divisions divi ON c.division_id = divi.division_id
      WHERE c.authority_id = ?
      ORDER BY c.created_at DESC
    `;
    const [rows] = await db.query(query, [authorityId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Dashboard Fetch Error:", err);
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
        cat.name AS category,
        divi.name AS division,
        a.name as authority_name,
        cit.fullName as citizen_name,
        cit.phone as citizen_phone,
        cit.nic as citizen_nic,
        u.email as citizen_email
      FROM complaints c 
      LEFT JOIN authorities a ON c.authority_id = a.authority_id 
      LEFT JOIN citizens cit ON c.user_id = cit.user_id
      LEFT JOIN users u ON c.user_id = u.user_id 
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN divisions divi ON c.division_id = divi.division_id
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