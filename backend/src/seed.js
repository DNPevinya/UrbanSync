const db = require('./db'); 

const seedComplaints = async () => {
    console.log("🌱 Starting Official UrbanSync Seed for User ID: 60...");

    const fakeComplaints = [
        // JANUARY 
        [60, 'Urban Infrastructure & Municipal Services', 'Broken Road / Pothole', 'Massive pothole near the bus stand causing vehicle damage. [SEED]', 'Kadawatha', 'Resolved', '2026-01-10 09:00:00', 4],
        [60, 'Public Health & Sanitation', 'Dengue Mosquito Breeding Site', 'Abandoned construction site collecting rainwater. High risk of Dengue. [SEED]', 'Gampaha', 'Resolved', '2026-01-22 14:00:00', 10],

        // FEBRUARY 
        [60, 'Public Safety & Law Enforcement', 'Noise Complaint', 'Late night construction noise exceeding allowed decibels. [SEED]', 'Negombo', 'Resolved', '2026-02-05 22:30:00', 15],
        [60, 'Water Supply Services', 'Pipe Leak', 'Main supply line burst on the pavement. Continuous water loss. [SEED]', 'Colombo', 'In Progress', '2026-02-18 08:15:00', 16],
        [60, 'Environmental Protection', 'Water Body Pollution (River/Canal)', 'Oil being dumped into the local canal by a garage. [SEED]', 'Dehiwala', 'Resolved', '2026-02-28 11:00:00', 2],

        // MARCH 
        [60, 'Urban Planning & Development', 'Unauthorized Construction', 'New wall being built blocking the public drainage path. [SEED]', 'Kaduwela', 'Pending', '2026-03-05 10:00:00', 3],
        [60, 'Electricity Services', 'Streetlight Breakdown', 'Four streetlights in a row are out for a week. Very dark at night. [SEED]', 'Colombo', 'Resolved', '2026-03-12 19:45:00', 1],
        [60, 'Electricity Services', 'Fallen Electrical Line', 'Service wire snapped after heavy wind. Hanging low over the road. [SEED]', 'Mahara', 'Resolved', '2026-03-22 16:10:00', 9],

        // APRIL 
        [60, 'Public Transport Infrastructure', 'Bus Stop Maintenance Issue', 'The roof of the bus stand has fallen off. No shelter from rain. [SEED]', 'Negombo', 'Pending', '2026-04-05 08:00:00', 6],
        [60, 'Local Administrative Issues', 'Resident Verification Issue', 'Delays in getting the Grama Niladhari signature for ID. [SEED]', 'Gampaha', 'Pending', '2026-04-15 13:20:00', 5]
    ];

    const sql = `INSERT INTO complaints 
        (user_id, category, title, description, location_text, status, created_at, authority_id) 
        VALUES ?`;

    try {
        await db.query(sql, [fakeComplaints]);
        console.log(" Seed Successful!");
        console.log(" Analytics Trend Chart: Jan (2), Feb (3), Mar (3), Apr (2)");
        console.log("Districts Covered: Kadawatha, Gampaha, Negombo, Colombo, Dehiwala, Kaduwela, Mahara");
    } catch (err) {
        console.error("Seed Error:", err.message);
    } finally {
        process.exit();
    }
};

seedComplaints();