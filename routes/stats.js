// routes/stats.js
const ParkingSpace = require('../models/ParkingSpace');
const ParkingSession = require('../models/ParkingSession');

router.get('/stats', async (req, res) => {
  try {
    // Count total, free, and occupied spaces
    const totalSpaces = await ParkingSpace.countDocuments();
    const freeSpaces = await ParkingSpace.countDocuments({ status: 'free' });
    const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' });

    // Calculate today's revenue and visitor count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todaySessions = await ParkingSession.find({
      status: 'completed',
      endTime: { $gte: startOfToday }
    });
    
    const todayRevenue = todaySessions.reduce((sum, session) => sum + (session.amount || 0), 0);
    const todayVisitors = todaySessions.length;

    // Calculate average stay duration (in hours)
    const completedSessions = await ParkingSession.find({ status: 'completed' });
    const totalDuration = completedSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + (session.endTime - session.startTime);
      }
      return sum;
    }, 0);
    
    const averageStay = completedSessions.length > 0 
      ? (totalDuration / completedSessions.length) / (1000 * 60 * 60) // Convert ms to hours
      : 0;

    res.json({
      spaces: { total: totalSpaces, free: freeSpaces, occupied: occupiedSpaces },
      sessions: { today: todayVisitors },
      todayRevenue,
      averageStay
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});