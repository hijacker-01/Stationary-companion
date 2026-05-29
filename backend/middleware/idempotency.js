const IdempotencyKey = require("../models/IdempotencyKey");

module.exports = async (req, res, next) => {
  const key = req.headers["x-idempotency-key"];
  if (!key) return next();

  try {
    const existingKey = await IdempotencyKey.findOne({ where: { key } });
    
    if (existingKey) {
      if (existingKey.responseStatus) {
        return res.status(existingKey.responseStatus).json(existingKey.responseBody);
      }
      return res.status(409).json({ error: "A request with this idempotency key is already in progress." });
    }

    // Create the key
    await IdempotencyKey.create({
      key,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
    });

    // Intercept res.json to save the response
    const originalJson = res.json;
    res.json = function (body) {
      IdempotencyKey.update({
        responseStatus: res.statusCode,
        responseBody: body
      }, { where: { key } }).catch(err => console.error("Failed to save idempotency response:", err));
      
      originalJson.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
