const store = require('../data/store');

exports.getTenant = (req, res) => {
  res.json({ success: true, data: store.get().tenant });
};

exports.getFullData = (req, res) => {
  res.json({ success: true, data: store.get() });
};

exports.resetData = (req, res) => {
  const resetState = store.reset();
  res.json({ success: true, message: 'Store reset to initial state successfully', data: resetState });
};
