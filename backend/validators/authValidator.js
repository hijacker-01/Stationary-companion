const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email("Invalid company email").optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  stateName: z.string().optional(),
  stateCode: z.string().optional(),
  dlNumber: z.string().optional(),
  financialYear: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  registerSchema,
  loginSchema,
};
