import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../context/useToast";
import { CheckLineIcon, CloseLineIcon } from "../../icons";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search || window.location.search);
    return params.get("token") || "";
  }, [location.search]);

  useEffect(() => {
    // Clear messages when inputs change
    setError(null);
    setSuccess(null);
  }, [newPassword, confirmPassword]);

  const validate = () => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return false;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const lengthOk = newPassword.length >= 8;
  const matches = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = (() => {
    let score = 0;
    if (lengthOk) score += 1;
    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    if (hasSymbol) score += 1;
    return score; // 0-5
  })();

  const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][Math.max(0, strengthScore - 1)] || "Very Weak";
  const strengthPercent = Math.round((strengthScore / 5) * 100);
  const strengthColor = strengthScore < 2 ? "bg-error-500" : strengthScore < 3 ? "bg-warning-500" : strengthScore < 5 ? "bg-brand-500" : "bg-emerald-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_URL as string | undefined;
      const url = `${base || ""}/api/auth/reset-password`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
        credentials: "include",
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ message: "Invalid or expired token." }));
        setError(data?.message || "Invalid or expired token.");
        setLoading(false);
        return;
      }

      setSuccess("Password updated successfully. Redirecting to sign-in...");
      toast.success("Password updated successfully");
      setLoading(false);
      setTimeout(() => navigate("/signin"), 1500);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  const tokenMissing = !token;

  return (
    <>
      <PageMeta
        title="Reset Your Password"
        description="Enter a new password to complete your account setup."
      />
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="mb-5 sm:mb-8 text-center">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Set a New Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tokenMissing ? "Your link is invalid or expired." : "Enter and confirm your new password."}
              </p>
            </div>

            {tokenMissing ? (
              <div className="text-sm text-error-500">
                Invalid reset link. Please request a new one from the forgot password page.
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  {/* Strength meter */}
                  <div className="mt-2">
                    <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded ${strengthColor}`}
                        style={{ width: `${strengthPercent}%`, transition: "width 200ms ease" }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Strength: {strengthLabel}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>
                    Confirm Password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Requirements inline */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {lengthOk ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {matches ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">Passwords match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasLower ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpper ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDigit ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">Number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSymbol ? (
                      <CheckLineIcon className="size-4 text-emerald-500" />
                    ) : (
                      <CloseLineIcon className="size-4 text-error-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">Symbol</span>
                  </div>
                </div>

                {error && (
                  <div className="text-error-500 text-sm">{error}</div>
                )}
                {success && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm">{success}</div>
                )}

                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Resetting…" : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
