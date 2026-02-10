import express from 'express';
import { getPortfolio, updatePortfolio } from '../lib/portfolio.js';

const router = express.Router();

// Simple password check middleware
const checkAuth = (req, res, next) => {
    const password = req.headers['x-admin-password'];

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// GET portfolio data
router.get('/', checkAuth, async (req, res) => {
    try {
        const portfolio = await getPortfolio();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load portfolio' });
    }
});

// UPDATE portfolio data
router.post('/', checkAuth, async (req, res) => {
    try {
        const updated = await updatePortfolio(req.body);
        res.json({
            success: true,
            message: 'Portfolio updated successfully',
            data: updated
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
});

export default router;
