const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

// Import the authentication routes
const authRoutes = require('../src/routes/authRoutes'); 

// Mock the database
jest.mock('../src/db', () => ({ 
    query: jest.fn()
}));
const db = require('../src/db');

// Set up a mock Express app
const app = express();
app.use(express.json()); 
app.use('/api/auth', authRoutes);

describe('Auth API Routes', () => {

    beforeEach(() => {
        // Clear mock data before each test
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        
        it('should successfully register a new citizen (Happy Path - 201)', async () => {
            // Simulate email availability
            db.query.mockResolvedValueOnce([[]]); 
            // Simulate successful user insertion
            db.query.mockResolvedValueOnce([{ insertId: 10 }]); 
            // Simulate successful citizen insertion
            db.query.mockResolvedValueOnce([{}]); 

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: 'John Doe',
                    phone: '0771234567',
                    email: 'citizen@urbansync.com',
                    district: 'Colombo',
                    division: 'Colombo 1',
                    password: 'securepassword123'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Citizen registered successfully!');
            
            // Verify number of database queries
            expect(db.query).toHaveBeenCalledTimes(3); 
        });

        it('should fail if email is already registered (Sad Path - 400)', async () => {
            // Simulate email already registered
            db.query.mockResolvedValueOnce([[{ user_id: 1, email: 'citizen@urbansync.com' }]]);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: 'Duplicate User',
                    phone: '0779999999',
                    email: 'citizen@urbansync.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('This email is already registered.');
            
            // Verify no insertion queries
            expect(db.query).toHaveBeenCalledTimes(1); 
        });
    });

    describe('POST /api/auth/login', () => {
        
        it('should login a citizen and trigger 2FA OTP flow (Happy Path - 200)', async () => {
            // Simulate successful user lookup and password match
            db.query.mockResolvedValueOnce([[{ 
                user_id: 1, 
                email: 'citizen@urbansync.com', 
                role: 'citizen', 
                password: 'plainTextPassword123'
            }]]);
            
            // Simulate successful profile fetch
            db.query.mockResolvedValueOnce([[{ 
                fullName: 'John Doe', 
                phone: '0771234567', 
                district: 'Colombo', 
                division: 'Col 1' 
            }]]);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'citizen@urbansync.com',
                    password: 'plainTextPassword123'
                });

            // Verify initial credential check
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('2FA_REQUIRED');
            
            // Verify phone number format
            expect(response.body.phone).toBe('+94771234567'); 
        });

        it('should fail with invalid email or password (Sad Path - 401)', async () => {
            // Simulate user not found
            db.query.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@email.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid email or password.');
        });

        it('should successfully login an officer bypassing 2FA (Happy Path - 200)', async () => {
            // Simulate successful officer lookup
            db.query.mockResolvedValueOnce([[{ 
                user_id: 99, 
                email: 'officer@urbansync.com', 
                role: 'officer', 
                password: 'officerPassword123' 
            }]]);
            
            // Simulate successful department fetch
            db.query.mockResolvedValueOnce([[{ 
                full_name: 'Inspector Gadget', 
                authority_id: 5, 
                status: 'Active',
                authority_name: 'RDA',
                dept_type: 'Roads'
            }]]);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'officer@urbansync.com',
                    password: 'officerPassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful!');
            
            // Verify officer department info
            expect(response.body.user.role).toBe('officer');
            expect(response.body.user.authorityName).toBe('RDA');
        });
    });

    describe('POST /api/auth/forgot-password-init', () => {
        
        it('should successfully initiate forgot password for a citizen (Happy Path - 200)', async () => {
            // Simulate valid citizen email
            db.query.mockResolvedValueOnce([[{ user_id: 1, role: 'citizen' }]]);
            // Simulate successful phone number fetch
            db.query.mockResolvedValueOnce([[{ phone: '0779998888' }]]);

            const response = await request(app)
                .post('/api/auth/forgot-password-init')
                .send({ email: 'citizen@urbansync.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.phone).toBe('+94779998888');
        });

        it('should return 404 if no citizen account is found (Sad Path - 404)', async () => {
            // Simulate user lookup failure
            db.query.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .post('/api/auth/forgot-password-init')
                .send({ email: 'nobody@nowhere.com' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No citizen account found with this email.');
        });
    });

    describe('Admin Officer Management', () => {
        
        it('GET /api/auth/admin/officers-list should return list of officers (Happy Path - 200)', async () => {
            // Simulate returning list of officers
            db.query.mockResolvedValueOnce([[{ 
                user_id: 2, 
                email: 'officer1@test.com',
                full_name: 'Jane Smith',
                employee_id_code: 'EMP-RDA-001'
            }]]);

            const response = await request(app).get('/api/auth/admin/officers-list');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].full_name).toBe('Jane Smith');
        });

        it('POST /api/auth/admin/add-officer should create a new officer (Happy Path - 201)', async () => {
            // Simulate email availability
            db.query.mockResolvedValueOnce([[]]);
            // Simulate successful user insertion
            db.query.mockResolvedValueOnce([{ insertId: 50 }]);
            // Simulate successful officer insertion
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app)
                .post('/api/auth/admin/add-officer')
                .send({
                    full_name: 'New Officer',
                    email: 'newofficer@urbansync.com',
                    authority_id: 2,
                    employee_id_code: 'EMP-WTR-002'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Officer added!');
            
            // Verify temporary password generation
            expect(response.body.tempPassword).toBeDefined(); 
        });

        it('DELETE /api/auth/admin/delete-officer/:userId should delete an officer (Happy Path - 200)', async () => {
            // Simulate successful deletion from officers table
            db.query.mockResolvedValueOnce([{}]);
            // Simulate successful deletion from users table
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app).delete('/api/auth/admin/delete-officer/50');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Officer deleted.');
            
            // Verify number of database queries
            expect(db.query).toHaveBeenCalledTimes(2); 
        });
    });
});