// seed.js
const db = require('./db');

const seedComplaints = async () => {
    try {
        console.log(" Injecting 36 Enterprise Data Points...");
        console.log("Safely appending to your existing complaints (starting at ID 4)...");

        const USER_ID = 6; 


        const dummyData = [
            // ---RESOLVED COMPLAINTS ---
            { title: "Garbage Collection Delay", desc: "Bins overflowing on Galle Road.", locText: "Colombo 03", lat: 6.9044, lng: 79.8511, status: "RESOLVED", authId: 1, catId: 1, divId: 1, created: "2024-04-01 08:30:00", resolved: "2024-04-03 14:15:00" },
            { title: "Pipe Leak", desc: "Main pipe burst repaired.", locText: "Kadawatha Town", lat: 7.0011, lng: 79.9500, status: "RESOLVED", authId: 18, catId: 4, divId: 4, created: "2024-04-02 09:45:00", resolved: "2024-04-03 11:20:00" },
            { title: "Traffic Signal Malfunction", desc: "Fixed lights at intersection.", locText: "Dehiwala Junction", lat: 6.8511, lng: 79.8650, status: "RESOLVED", authId: 12, catId: 1, divId: 2, created: "2024-04-05 10:15:00", resolved: "2024-04-05 16:30:00" },
            { title: "Dengue Mosquito Breeding Site", desc: "Cleared abandoned lot.", locText: "Gampaha Town", lat: 7.0873, lng: 80.0143, status: "RESOLVED", authId: 10, catId: 2, divId: 5, created: "2024-04-06 11:00:00", resolved: "2024-04-08 09:00:00" },
            { title: "Public Space Maintenance Issue", desc: "Cleared fallen branches in the square.", locText: "Negombo Center", lat: 7.2008, lng: 79.8385, status: "RESOLVED", authId: 6, catId: 1, divId: 6, created: "2024-04-10 18:30:00", resolved: "2024-04-10 22:15:00" },
            { title: "Illegal Waste Dumping", desc: "Cleared industrial waste.", locText: "Colombo 07", lat: 6.9144, lng: 79.8611, status: "RESOLVED", authId: 20, catId: 1, divId: 1, created: "2024-04-12 08:30:00", resolved: "2024-04-14 14:15:00" },
            { title: "Noise Complaint", desc: "Warned construction site.", locText: "Kaduwela", lat: 6.9344, lng: 79.9811, status: "RESOLVED", authId: 3, catId: 3, divId: 3, created: "2024-04-14 23:30:00", resolved: "2024-04-15 01:15:00" },
            { title: "Broken Road / Pothole", desc: "Filled sinkhole.", locText: "Homagama Town", lat: 6.8400, lng: 80.0000, status: "RESOLVED", authId: 36, catId: 1, divId: null, created: "2024-04-15 08:30:00", resolved: "2024-04-18 14:15:00" }, 
            { title: "Sewer Line Blockage", desc: "Unblocked main line.", locText: "Mount Lavinia", lat: 6.8311, lng: 79.8650, status: "RESOLVED", authId: 17, catId: 4, divId: 2, created: "2024-04-16 08:30:00", resolved: "2024-04-17 14:15:00" },
            { title: "Public Disorder", desc: "Resolved street altercation.", locText: "Kollupitiya", lat: 6.9144, lng: 79.8511, status: "RESOLVED", authId: 11, catId: 3, divId: 1, created: "2024-04-18 20:30:00", resolved: "2024-04-18 21:15:00" },

            // --- IN PROGRESS COMPLAINTS ---
            { title: "Drainage Blockage / Flooding", desc: "Flooding on main road, crew dispatched.", locText: "Gampaha", lat: 7.0873, lng: 80.0143, status: "IN PROGRESS", authId: 5, catId: 1, divId: 5, created: "2024-04-20 08:30:00", resolved: null },
            { title: "Water Supply Interruption", desc: "Investigating low pressure.", locText: "Negombo", lat: 7.2008, lng: 79.8385, status: "IN PROGRESS", authId: 16, catId: 4, divId: 6, created: "2024-04-21 09:45:00", resolved: null },
            { title: "Suspicious Activity", desc: "Patrol monitoring the area.", locText: "Kadawatha", lat: 7.0011, lng: 79.9500, status: "IN PROGRESS", authId: 13, catId: 3, divId: 4, created: "2024-04-22 10:15:00", resolved: null },
            { title: "Food Hygiene Complaint", desc: "Inspecting local bakery.", locText: "Dehiwala", lat: 6.8511, lng: 79.8650, status: "IN PROGRESS", authId: 8, catId: 2, divId: 2, created: "2024-04-22 11:00:00", resolved: null },
            { title: "Illegal Tree Cutting", desc: "Forestry officers on site.", locText: "Pitipana, NSBM Area", lat: 6.8222, lng: 80.0399, status: "IN PROGRESS", authId: 46, catId: 5, divId: null, created: "2024-04-23 08:30:00", resolved: null }, 
            { title: "Damaged Footpath", desc: "Paving stones cracked.", locText: "Colombo 01", lat: 6.9344, lng: 79.8411, status: "IN PROGRESS", authId: 23, catId: 1, divId: 1, created: "2024-04-23 09:30:00", resolved: null },
            { title: "Vandalism", desc: "Graffiti on bus stand.", locText: "Kadawatha Bus Stand", lat: 7.0011, lng: 79.9500, status: "IN PROGRESS", authId: 31, catId: 3, divId: 4, created: "2024-04-23 10:30:00", resolved: null },
            { title: "Unsanitary Business Premises", desc: "Meat shop lacks refrigeration.", locText: "Colombo Central", lat: 6.9244, lng: 79.8511, status: "IN PROGRESS", authId: 7, catId: 2, divId: 1, created: "2024-04-24 08:30:00", resolved: null },
            { title: "Street Cleaning Issue", desc: "Leaves blocking storm drains.", locText: "Kaduwela", lat: 6.9344, lng: 79.9811, status: "IN PROGRESS", authId: 3, catId: 1, divId: 3, created: "2024-04-24 09:30:00", resolved: null },
            { title: "Water Contamination", desc: "Brown water coming from taps.", locText: "Homagama Town", lat: 6.8400, lng: 80.0000, status: "IN PROGRESS", authId: 40, catId: 4, divId: null, created: "2024-04-24 10:30:00", resolved: null },

            // ---  PENDING COMPLAINTS ---
            { title: "Parking Violation", desc: "Cars blocking fire lane.", locText: "Gampaha Town", lat: 7.0873, lng: 80.0143, status: "PENDING", authId: 14, catId: 3, divId: 5, created: "2024-04-25 08:30:00", resolved: null },
            { title: "Waste Causing Health Hazard", desc: "Medical waste dumped in alley.", locText: "Colombo 10", lat: 6.9244, lng: 79.8611, status: "PENDING", authId: 1, catId: 2, divId: 1, created: "2024-04-25 09:45:00", resolved: null },
            { title: "Public Park Maintenance Issue", desc: "Swings are broken and dangerous.", locText: "Dehiwala", lat: 6.8511, lng: 79.8650, status: "PENDING", authId: 2, catId: 1, divId: 2, created: "2024-04-25 10:15:00", resolved: null },
            { title: "Low Water Pressure", desc: "No water reaching 2nd floor.", locText: "Kadawatha", lat: 7.0011, lng: 79.9500, status: "PENDING", authId: 18, catId: 4, divId: 4, created: "2024-04-25 11:00:00", resolved: null },
            { title: "Broken Road / Pothole", desc: "Road caving in near campus.", locText: "Mahenwatta, NSBM", lat: 6.8220, lng: 80.0400, status: "PENDING", authId: 36, catId: 1, divId: null, created: "2024-04-26 08:30:00", resolved: null }, 
            { title: "Public Sanitation Issue", desc: "Public toilets overflowing.", locText: "Negombo Beach", lat: 7.2008, lng: 79.8385, status: "PENDING", authId: 6, catId: 2, divId: 6, created: "2024-04-26 09:30:00", resolved: null },
            { title: "Noise Complaint", desc: "Loud music from club.", locText: "Kollupitiya", lat: 6.9144, lng: 79.8511, status: "PENDING", authId: 11, catId: 3, divId: 1, created: "2024-04-26 23:30:00", resolved: null },
            { title: "Illegal Waste Dumping", desc: "Truck dumping debris.", locText: "Kaduwela", lat: 6.9344, lng: 79.9811, status: "PENDING", authId: 22, catId: 1, divId: 3, created: "2024-04-27 08:30:00", resolved: null },
            { title: "Pipe Leak", desc: "Water bubbling through asphalt.", locText: "Pitipana Junction", lat: 6.8250, lng: 80.0350, status: "PENDING", authId: 40, catId: 4, divId: null, created: "2024-04-27 09:30:00", resolved: null }, 
            { title: "Traffic Signal Malfunction", desc: "Lights out at crosswalk.", locText: "Gampaha", lat: 7.0873, lng: 80.0143, status: "PENDING", authId: 14, catId: 1, divId: 5, created: "2024-04-27 10:30:00", resolved: null },

            // ---  REJECTED & CANCELLED ---
            { title: "Suspicious Activity", desc: "False alarm regarding a neighbor.", locText: "Colombo 05", lat: 6.8944, lng: 79.8611, status: "REJECTED", authId: 11, catId: 3, divId: 1, created: "2024-04-10 08:30:00", resolved: null },
            { title: "Noise Complaint", desc: "User cancelled the request.", locText: "Dehiwala", lat: 6.8511, lng: 79.8650, status: "CANCELLED", authId: 12, catId: 3, divId: 2, created: "2024-04-11 09:45:00", resolved: null },
            { title: "Garbage Collection Delay", desc: "Truck arrived before officer dispatched.", locText: "Kadawatha", lat: 7.0011, lng: 79.9500, status: "CANCELLED", authId: 4, catId: 1, divId: 4, created: "2024-04-15 10:15:00", resolved: null },
            { title: "Public Space Maintenance Issue", desc: "Issue is on private property.", locText: "Negombo", lat: 7.2008, lng: 79.8385, status: "REJECTED", authId: 6, catId: 1, divId: 6, created: "2024-04-20 11:00:00", resolved: null },
            { title: "Parking Violation", desc: "Car moved before police arrived.", locText: "Gampaha", lat: 7.0873, lng: 80.0143, status: "REJECTED", authId: 14, catId: 3, divId: 5, created: "2024-04-22 08:30:00", resolved: null },

            // ---  THE UNASSIGNED COMPLAINT  ---
            { 
                title: "Illegal Tree Cutting", 
                desc: "Unmarked trucks removing old-growth trees. ", 
                locText: "Unknown coordinates: 8HRX+P2", 
                lat: 6.9934, lng: 80.1234, 
                status: "PENDING", 
                authId: null, 
                catId: 5, divId: null, 
                created: "2024-04-28 15:30:00", resolved: null 
            }
        ];

        const sql = `
            INSERT INTO complaints 
            (user_id, title, description, location_text, latitude, longitude, status, authority_id, category_id, division_id, created_at, resolved_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of dummyData) {
            await db.query(sql, [
                USER_ID, item.title, item.desc, item.locText, item.lat, item.lng, 
                item.status, item.authId, item.catId, item.divId, item.created, item.resolved
            ]);
        }

        console.log(" Success! 36 Compliant Golden Data Points have been appended.");
        process.exit(0);

    } catch (error) {
        console.error(" Seeding failed:", error);
        process.exit(1);
    }
};

seedComplaints();