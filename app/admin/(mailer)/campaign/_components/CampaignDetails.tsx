import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEMPLATE_GLOBALS } from "@/lib/mailer-globals";
import { Liquid } from "liquidjs";
import PreviewSheet from "./preview-sheet";
import { toast } from "sonner";
import { Campaign } from "@/types/mailer.types";

const liquidEngine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

const CampaignDetails = ({ campaign }: { campaign: Campaign }) => {
  const [previewBuilding, setPreviewBuilding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<
    { label: string; html: string; subject: string }[]
  >([]);

  const emails = campaign.emails ?? [];
  const emailCount = emails.length;

  const buildPreviews = useCallback(async () => {
    if (!campaign) return;

    const campaignEmails = campaign.emails ?? [];

    setPreviewBuilding(true);
    try {
      const results: { label: string; html: string; subject: string }[] = [];
      const extraJson = campaign.extraJson;

      if (Array.isArray(extraJson)) {
        const seen = new Set<string>();

        for (const entry of extraJson as Record<string, unknown>[]) {
          const email =
            typeof entry.email === "string"
              ? entry.email.trim().toLowerCase()
              : null;

          if (!email || seen.has(email)) continue;
          seen.add(email);

          const ctx = { ...TEMPLATE_GLOBALS, extra: entry };
          const renderedSubject = await liquidEngine.parseAndRender(
            campaign.subject,
            ctx,
          );
          const renderedHtml = await liquidEngine.parseAndRender(
            campaign.htmlBody,
            ctx,
          );
          results.push({
            label: email,
            html: renderedHtml,
            subject: renderedSubject,
          });

          if (results.length >= 20) break;
        }
      } else {
        const ctx = {
          ...TEMPLATE_GLOBALS,
          extra: (extraJson ?? {}) as Record<string, unknown>,
        };
        const renderedSubject = await liquidEngine.parseAndRender(
          campaign.subject,
          ctx,
        );
        const renderedHtml = await liquidEngine.parseAndRender(
          campaign.htmlBody,
          ctx,
        );

        if (campaignEmails.length > 0) {
          for (const email of campaignEmails) {
            results.push({
              label: email,
              html: renderedHtml,
              subject: renderedSubject,
            });
            if (results.length >= 20) break;
          }
        } else {
          results.push({
            label: "Preview",
            html: renderedHtml,
            subject: renderedSubject,
          });
        }
      }

      setPreviews(results);
      setPreviewOpen(true);
    } catch (error) {
      toast.error(`Preview failed: ${(error as Error).message}`);
    } finally {
      setPreviewBuilding(false);
    }
  }, [campaign]);

  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      <div className="p-2 bg-muted border-b flex justify-between items-center gap-2">
        <div className="text-xs text-muted-foreground">
          Campaign Details
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={buildPreviews}
          disabled={previewBuilding}
        >
          {previewBuilding ? (
            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
          ) : null}
          Preview
        </Button>
      </div>
      <div className="space-y-3 p-3">
        <div className="gap-y-2.5 grid grid-cols-[100px_1fr] text-sm">
          <span className="text-muted-foreground">Subject</span>
          <span className="font-medium">{campaign.subject || "—"}</span>

          <span className="text-muted-foreground">Recipients</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant={"ghost"} className="justify-between ">
                <span>
                  {emailCount} recipient{emailCount === 1 ? "" : "s"}
                </span>
                <ChevronsUpDown />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Recipients</DialogTitle>
                <DialogDescription>
                  All email addresses included in this campaign.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-80 overflow-y-auto">
                {emailCount > 0 ? (
                  <div className="space-y-1.5 divide-y">
                    {emails.map((email, index) => (
                      <div
                        key={`${email}-${index}`}
                        className="bg-background px-3 py-2 text-sm"
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No recipients available
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <span className="text-muted-foreground">Sent At</span>
          <span>
            {campaign.sentAt
              ? new Date(campaign.sentAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
      </div>
      <PreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previews={previews}
      />
    </div>
  );
};

export default CampaignDetails;
