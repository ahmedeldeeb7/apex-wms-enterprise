export const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, constraints] of Object.entries(schema)) {
      const val = req.body[field];
      
      if (constraints.required && (val === undefined || val === null || val === '')) {
        errors.push(`Required field '${field}' is missing or blank`);
        continue;
      }

      if (val !== undefined && val !== null) {
        if (constraints.type === 'number' && isNaN(Number(val))) {
          errors.push(`Field '${field}' must be a numerical format`);
        }
        if (constraints.type === 'array' && !Array.isArray(val)) {
          errors.push(`Field '${field}' must be an array format`);
        }
        if (constraints.minLength && String(val).length < constraints.minLength) {
          errors.push(`Field '${field}' length cannot be shorter than ${constraints.minLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Request schema parameters validation failed',
        errors
      });
    }

    next();
  };
};

// Ready-to-use schemas
export const loginSchema = {
  username: { required: true, minLength: 3 },
  password: { required: true, minLength: 3 }
};

export const transferSchema = {
  uid: { required: true, type: 'number' },
  newLocationId: { required: true, type: 'number' }
};

export const bulkTransferSchema = {
  uids: { required: true, type: 'array' },
  newLocationId: { required: true, type: 'number' }
};
