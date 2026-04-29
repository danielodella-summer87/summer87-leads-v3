import { redirect } from "next/navigation";

export default async function Leads87DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/leads/${encodeURIComponent(id)}`);
}
