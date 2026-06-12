import CampaignEditor from "../../_components/campaign-editor";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CampaignEditor campaignId={id} />;
}