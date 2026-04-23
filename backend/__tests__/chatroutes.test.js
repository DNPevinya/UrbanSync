const request = require('supertest');
const express = require('express');

// 1. HOIST THE MOCK FUNCTION
// By putting this outside and naming it starting with "mock", 
// Jest allows both the test and the route to share the exact same fake function!
const mockCreate = jest.fn();

// 2. MOCK THE OPENAI SDK
jest.mock('openai', () => {
    return {
        OpenAI: jest.fn().mockImplementation(() => {
            return {
                chat: {
                    completions: {
                        create: mockCreate
                    }
                }
            };
        })
    };
});

// 3. IMPORT ROUTES & SETUP GHOST SERVER
const chatRoutes = require('../src/routes/chatroutes'); // <-- Check this path matches your setup
const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

// ==========================================
// TEST SUITE
// ==========================================
describe('Chat API Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/chat/ask', () => {
        
        it('should return a successful AI response (Happy Path - 200)', async () => {
            // Tell our shared fake OpenAI function what to reply with
            mockCreate.mockResolvedValueOnce({
                choices: [
                    { message: { content: "To submit a report, go to the Home screen and tap 'Report an Issue'." } }
                ]
            });

            const response = await request(app)
                .post('/api/chat/ask')
                .send({ message: 'How do I submit a report?' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.reply).toBe("To submit a report, go to the Home screen and tap 'Report an Issue'.");
            
            // Prove that we actually triggered OpenAI
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should return a 400 error if the message is empty (Sad Path - 400)', async () => {
            const response = await request(app)
                .post('/api/chat/ask')
                .send({ message: '' }); 

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message is required.');
            
            // Prove we didn't waste API calls on bad requests
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it('should handle OpenAI API failures gracefully (Sad Path - 500)', async () => {
            // Simulate OpenAI servers being down
            mockCreate.mockRejectedValueOnce(new Error('OpenAI API timeout'));

            const response = await request(app)
                .post('/api/chat/ask')
                .send({ message: 'Hello?' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('The UrbanSync AI is currently unavailable.');
        });
    });
});