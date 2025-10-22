// routes/sessions.js
router.get('/sessions', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const sessions = await ParkingSession.find(filter)
      .populate('spaceId', 'spaceNumber') // Get space number from ParkingSpace collection
      .limit(10)
      .sort({ startTime: -1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});