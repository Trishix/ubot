import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';

// Load environment variables
dotenv.config();

// Validate environment
if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ ERROR: GOOGLE_API_KEY is not set in .env file');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/admin/portfolio', adminRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'UBOT API',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🤖 UBOT API Server');
    console.log('='.repeat(50));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Gemini API key configured: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'No'}`);
    console.log(`✅ Admin password set: ${process.env.ADMIN_PASSWORD ? 'Yes' : 'No'}`);
    console.log('\nEndpoints:');
    console.log(`  POST   http://localhost:${PORT}/api/chat`);
    console.log(`  GET    http://localhost:${PORT}/api/admin/portfolio`);
    console.log(`  POST   http://localhost:${PORT}/api/admin/portfolio`);
    console.log(`  GET    http://localhost:${PORT}/health`);
    console.log('='.repeat(50) + '\n');
});
