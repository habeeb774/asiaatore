import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "IDENTIFIER_REQUIRED"),
  password: z.string().min(1, "MISSING_PASSWORD"),
  mfaCode: z.string().optional(),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .email()
      .transform((v) => v.trim().toLowerCase())
      .optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(6, "WEAK_PASSWORD"),
    name: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "EMAIL_OR_PHONE_REQUIRED",
    path: ["email"],
  });
