const { z } = require('zod');
const { SUPPORTED_LOCALES } = require('../config/locales');

const ROLES = ['admin', 'editor', 'viewer'];

// Optional free-text field: trims, caps length, and stores '' as NULL.
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const requiredText = (max, label) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);

// bcrypt only looks at the first 72 bytes, so longer passwords are rejected
// rather than silently truncated.
const password = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 bytes');

const username = z
  .string({ error: 'Username is required' })
  .trim()
  .min(2, 'Username must be at least 2 characters')
  .max(50)
  .regex(/^[\w.@-]+$/, 'Username may only contain letters, numbers, and . _ @ -');

const email = z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Invalid email address').max(254));

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .nullish()
  .transform((v) => (v ? v : null))
  .pipe(z.email('Invalid email address').nullable());

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must be a hex value like #3b82f6')
  .transform((v) => v.toLowerCase());

const isoDate = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .pipe(z.iso.date('Birthday must be a valid date (YYYY-MM-DD)').nullable());

const household = z.object({
  name: requiredText(120, 'Household name'),
  address_line1: optionalText(200),
  address_line2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  postal_code: optionalText(20),
  country: optionalText(100),
  notes: optionalText(2000),
  color_theme: hexColor.default('#3b82f6'),
});

const member = z.object({
  first_name: requiredText(100, 'First name'),
  last_name: optionalText(100),
  role: optionalText(50),
  birthday: isoDate,
  email: optionalEmail,
  phone: optionalText(40),
  notes: optionalText(2000),
});

const setup = z.object({ username, email, password });

const login = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

const createUser = z.object({
  username,
  email,
  password,
  role: z.enum(ROLES),
});

const updateUser = z
  .object({
    username: username.optional(),
    email: email.optional(),
    password: password.optional(),
    role: z.enum(ROLES).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'No fields to update');

const changePassword = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(200),
  newPassword: password,
});

const preferences = z.object({
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

const id = z.coerce.number().int().positive();

const listQuery = (defaultLimit, maxLimit) =>
  z.object({
    page: z.coerce.number().int().min(1).max(100000).catch(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).catch(defaultLimit),
    search: z.string().trim().max(100).catch(''),
  });

module.exports = {
  ROLES,
  household,
  member,
  setup,
  login,
  createUser,
  updateUser,
  changePassword,
  preferences,
  id,
  listQuery,
};
