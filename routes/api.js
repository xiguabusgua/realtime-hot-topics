const express = require('express');
const router = express.Router();
const aggregatorService = require('../services/aggregatorService');

router.get('/categories', (req, res) => {
  const categories = aggregatorService.getCategories();
  res.json({ code: 0, data: categories });
});

router.get('/topics', async (req, res) => {
  try {
    const data = await aggregatorService.getAllTopics();
    res.json({ code: 0, data });
  } catch (error) {
    res.status(500).json({ code: -1, message: error.message });
  }
});

router.get('/topics/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['tech', 'finance', 'society'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        code: -1,
        message: `Invalid category. Valid options: ${validCategories.join(', ')}`
      });
    }

    const data = await aggregatorService.getCategoryTopics(category);
    res.json({ code: 0, data });
  } catch (error) {
    res.status(500).json({ code: -1, message: error.message });
  }
});

router.post('/cache/clear', (req, res) => {
  aggregatorService.clearCache();
  res.json({ code: 0, message: 'Cache cleared' });
});

router.get('/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
