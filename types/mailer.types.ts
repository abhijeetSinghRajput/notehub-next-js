export interface CampaignStats {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  opened: number; // unique jobs with at least one open
  clicked: number; // unique jobs with at least one click
}

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  previewText: string;
  htmlBody: string;
  emails?: string[];
  status: "draft" | "sending" | "done" | "failed" | "skipped";
  extraJson: unknown;
  stats: CampaignStats;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  email: string;
  status: "pending" | "sent" | "failed" | "skipped";
  error: string | null;
  processedAt: string | null;
  createdAt: string;
  // tracking
  openCount: number;
  clickCount: number;
  firstOpenedAt: string | null;
  firstClickedAt: string | null;
}

export interface Contact {
  _id: string;
  label: string;
  description: string;
  emails?: string[];
  emailCount: number;
  createdAt: string;
}

export interface Template {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;
  previewText: string;
  previewImage?: string;
  mode: "shared" | "per_recipient";
  createdAt: string;
}
