import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OWNER_PAGE_COLUMNS, pageIdSchema, type OwnerPageRow } from "@/lib/bio/schemas";
import { parseDocumentLenient } from "@/lib/bio/blocks";
import { DEFAULT_THEME, themeSchema } from "@/lib/bio/theme";
import { hasUnpublishedChanges } from "@/lib/bio/snapshot";
import BioEditor from "@/components/dashboard/bio/editor/BioEditor";

export default async function EditBioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!pageIdSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data } = await supabase
    .from("bio_pages")
    .select(OWNER_PAGE_COLUMNS)
    .eq("id", id)
    .eq("owner", user.id)
    .maybeSingle();
  if (!data) notFound();

  const page = data as OwnerPageRow;
  const theme = themeSchema.safeParse(page.theme);

  return (
    <BioEditor
      page={{
        id: page.id,
        username: page.username,
        version: page.version,
        isPublished: page.is_published,
        isSuspended: page.is_suspended,
        hasUnpublishedChanges: page.is_published ? hasUnpublishedChanges(page, page.published) : true,
        displayName: page.display_name,
        bio: page.bio,
        theme: theme.success ? theme.data : DEFAULT_THEME,
        blocks: parseDocumentLenient(page.draft).blocks,
      }}
    />
  );
}
