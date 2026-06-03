export interface CampaignStats {
  total: number;
  sent: number;
  skipped: number,
  failed: number;
}


export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;

  emails: string[];

  status: "draft" | "sending" | "done" | "failed" | "skipped";

  extraJson: unknown;

  stats: {
    total: number;
    sent: number;
    skipped: number;
    failed: number;
  };

  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  email: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface Contact {
  _id: string;
  label: string;
  description: string;
  emails: string[];
  createdAt: string;
}

export interface Template {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;
  mode: "shared" | "per_recipient";
  createdAt: string;
}