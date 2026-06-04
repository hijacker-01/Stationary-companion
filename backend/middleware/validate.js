const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    next(err);
  }
};

module.exports = validate;
