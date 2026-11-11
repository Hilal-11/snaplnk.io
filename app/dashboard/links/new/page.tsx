import CreateLinkForm from "@/components/dashboard/create/CreateLinkForm";

export default async function NewLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { url } = await searchParams;
  return <CreateLinkForm variant="link" initialUrl={typeof url === "string" ? url : ""} />;
}
