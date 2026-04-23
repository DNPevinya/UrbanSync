const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

// 1. IMPORT YOUR REAL ROUTES (Perfected based on your screenshot!)
const authRoutes = require('../src/routes/authRoutes'); 

// 2. MOCK THE DATABASE
jest.mock('../src/db', () => ({ 
    query: jest.fn()
}));
const db = require('../src/db');

// 3. SETUP THE "GHOST" EXPRESS APP
const app = express();
app.use(express.json()); 
app.use('/api/auth', authRoutes);

// ==========================================
// TEST SUITE
// ==========================================
describe('Auth API Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- REGISTER TESTS ---
    describe('POST /api/auth/register', () => {
        
        it('should successfully register a new citizen (Happy Path - 201)', async () => {
            // Mock 1: Check if email exists -> returns empty array (doesn't exist)
            db.query.mockResolvedValueOnce([[]]); 
            // Mock 2: Insert into users table -> returns a fake ID of 10
            db.query.mockResolvedValueOnce([{ insertId: 10 }]); 
            // Mock 3: Insert into citizens table -> success
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
            // Proves our code actually tried to run 3 database queries
            expect(db.query).toHaveBeenCalledTimes(3); 
        });

        it('should fail if email is already registered (Sad Path - 400)', async () => {
            // Mock 1: Check if email exists -> returns an existing user!
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
            // Proves the code stopped early and didn't run the INSERT queries
            expect(db.query).toHaveBeenCalledTimes(1); 
        });
    });

    // --- LOGIN TESTS ---
    describe('POST /api/auth/login', () => {
        
        it('should login a citizen and trigger 2FA OTP flow (Happy Path - 200)', async () => {
            // Mock 1: Find user by email
            db.query.mockResolvedValueOnce([[{ 
                user_id: 1, 
                email: 'citizen@urbansync.com', 
                role: 'citizen', 
                password: 'plainTextPassword123' // Testing the plain-text fallback you built
            }]]);
            
            // Mock 2: Fetch citizen profile details
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

            // Even though it asks for OTP, your API returns a 200 status for this flow
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('2FA_REQUIRED');
            // Verifies your regex properly formatted the phone number for Firebase!
            expect(response.body.phone).toBe('+94771234567'); 
        });

        it('should fail with invalid email or password (Sad Path - 401)', async () => {
            // Mock 1: Find user by email -> returns empty array (User not found)
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

        it('should successfully login an officer (Happy Path - 200)', async () => {
            // Mock 1: Find Officer in Users table
            db.query.mockResolvedValueOnce([[{ 
                user_id: 99, 
                email: 'officer@urbansync.com', 
                role: 'officer', 
                password: 'officerPassword123' 
            }]]);
            
            // Mock 2: Fetch Officer joined details
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
            expect(response.body.user.role).toBe('officer');
            expect(response.body.user.authorityName).toBe('RDA');
        });
    });

    // --- FORGOT PASSWORD TESTS ---
    describe('POST /api/auth/forgot-password-init', () => {
        
        it('should successfully initiate forgot password for a citizen (Happy Path - 200)', async () => {
            // Mock 1: Find user and verify they are a citizen
            db.query.mockResolvedValueOnce([[{ user_id: 1, role: 'citizen' }]]);
            // Mock 2: Fetch the citizen's phone number
            db.query.mockResolvedValueOnce([[{ phone: '0779998888' }]]);

            const response = await request(app)
                .post('/api/auth/forgot-password-init')
                .send({ email: 'citizen@urbansync.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.phone).toBe('+94779998888'); // Verifies Regex formatting
        });

        it('should return 404 if no citizen account is found (Sad Path - 404)', async () => {
            // Mock 1: No user found
            db.query.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .post('/api/auth/forgot-password-init')
                .send({ email: 'nobody@nowhere.com' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No citizen account found with this email.');
        });
    });

    // --- ADMIN ROUTES TESTS ---
    describe('Admin Officer Management', () => {
        
        it('GET /api/auth/admin/officers-list should return list of officers (Happy Path - 200)', async () => {
            // Mock the database returning an array of officers
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
            // Mock 1: Email check (returns empty array, meaning email is available)
            db.query.mockResolvedValueOnce([[]]);
            // Mock 2: Insert User (returns fake ID)
            db.query.mockResolvedValueOnce([{ insertId: 50 }]);
            // Mock 3: Insert Officer
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
            // Proves the API generated a temporary password for the new officer
            expect(response.body.tempPassword).toBeDefined(); 
        });

        it('DELETE /api/auth/admin/delete-officer/:userId should delete an officer (Happy Path - 200)', async () => {
            // Mock 1: Delete from officers table
            db.query.mockResolvedValueOnce([{}]);
            // Mock 2: Delete from users table
            db.query.mockResolvedValueOnce([{}]);

            const response = await request(app).delete('/api/auth/admin/delete-officer/50');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Officer deleted.');
            expect(db.query).toHaveBeenCalledTimes(2); // Ensures both tables were cleaned up
        });
    });
});