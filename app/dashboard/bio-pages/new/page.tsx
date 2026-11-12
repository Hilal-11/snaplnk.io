import NewBioPage from "@/components/dashboard/bio/NewBioPage";

export default async function NewBioPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { template } = await searchParams;
  return <NewBioPage initialTemplate={typeof template === "string" ? template : "link-hub"} />;
}
