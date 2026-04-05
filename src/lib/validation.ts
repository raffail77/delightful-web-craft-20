import { z } from "zod";

// ── Sanitization helpers ──────────────────────────────────────────────
/** Strip HTML tags to prevent XSS when displaying user content */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Trim + collapse whitespace */
export function cleanString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

// ── Reusable Zod schemas ──────────────────────────────────────────────

export const serviceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  category: z.string().min(1, "Please select a category"),
  service_type: z.enum(["offer", "request"]),
  hourly_credits: z.number().int().min(1).max(100),
  location: z.string().max(200).optional().nullable(),
  is_remote: z.boolean(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long (max 5000 characters)"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  title: z.string().trim().max(200, "Title is too long").optional().nullable(),
  content: z.string().trim().max(2000, "Review is too long").optional().nullable(),
});

export const contractProposalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long"),
  credits: z.number().int().min(1, "Credits must be at least 1").max(1000, "Maximum 1000 credits"),
});

export const profileEditSchema = z.object({
  full_name: z.string().trim().max(100, "Name is too long").optional().nullable(),
  headline: z.string().trim().max(200, "Headline is too long").optional().nullable(),
  about: z.string().trim().max(5000, "About section is too long").optional().nullable(),
  location: z.string().trim().max(200, "Location is too long").optional().nullable(),
});

/** Validate a UUID string (prevents injection via malformed IDs) */
export const uuidSchema = z.string().uuid("Invalid ID format");
