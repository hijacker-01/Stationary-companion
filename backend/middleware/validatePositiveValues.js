const financialFields = [
  "qty", "quantity", "amount", "price", "rate", 
  "discount", "payment", "total", "subtotal", "tax"
];

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function validatePositiveRecursive(obj, req, res) {
  if (!obj) return null;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const err = validatePositiveRecursive(obj[i], req, res);
      if (err) return err;
    }
  } else if (isObject(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      if (financialFields.includes(key.toLowerCase())) {
        // Allow discount to be 0
        const isDiscount = key.toLowerCase() === 'discount';
        
        // Check if value is missing, not a number, or less than/equal to zero
        if (value === null || value === undefined || value === "") {
          return { field: key, value, message: `${key} is required and cannot be empty.` };
        }
        
        const numVal = Number(value);
        if (isNaN(numVal)) {
          return { field: key, value, message: `${key} must be a valid number.` };
        }
        
        if (isDiscount) {
          if (numVal < 0) return { field: key, value, message: `${key} cannot be negative.` };
        } else {
          if (numVal <= 0) return { field: key, value, message: `${key} must be a positive number greater than zero.` };
        }
      }
      
      const err = validatePositiveRecursive(value, req, res);
      if (err) return err;
    }
  }
  return null;
}

const validatePositiveValues = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const error = validatePositiveRecursive(req.body, req, res);
    
    if (error) {
      const userIp = req.ip || req.connection.remoteAddress;
      const userId = req.user ? req.user.id : "unauthenticated";
      console.error(`[SECURITY AUDIT] Blocked malicious/invalid input. User: ${userId}, IP: ${userIp}, Endpoint: ${req.method} ${req.originalUrl}, Field: ${error.field}, Value: ${error.value}`);
      
      return res.status(400).json({
        error: "Invalid value",
        field: error.field,
        message: error.message
      });
    }
  }
  next();
};

module.exports = validatePositiveValues;
