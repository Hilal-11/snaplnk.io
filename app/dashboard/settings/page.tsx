import SettingsView from "@/components/dashboard/settings/SettingsView";
import { parseSettingsTab } from "@/components/dashboard/settings/tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  return <SettingsView initialTab={parseSettingsTab(tab)} />;
}
