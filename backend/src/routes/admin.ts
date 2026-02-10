import express, { Request, Response, NextFunction } from 'express';
import { getPortfolio, updatePortfolio } from '../lib/portfolio.js';

const router = express.Router();

// Simple password check middleware
const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    const password = req.headers['x-admin-password'];

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// GET portfolio data
router.get('/', checkAuth, async (req: Request, res: Response) => {
    try {
        const portfolio = await getPortfolio();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load portfolio' });
    }
});

// UPDATE portfolio data
router.post('/', checkAuth, async (req: Request, res: Response) => {
    try {
        const updated = await updatePortfolio(req.body);
        res.json({
            success: true,
            message: 'Portfolio updated successfully',
            data: updated
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
});

export default router;
