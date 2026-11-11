// lib/bio/plans.ts
// Single source of truth for Bio Pages plan limits. Enforced server-side
// (Phase 8); the UI only reads these to show upgrade hints.

export type PlanId = "free" | "pro";

export interface BioPlanLimits {
  /** Bio pages a user may own. */
  maxPages: number;
  /** Blocks per page (draft and published). */
  maxBlocks: number;
  /** Images per gallery block. */
  maxGalleryImages: number;
  /** Max upload size per image, in bytes. */
  maxImageBytes: number;
  /** Custom CSS editor + rendering. */
  customCss: boolean;
  /** Max sanitized custom CSS size, in bytes (0 when customCss is false). */
  maxCustomCssBytes: number;
  /** Days of analytics history visible in the dashboard. */
  analyticsRetentionDays: number;
  /** Email-capture block (v1.1). */
  emailCapture: boolean;
  /** Hide "Made with Snaplnk" footer. */
  removeBranding: boolean;
}

export const BIO_PLANS: Readonly<Record<PlanId, Readonly<BioPlanLimits>>> = {
  free: {
    maxPages: 1,
    maxBlocks: 30,
    maxGalleryImages: 4,
    maxImageBytes: 2 * 1024 * 1024,
    customCss: false,
    maxCustomCssBytes: 0,
    analyticsRetentionDays: 30,
    emailCapture: false,
    removeBranding: false,
  },
  pro: {
    maxPages: 5,
    maxBlocks: 200,
    maxGalleryImages: 8,
    maxImageBytes: 5 * 1024 * 1024,
    customCss: true,
    maxCustomCssBytes: 10 * 1024,
    analyticsRetentionDays: 90,
    emailCapture: true,
    removeBranding: true,
  },
};

export const DEFAULT_PLAN: PlanId = "free";

/** Block types only Pro pages may use (email capture is v1.1). */
export const PRO_ONLY_BLOCK_TYPES: readonly string[] = ["email_capture"];

export function getPlanLimits(plan: string | null | undefined): Readonly<BioPlanLimits> {
  return plan === "pro" ? BIO_PLANS.pro : BIO_PLANS[DEFAULT_PLAN];
}
