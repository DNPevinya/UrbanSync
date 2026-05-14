const request = require('supertest');
const express = require('express');

// Mock file upload middleware
jest.mock('multer', () => {
    const multer = () => ({
        array: () => (req, res, next) => {
            // Add a mock file
            req.files = [{ filename: 'test-image.jpg' }];
            return next();
        },
        diskStorage: jest.fn()
    });
    multer.diskStorage = jest.fn();
    return multer;
});

// Mock the database
jest.mock('../src/db', () => ({
    query: jest.fn()
}));
const db = require('../src/db');

// Set up a mock Express app
const complaintRoutes = require('../src/routes/complaintRoutes');
const app = express();
app.use(express.json()); 
app.use('/api/complaints', complaintRoutes);

describe('Complaint API Routes', () => {

    beforeEach(() => {
        // Clear mock data before each test
        jest.clearAllMocks();
    });

    describe('POST /api/complaints/submit', () => {
        
        it('should successfully submit a complaint and auto-assign an authority (Happy Path - 201)', async () => {
            // Simulate finding an appropriate authority
            db.query.mockResolvedValueOnce([[{ authority_id: 5 }]]);
            // Simulate successful complaint insertion
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
            
            // Verify number of database queries
            expect(db.query).toHaveBeenCalledTimes(2);
        });

        it('should handle database failure during submission gracefully (Sad Path - 500)', async () => {
            // Simulate a database connection error
            db.query.mockRejectedValueOnce(new Error('Database Connection Lost'));

            const response = await request(app)
                .post('/api/complaints/submit')
                .send({ user_id: 1, title: 'Test' });

            // Verify error response
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to save complaint.');
        });
    });

    describe('GET /api/complaints/user/:userId', () => {
        
        it('should return a list of complaints for a specific user (Happy Path - 200)', async () => {
            // Simulate finding complaints for the user
            const mockComplaints = [
                { complaint_id: 1, title: 'Pothole', status: 'Pending' },
                { complaint_id: 2, title: 'No Water', status: 'Resolved' }
            ];
            db.query.mockResolvedValueOnce([mockComplaints]);

            const response = await request(app).get('/api/complaints/user/10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Verify correct number of complaints returned
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0].title).toBe('Pothole');
        });
    });

    describe('GET /api/complaints/:id', () => {
        
        it('should return full complaint details if found (Happy Path - 200)', async () => {
            // Simulate finding the specific complaint
            db.query.mockResolvedValueOnce([[{ complaint_id: 99, title: 'Noise Complaint', citizen_name: 'John' }]]);

            const response = await request(app).get('/api/complaints/99');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.citizen_name).toBe('John');
        });

        it('should return 404 if the complaint does not exist (Sad Path - 404)', async () => {
            // Simulate that the complaint is not found
            db.query.mockResolvedValueOnce([[]]); 

            const response = await request(app).get('/api/complaints/9999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Not found');
        });
    });

    describe('PATCH /api/complaints/update-status/:id', () => {
        
        it('should update status and trigger an automated user notification (Happy Path - 200)', async () => {
            // Simulate finding the complaint
            db.query.mockResolvedValueOnce([[{ user_id: 10, title: 'Streetlight Broken' }]]);
            // Simulate successful status update
            db.query.mockResolvedValueOnce([{}]);
            // Simulate successful notification insertion
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app)
                .patch('/api/complaints/update-status/100')
                .send({ status: 'Resolved' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Status updated and citizen notified!');
            
            // Verify number of database queries
            expect(db.query).toHaveBeenCalledTimes(3); 
        });
    });

    describe('GET /api/complaints/admin/stats', () => {
        
        it('should return aggregated counts for the admin dashboard (Happy Path - 200)', async () => {
            // Simulate dashboard queries responses
            db.query.mockResolvedValueOnce([[{ count: 100 }]]); // Total
            db.query.mockResolvedValueOnce([[{ count: 20 }]]);  // Pending
            db.query.mockResolvedValueOnce([[{ count: 50 }]]);  // Resolved
            db.query.mockResolvedValueOnce([[{ count: 30 }]]);  // In Progress

            const response = await request(app).get('/api/complaints/admin/stats');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Verify aggregated data in response
            expect(response.body.data.total).toBe(100);
            expect(response.body.data.resolved).toBe(50);
            expect(db.query).toHaveBeenCalledTimes(4);
        });
    });

    describe('DELETE /api/complaints/admin/delete-complaint/:id', () => {
        
        it('should permanently delete a complaint (Happy Path - 200)', async () => {
            // Simulate successful complaint deletion
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app).delete('/api/complaints/admin/delete-complaint/5');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Complaint permanently deleted.');
        });
    });
});