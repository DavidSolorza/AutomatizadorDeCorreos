import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const ruleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  field: z.enum(['sender', 'sender_name', 'subject', 'body_plain', 'recipient', 'domain']),
  operator: z.enum(['contains', 'not_contains', 'equals', 'starts_with', 'ends_with', 'regex']),
  value: z.string().min(1, 'Valor requerido'),
  category: z.string().optional(),
  assigned_to: z.string().optional(),
  is_active: z.boolean().optional(),
  priority: z.enum(['bajo', 'medio', 'alto', 'urgente']),
});

export const emailUpdateSchema = z.object({
  is_read: z.boolean().optional(),
  is_starred: z.boolean().optional(),
  category: z.string().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type RuleForm = z.infer<typeof ruleSchema>;
export type EmailUpdate = z.infer<typeof emailUpdateSchema>;
