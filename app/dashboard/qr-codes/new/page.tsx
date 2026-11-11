import CreateLinkForm from "@/components/dashboard/create/CreateLinkForm";

export default async function NewQrCodePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { url } = await searchParams;
  return <CreateLinkForm variant="qr" initialUrl={typeof url === "string" ? url : ""} />;
}
