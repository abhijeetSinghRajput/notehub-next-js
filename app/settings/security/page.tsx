// src/pages/Security.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Key, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LabeledInput } from "@/components//labeled-input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/lib/axios";
import { Monitor, Smartphone, Globe, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect } from "react";
import UpdateEmailCard from "@/components/UpdateEmailCard";
import SectionDivider from "@/components/ui/section-divider";

const Security = () => {
  const { updatePassword, isResettingPassword } = useAuthStore();

  return (
    <div className="p-4 pt-6 max-w-3xl mx-auto">
      <h1 className="sr-only">Security Settings</h1>

      <div className="space-y-10">
        <PasswordUpdateSection
          updatePassword={async ({ currentPassword, newPassword }) => {
            await updatePassword({ currentPassword, newPassword });
          }}
          isResettingPassword={isResettingPassword}
        />

        <UpdateEmailCard />

        <ActiveSessionsSection />
      </div>
    </div>
  );
};

interface PasswordUpdateSectionProps {
  updatePassword: (args: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  isResettingPassword: boolean;
}

function PasswordUpdateSection({
  updatePassword,
  isResettingPassword,
}: PasswordUpdateSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Validate inputs
    let isValid = true;
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!validatePassword(newPassword)) {
      newErrors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    await updatePassword({
      currentPassword,
      newPassword,
    });
    // Clear form on success
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-2">
      <SectionDivider icon={Key} label="CHANGE PASSWORD" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <LabeledInput
          id="currentPassword"
          label="Current Password"
          placeholder="Enter password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isResettingPassword}
          error={errors.currentPassword}
          showPasswordToggle
          inputClassName={errors.currentPassword && "ring-2 ring-red-500"}
        />

        {/* New Password */}
        <LabeledInput
          id="newPassword"
          label="New Password"
          placeholder="Enter password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isResettingPassword}
          error={errors.newPassword}
          showPasswordToggle
          inputClassName={errors.newPassword && "ring-2 ring-red-500"}
        />

        {/* Confirm New Password */}
        <LabeledInput
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="Enter password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isResettingPassword}
          error={errors.confirmPassword}
          showPasswordToggle
          inputClassName={errors.confirmPassword && "ring-2 ring-red-500"}
        />

        <div className="flex justify-between items-center">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline whitespace-nowrap"
          >
            Forgot your password?
          </Link>
          <Button type="submit" disabled={isResettingPassword}>
            {isResettingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Security;

interface Session {
  sessionId: string;
  deviceName: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

function ActiveSessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get("/auth/sessions");
      setSessions(res.data.sessions);
    } catch (error) {
      toast.error("Failed to load active sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutOther = async () => {
    try {
      await axiosInstance.post("/auth/logout-others");
      toast.success("Logged out from all other devices");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to logout other devices");
    }
  };

  const handleKillSession = async (sessionId: string) => {
    try {
      await axiosInstance.delete(`/auth/sessions/${sessionId}`);
      toast.success("Session terminated");
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (error) {
      toast.error("Failed to terminate session");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionDivider icon={ShieldCheck} label="ACTIVE SESSIONS" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage devices currently logged into your account.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button variant="outline" onClick={handleLogoutOther}>
            Log out all other devices
          </Button>
        )}
      </div>

      <div className="space-y-4 mt-6">
        {sessions.map((session) => {
          const isMobile =
            session.deviceName.toLowerCase().includes("mobile") ||
            session.deviceName.toLowerCase().includes("android") ||
            session.deviceName.toLowerCase().includes("ios");
          return (
            <div
              key={session.sessionId}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted rounded-full">
                  {isMobile ? (
                    <Smartphone className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.deviceName}</p>
                    {session.isCurrent && (
                      <Badge variant="secondary">This device</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {session.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {session.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" /> Last active:{" "}
                    {new Date(session.lastActiveAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleKillSession(session.sessionId)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start sm:self-center"
                >
                  Log out
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
