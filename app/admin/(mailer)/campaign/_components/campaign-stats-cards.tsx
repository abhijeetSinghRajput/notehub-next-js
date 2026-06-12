import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { BarChart3, CheckCircle2, XCircle } from "lucide-react";

interface Props {
    total: number;
    sent: number;
    failed: number;
}
const CampaignStatsCards = ({ total, sent, failed } : Props) => {
  const sentPercent = Math.round((sent / total) * 100);
  const failedPercent = Math.round((failed / total) * 100);

  return (
    <div className="gap-4 grid grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">{total}</p>
          <p className="text-muted-foreground text-xs">recipients</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-emerald-600 text-2xl">{sent}</p>
          <p className="text-muted-foreground text-xs">
            {sentPercent}% success
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-500" /> Failed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-red-600 text-2xl">{failed}</p>
          <p className="text-muted-foreground text-xs">
            {failedPercent}% failure
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignStatsCards;
