// Shared types for the Links / QR Codes collection views.

export interface LinkItem {
  id: string;
  owner: string;
  title: string | null;
  original_url: string;
  short_code: string;
  domain: string;
  is_custom_alias: boolean;
  qr_code_url: string | null;
  qr_code_public_id: string | null;
  favicon_url: string | null;
  clicks_count: number;
  unique_clicks_count: number;
  tags: string[] | null;
  is_active: boolean;
  is_deleted: boolean;
  archived_link: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  is_password_protected: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  last_clicked_at: string | null;
}

/** Body accepted by PATCH /api/links/:id (camelCase, see updateLinkSchema). */
export interface LinkPatch {
  title?: string;
  tags?: string[];
  isActive?: boolean;
  expiresAt?: string | null;
  archivedLink?: boolean;
  isDeleted?: boolean;
  maxClicks?: number | null;
}

/** Which slice of links a collection page manages. */
export type CollectionScope = "all" | "archived" | "expired" | "deleted";

export type ViewMode = "list" | "grid2" | "grid4";

/** "link" renders the short-link card, "qr" renders the QR-first card. */
export type CardVariant = "link" | "qr";

export type LinkStatus = "active" | "disabled" | "expired" | "limit" | "hidden";
