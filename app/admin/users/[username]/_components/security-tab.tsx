"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  MapPin,
  Clock,
  KeyRound,
  LogOut,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAdminStore } from "@/app/stores/useAdminStore";
import { Session } from "@/types/model";

interface SecurityTabProps {
  sessions: Session[];
  userId: string | undefined;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
}

const SecurityTab = ({ sessions, setSessions, userId }: SecurityTabProps) => {
  const { terminateSession, terminateAllSessions, updateUserPassword } =
    useAdminStore();
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);
  const [isTerminatingSession, setIsTerminatingSession] = useState<
    string | null
  >(null);

  const handleTerminateSession = async (sid: string) => {
    if (!userId) return;
    setIsTerminatingSession(sid);
    const success = await terminateSession(userId, sid);
    if (success) {
      setSessions((prev: Session[]) =>
        prev.filter((s: Session) => s.sessionId !== sid),
      );
    }
    setIsTerminatingSession(null);
  };

  const handleTerminateAll = async () => {
    if (!userId) return;
    setIsTerminatingAll(true);
    const success = await terminateAllSessions(userId);
    if (success) {
      setSessions([]);
    }
    setIsTerminatingAll(false);
  };

  const handlePasswordUpdate = async () => {
    if (!userId || !newPassword) return;
    setIsUpdatingPassword(true);
    const success = await updateUserPassword(userId, newPassword);
    if (success) {
      setNewPassword("");
    }
    setIsUpdatingPassword(false);
  };

  return (
    <>
      {/* SECURITY SETTINGS */}
      <div>
        <div className="stripe-divider" />
        <h2 className="px-4 py-1 text-2xl screen-line-top screen-line-bottom font-medium tracking-tight text-balance">
          SECURITY SETTINGS
        </h2>

        <div className="bg-card/50 p-6 border-b">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <Label htmlFor="newPassword">Reset User Password</Label>
            </div>
            <div className="flex sm:flex-row flex-col gap-3">
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 bg-background"
              />
              <Button
                variant="secondary"
                disabled={
                  !newPassword || newPassword.length < 6 || isUpdatingPassword
                }
                onClick={handlePasswordUpdate}
                className="shadow-sm"
              >
                {isUpdatingPassword ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Requirement: Minimum 6 characters. We recommend a mix of
              uppercase, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE SESSIONS */}
      <div>
        <div className="stripe-divider" />
        <div className="px-4 py-1 screen-line-top screen-line-bottom flex justify-between items-center">
          <div className="">
            <h2 className="text-2xl font-medium tracking-tight text-balance">
              ACTIVE SESSIONS
            </h2>
            <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              Connected Devices ({sessions.length})
            </p>
          </div>

          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTerminateAll}
              disabled={isTerminatingAll}
            >
              {isTerminatingAll ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOut />
              )}
              Logout all
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-muted/20 py-12 border border-dashed text-center">
              <div className="inline-flex justify-center items-center bg-muted mb-3 rounded-full size-12">
                <Monitor className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">
                No active sessions found for this user.
              </p>
            </div>
          ) : (
            <div className="screen-line-bottom">
              {sessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="group flex items-center gap-4 bg-card/50 hover:bg-card p-4 border-t transition-colors"
                >
                  <div className="flex justify-center items-center bg-muted group-hover:bg-background rounded-full size-10 transition-colors shrink-0">
                    {s.deviceName.toLowerCase().includes("mobile") ||
                    s.deviceName.toLowerCase().includes("phone") ||
                    s.deviceName.toLowerCase().includes("android") ||
                    s.deviceName.toLowerCase().includes("iphone") ? (
                      <Smartphone className="size-5 text-muted-foreground" />
                    ) : (
                      <Monitor className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {s.deviceName}
                      </p>
                      {s.isCurrent && (
                        <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full font-bold text-[10px] text-green-700 dark:text-green-400">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="flex items-center text-[11px] text-muted-foreground">
                        <MapPin className="opacity-70 mr-1 size-3" />{" "}
                        {s.location}
                      </span>
                      <span className="flex items-center text-[11px] text-muted-foreground">
                        <Clock className="opacity-70 mr-1 size-3" />{" "}
                        {new Date(s.lastActiveAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 size-8 text-muted-foreground hover:text-destructive"
                    disabled={isTerminatingSession === s.sessionId}
                    onClick={() => handleTerminateSession(s.sessionId)}
                  >
                    {isTerminatingSession === s.sessionId ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SecurityTab;
