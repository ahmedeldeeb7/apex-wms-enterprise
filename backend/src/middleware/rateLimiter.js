const ipTracker = new Map();

// Clean up memory leaks from inactive IPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipTracker.entries()) {
    if (now - data.resetTime > 0) {
      ipTracker.delete(ip);
    }
  }
}, 15 * 60 * 1000);

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // Default 1 Minute window
  const max = options.max || 60; // Max requests per window

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipTracker.has(ip)) {
      ipTracker.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    const tracker = ipTracker.get(ip);

    if (now > tracker.resetTime) {
      // Window expired, reset tracker
      tracker.count = 1;
      tracker.resetTime = now + windowMs;
      return next();
    }

    tracker.count++;

    if (tracker.count > max) {
      const retryAfterSeconds = Math.ceil((tracker.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: `Too many terminal requests from this address. Blocked for AD security. Retry in ${retryAfterSeconds} seconds.`
      });
    }

    next();
  };
};

export default rateLimiter;
export { rateLimiter };
