import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components//labeled-input";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/app/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import BadgeIcon from "./icons/BadgeIcon";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import { isEmail } from "@/lib/validator";
import Image from "next/image";

const UpdateEmailCard = () => {
  const {
    requestEmailUpdateOtp,
    confirmEmailUpdate,
    isEmailAvailable,
    isSendingOtp,
    isUpdatingEmail,
    authUser,
  } = useAuthStore();

  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"available" | "taken" | null>(
    null,
  );
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    async (email: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setCheckingEmail(true);

      try {
        const available = await isEmailAvailable(email, controller.signal);

        if (available === null || abortRef.current !== controller) return;

        setEmailStatus(available ? "available" : "taken");
        setEmailError(available ? "" : "Email already in use");
      } catch {
        if (abortRef.current !== controller) return;
        setEmailStatus(null);
      } finally {
        if (abortRef.current === controller) {
          setCheckingEmail(false);
        }
      }
    },
    [isEmailAvailable],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const debouncedCheckAvailability = useDebounceCallback(
    checkAvailability,
    500,
  );

  useEffect(() => {
    if (!newEmail) {
      abortRef.current?.abort();
      debouncedCheckAvailability.cancel();

      setEmailStatus(null);
      setEmailError("");
      setCheckingEmail(false);
      return;
    }

    const trimmedEmail = newEmail.trim();

    if (!isEmail(trimmedEmail)) {
      abortRef.current?.abort();
      debouncedCheckAvailability.cancel();

      setEmailStatus(null);
      setEmailError("Invalid email format");
      setCheckingEmail(false);
      return;
    }

    setEmailError("");
    setEmailStatus(null);
    debouncedCheckAvailability(trimmedEmail);

    return () => debouncedCheckAvailability.cancel();
  }, [newEmail, debouncedCheckAvailability]);

  // OTP cooldown
  useEffect(() => {
    if (!cooldown) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (emailStatus !== "available") return;
    const res = await requestEmailUpdateOtp(newEmail);
    if (res) setCooldown(60);
  };

  const handleConfirmEmail = async () => {
    if (otp.length !== 6) return;

    debouncedCheckAvailability.cancel();
    abortRef.current?.abort();

    const res = await confirmEmailUpdate({ email: newEmail, otp });

    setNewEmail("");
    setOtp("");
    setEmailError("");
    setEmailStatus(null);
    setCheckingEmail(false);
    setCooldown(0);
  };

  if (!authUser) return null;

  return (
    <div className="space-y-2">
      <Label>Update Email Address</Label>
      <div className="space-y-4">
        <div className="flex gap-2 bg-accent/50 p-2 px-3 rounded-xl items-center">
          <div className="relative size-10 shrink-0 rounded-full overflow-hidden">
            <Image
              src={authUser.avatar || "/avatar.svg"}
              alt={authUser.fullName || "User avatar"}
              fill
              sizes="40px"
              className="object-cover"
              loading="lazy"
              fetchPriority="low"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-1.5">
              <strong className="font-semibold">{authUser.fullName}</strong>
              {authUser.role === "admin" && (
                <BadgeIcon className="size-3.5 text-blue-500" />
              )}
            </div>
            <p className="text-muted-foreground text-xs">{authUser.email}</p>
          </div>
        </div>

        <LabeledInput
          id="new-email"
          label="New Email"
          placeholder="you@example.com"
          inputClassName={cn(
            emailStatus === "available" &&
              "focus-visible:ring-green-500 border-green-500/50 bg-green-500/5",
            emailStatus === "taken" &&
              "focus-visible:ring-destructive border-destructive/50 bg-destructive/5",
          )}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          error={emailError}
          disabled={isUpdatingEmail}
          loading={checkingEmail}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={isUpdatingEmail}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            variant="outline"
            onClick={handleSendOtp}
            disabled={
              emailStatus !== "available" ||
              cooldown > 0 ||
              isSendingOtp ||
              checkingEmail
            }
          >
            {isSendingOtp ? (
              <Loader2 className="animate-spin size-4" />
            ) : cooldown > 0 ? (
              cooldown
            ) : (
              "Get OTP"
            )}
          </Button>
        </div>

        <Button
          className="w-full sm:w-max"
          onClick={handleConfirmEmail}
          disabled={isUpdatingEmail || otp.length !== 6}
        >
          {isUpdatingEmail ? (
            <>
              <Loader2 className="animate-spin mr-2 size-4" />
              Updating...
            </>
          ) : (
            "Update Email"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateEmailCard;
