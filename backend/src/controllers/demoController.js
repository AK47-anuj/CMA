/**
 * Demo Controller
 * Demo mode features: clock control, data reset, demo info.
 * Only active when DEMO_MODE=true.
 */

const store = require('../data/store');
const clock = require('../utils/clock');

/**
 * Middleware: Block all demo routes if DEMO_MODE is not true.
 */
function demoGuard(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(403).json({
      success: false,
      message: 'Demo features are only available when DEMO_MODE=true.'
    });
  }
  next();
}

/**
 * GET /api/demo/info
 * Get demo mode info (available accounts, current clock, etc.)
 */
exports.info = (req, res) => {
  const data = store.get();
  const demoUsers = data.users
    .filter(u => u.status === 'ACTIVE')
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email,
      designation: u.designation,
      avatar: u.avatar
    }));

  res.json({
    success: true,
    data: {
      demoMode: true,
      demoPassword: 'Demo@1234',
      currentClock: clock.now().toISOString(),
      simulatedDate: clock.getSimulatedDate(),
      users: demoUsers
    }
  });
};

/**
 * POST /api/demo/clock
 * Set the simulated date for demo mode.
 */
exports.setClock = (req, res) => {
  const { date } = req.body;
  
  try {
    if (date) {
      clock.setSimulatedDate(date);
      res.json({
        success: true,
        message: `Clock set to ${date}`,
        data: { simulatedDate: clock.now().toISOString() }
      });
    } else {
      clock.clearSimulatedDate();
      res.json({
        success: true,
        message: 'Clock reset to real time',
        data: { currentTime: clock.now().toISOString() }
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/demo/clock
 * Get the current clock state.
 */
exports.getClock = (req, res) => {
  res.json({
    success: true,
    data: {
      now: clock.now().toISOString(),
      today: clock.today(),
      simulatedDate: clock.getSimulatedDate(),
      isSimulated: !!clock.getSimulatedDate()
    }
  });
};

/**
 * POST /api/demo/reset
 * Reset all data to initial seed state.
 */
exports.reset = async (req, res) => {
  store.reset();
  res.json({
    success: true,
    message: 'All data has been reset to initial demo state.',
    data: {
      timestamp: clock.now().toISOString()
    }
  });
};

exports.demoGuard = demoGuard;
