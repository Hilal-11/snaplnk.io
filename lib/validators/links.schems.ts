import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("Enter a valid URL, including http:// or https://"),

  customAlias: z
    .string()
    .trim()
    .min(3, "Custom alias must be between 3 and 30 characters")
    .max(30, "Custom alias must be between 3 and 30 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Custom alias can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),

  expiresAt: z
    .string()
    .datetime({ message: "expiresAt must be a valid date" })
    .optional(),
});

export const updateLinkSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime({ message: "expiresAt must be a valid date" }).optional(),
  archivedLink: z.boolean().optional(),
  archivedAt: z.string().datetime({ message: "archivedAt must be a valid date" }).optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: z.string().datetime({ message: "DeletedAt must be a valid date" }).optional(),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  maxClicks: z.number().int().positive().nullable().optional(),
  isPasswordProtected: z.boolean().optional(),
  password: z.string().min(4).max(100).optional(), // plain password in, hashed before storage
  utmSource: z.string().trim().max(100).nullable().optional(),
  utmMedium: z.string().trim().max(100).nullable().optional(),
  utmCampaign: z.string().trim().max(100).nullable().optional(),
  domain: z.string().trim().optional(),
});

export const linkIdSchema = z.object({
  linkId: z.string().uuid("Invalid link ID"),
});

export const feedbackSchema = z.object({
  type: z.enum([
    "bug","feature","improvement","question","general",]),
  title: z
    .string().trim().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
  message: z
    .string().trim().min(10, "Message must be at least 10 characters.").max(2000, "Message cannot exceed 2000 characters."),
  rating: z
    .number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5.").optional(),
  pageUrl: z
    .string().optional(),
});


export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;