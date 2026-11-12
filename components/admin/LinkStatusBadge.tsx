import { Badge } from "./ui";

type Linkish = {
  is_deleted: boolean;
  archived_link: boolean;
  is_active: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  clicks_count: number;
};

export default function LinkStatusBadge({ l }: { l: Linkish }) {
  if (l.is_deleted) return <Badge tone="red">Deleted</Badge>;
  if ((l.expires_at && new Date(l.expires_at) < new Date()) || (l.max_clicks !== null && l.clicks_count >= l.max_clicks))
    return <Badge tone="orange">Expired</Badge>;
  if (l.archived_link) return <Badge>Archived</Badge>;
  if (!l.is_active) return <Badge>Disabled</Badge>;
  return <Badge tone="green">Active</Badge>;
}
