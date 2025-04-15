import { z } from "zod";

// Zod schema for sign-up validation
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(3).optional(),
});

// Zod schema for sign-in validation
export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
