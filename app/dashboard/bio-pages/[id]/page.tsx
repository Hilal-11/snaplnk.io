import { redirect } from "next/navigation";

export default async function BioPageIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/bio-pages/${encodeURIComponent(id)}/edit`);
}
