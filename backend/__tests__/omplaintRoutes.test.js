const request = require('supertest');
const express = require('express');

// 1. MOCK MULTER (Prevents tests from saving junk files to your hard drive)
jest.mock('multer', () => {
    const multer = () => ({
        array: () => (req, res, next) => {
            // Fake a file being uploaded
            req.files = [{ filename: 'test-image.jpg' }];
            return next();
        },
        diskStorage: jest.fn()
    });
    multer.diskStorage = jest.fn();
    return multer;
});

// 2. MOCK THE DATABASE
jest.mock('../src/db', () => ({
    query: jest.fn()
}));
const db = require('../src/db');

// 3. IMPORT ROUTES & SETUP GHOST SERVER
const complaintRoutes = require('../src/routes/complaintRoutes');
const app = express();
app.use(express.json()); // Allow JSON body parsing
app.use('/api/complaints', complaintRoutes);

// ==========================================
// TEST SUITE
// ==========================================
describe('Complaint API Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- 1. SUBMISSION TESTS ---
    describe('POST /api/complaints/submit', () => {
        it('should successfully submit a complaint and auto-assign authority (Happy Path - 201)', async () => {
            // Mock 1: Find Authority based on location/department -> Returns Authority ID 5
            db.query.mockResolvedValueOnce([[{ authority_id: 5 }]]);
            // Mock 2: Insert the complaint -> Returns new Complaint ID 100
            db.query.mockResolvedValueOnce([{ insertId: 100 }]);

            const response = await request(app)
                .post('/api/complaints/submit')
                .send({
                    user_id: 1,
                    category: 'Urban Infrastructure & Municipal Services',
                    title: 'Broken Road / Pothole',
                    description: 'Huge pothole on the main road',
                    location_text: 'Kadawatha, Sri Lanka',
                    latitude: 6.0,
                    longitude: 79.0
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.complaint_id).toBe(100);
            expect(db.query).toHaveBeenCalledTimes(2);
        });

        it('should handle database failure during submission gracefully (Sad Path - 500)', async () => {
            // Force the database to throw an error
            db.query.mockRejectedValueOnce(new Error('Database Connection Lost'));

            const response = await request(app)
                .post('/api/complaints/submit')
                .send({ user_id: 1, title: 'Test' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to save complaint.');
        });
    });

    // --- 2. CITIZEN VIEW TESTS ---
    describe('GET /api/complaints/user/:userId', () => {
        it('should return a list of complaints for a specific user (Happy Path - 200)', async () => {
            const mockComplaints = [
                { complaint_id: 1, title: 'Pothole', status: 'Pending' },
                { complaint_id: 2, title: 'No Water', status: 'Resolved' }
            ];
            db.query.mockResolvedValueOnce([mockComplaints]);

            const response = await request(app).get('/api/complaints/user/10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0].title).toBe('Pothole');
        });
    });

    describe('GET /api/complaints/:id', () => {
        it('should return full complaint details if found (Happy Path - 200)', async () => {
            db.query.mockResolvedValueOnce([[{ complaint_id: 99, title: 'Noise Complaint', citizen_name: 'John' }]]);

            const response = await request(app).get('/api/complaints/99');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.citizen_name).toBe('John');
        });

        it('should return 404 if the complaint does not exist (Sad Path - 404)', async () => {
            db.query.mockResolvedValueOnce([[]]); // Returns empty array

            const response = await request(app).get('/api/complaints/9999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Not found');
        });
    });

    // --- 3. OFFICER / ADMIN UPDATE TESTS ---
    describe('PATCH /api/complaints/update-status/:id', () => {
        it('should update status and trigger a notification (Happy Path - 200)', async () => {
            // Mock 1: Find complaint to get user_id and title for notification
            db.query.mockResolvedValueOnce([[{ user_id: 10, title: 'Streetlight Broken' }]]);
            // Mock 2: Update status
            db.query.mockResolvedValueOnce([{}]);
            // Mock 3: Insert Notification
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app)
                .patch('/api/complaints/update-status/100')
                .send({ status: 'Resolved' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Status updated and citizen notified!');
            expect(db.query).toHaveBeenCalledTimes(3); // Proves the notification logic fired!
        });
    });

    // --- 4. ADMIN DASHBOARD TESTS ---
    describe('GET /api/complaints/admin/stats', () => {
        it('should return aggregated counts for the admin dashboard (Happy Path - 200)', async () => {
            // We have 4 separate queries in this route, so we mock 4 responses!
            db.query.mockResolvedValueOnce([[{ count: 100 }]]); // Total
            db.query.mockResolvedValueOnce([[{ count: 20 }]]);  // Pending
            db.query.mockResolvedValueOnce([[{ count: 50 }]]);  // Resolved
            db.query.mockResolvedValueOnce([[{ count: 30 }]]);  // In Progress

            const response = await request(app).get('/api/complaints/admin/stats');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.total).toBe(100);
            expect(response.body.data.resolved).toBe(50);
            expect(db.query).toHaveBeenCalledTimes(4);
        });
    });

    describe('DELETE /api/complaints/admin/delete-complaint/:id', () => {
        it('should permanently delete a complaint (Happy Path - 200)', async () => {
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app).delete('/api/complaints/admin/delete-complaint/5');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Complaint permanently deleted.');
        });
    });
});