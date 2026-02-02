import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email is required.");
      return;
    }
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_URL as string | undefined;
      const url = `${base || ""}/api/auth/request-password-reset`;
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      }).catch(() => {});
      setSent(true);
    } catch {
      // Even if call fails, we avoid leaking existence — show generic error
      setError("Unable to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Forgot Password"
        description="Request a password reset link sent to your email."
      />
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="mb-5 sm:mb-8 text-center">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Forgot Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email to receive a reset link.
              </p>
            </div>

            {sent ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  If an account exists for this email, a reset link has been sent. Please check your inbox.
                </div>
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-sm">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {error && <div className="text-error-500 text-sm">{error}</div>}

                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>

                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Remembered your password? <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign in</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
