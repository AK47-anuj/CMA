/**
 * Clock Module — single source of "now" for the entire backend.
 * In DEMO_MODE, allows setting a simulated date via POST /api/demo/clock.
 * All reminder, calendar, and date logic reads from clock.now().
 */

let simulatedDate = null;

const clock = {
  /**
   * Returns the current date/time.
   * If DEMO_MODE is true and a simulated date has been set, returns that instead.
   * @returns {Date}
   */
  now() {
    if (process.env.DEMO_MODE === 'true' && simulatedDate) {
      return new Date(simulatedDate);
    }
    return new Date();
  },

  /**
   * Returns today's date as YYYY-MM-DD string.
   * @returns {string}
   */
  today() {
    const d = this.now();
    return d.toISOString().split('T')[0];
  },

  /**
   * Set a simulated date (DEMO_MODE only).
   * @param {string} dateStr — ISO date string e.g. "2026-10-08"
   */
  setSimulatedDate(dateStr) {
    if (process.env.DEMO_MODE !== 'true') {
      throw new Error('Cannot set simulated date outside DEMO_MODE');
    }
    simulatedDate = dateStr ? new Date(dateStr) : null;
  },

  /**
   * Get the current simulated date string (or null).
   * @returns {string|null}
   */
  getSimulatedDate() {
    return simulatedDate ? simulatedDate.toISOString() : null;
  },

  /**
   * Clear simulated date.
   */
  clearSimulatedDate() {
    simulatedDate = null;
  },

  /**
   * Check if we are in demo mode.
   * @returns {boolean}
   */
  isDemoMode() {
    return process.env.DEMO_MODE === 'true';
  }
};

module.exports = clock;
