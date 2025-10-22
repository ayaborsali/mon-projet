// routes/alerts.js
router.get('/alerts', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const alerts = await Alert.find()
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});