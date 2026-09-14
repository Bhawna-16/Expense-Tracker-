import ratelimit from "../config/upstash.js";

let isRateLimiterDisabled = false;

const rateLimiter = async (req, res, next) => {
  try {
    if (!ratelimit || isRateLimiterDisabled) {
      return next();
    }

    const { success } = await ratelimit.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    isRateLimiterDisabled = true;
    console.warn("Rate limiter disabled due to Upstash connectivity issue:", error.message);
    next();
  }
};

export default rateLimiter;
