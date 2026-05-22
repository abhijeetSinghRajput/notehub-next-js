import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const AdminDashboardCard = () => {
  return (
    <Card className="max-w-3xl mx-auto mt-4 overflow-hidden shadow-sm">
      <CardContent className="p-4">
        <Link
          href="/admin"
          className="flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Admin Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Manage users and site settings
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardCard;