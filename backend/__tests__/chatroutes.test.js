const request = require('supertest');
const express = require('express');

// Mock OpenAI calls
const mockCreate = jest.fn();

// Mock the OpenAI SDK
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

// Import the chat routes
const chatRoutes = require('../src/routes/chatroutes'); 

// Set up a mock Express app
const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat API Routes', () => {

    beforeEach(() => {
        // Clear mock data before each test
        jest.clearAllMocks();
    });

    describe('POST /api/chat/ask', () => {
        
        it('should return a successful AI response (Happy Path - 200)', async () => {
            // Simulate a successful OpenAI response
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
            
            // Verify expected text in response
            expect(response.body.reply).toBe("To submit a report, go to the Home screen and tap 'Report an Issue'.");
            
            // Verify OpenAI call was triggered
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should return a 400 error if the message is empty (Sad Path - 400)', async () => {
            const response = await request(app)
                .post('/api/chat/ask')
                .send({ message: '' }); 

            // Verify empty message error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message is required.');
            
            // Verify no API calls were made
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it('should handle OpenAI API failures gracefully (Sad Path - 500)', async () => {
            // Simulate an OpenAI API error
            mockCreate.mockRejectedValueOnce(new Error('OpenAI API timeout'));

            const response = await request(app)
                .post('/api/chat/ask')
                .send({ message: 'Hello?' });

            // Verify fallback error message
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('The UrbanSync AI is currently unavailable.');
        });
    });
});