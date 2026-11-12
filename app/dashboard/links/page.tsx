import LinkCollection from "@/components/dashboard/links/LinkCollection";

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tag } = await searchParams;
  return <LinkCollection variant="link" initialTag={typeof tag === "string" && tag.trim() ? tag.trim().slice(0, 40) : null} />;
}
