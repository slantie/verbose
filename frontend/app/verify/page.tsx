"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: localStorage.getItem("verification_email"),
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email verified",
          description: "You can now log in to your account",
        });
        router.push("/login");
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Verification failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = localStorage.getItem("verification_email");
      const response = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          resend: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Code resent",
          description: "A new verification code has been sent to your email",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Verify your email
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter the verification code sent to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={otp[index] || ""}
                    className="w-12 h-12 text-center text-2xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onChange={(e) => {
                      const newOtp = otp.split("");
                      newOtp[index] = e.target.value;
                      setOtp(newOtp.join(""));

                      if (e.target.value && e.target.nextElementSibling) {
                        (
                          e.target.nextElementSibling as HTMLInputElement
                        ).focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Backspace" &&
                        !otp[index] &&
                        (e.target as HTMLInputElement).previousElementSibling
                      ) {
                        (
                          (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement
                        ).focus();
                      }
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            <div className="text-center text-sm">
              Didn&apos;t receive a code?{" "}
              <button
                type="button"
                className="font-medium text-primary underline"
                onClick={handleResend}
              >
                Resend
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
