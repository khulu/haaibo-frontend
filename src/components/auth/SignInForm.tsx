import { useState } from "react";
import { Link } from "react-router-dom";
import {  EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import useAuth from "@hooks/auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function SignInForm() {
  const navigate = useNavigate();
  const { usePostLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

const postLogin = usePostLogin(email, password); 

  interface Errors {
    email: string;
    password: string;
  }

  interface HandleSubmitEvent extends React.FormEvent<HTMLFormElement> {}

  const handleSubmit = (e: HandleSubmitEvent) => {
    e.preventDefault();
    let valid = true;
    let newErrors: Errors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required.";
      valid = false;
    }
    if (!password) {
      newErrors.password = "Password is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    postLogin.mutate(undefined, {
      onSuccess: (data: any) => {
        // Prefer role from response, fallback to stored user
        const respUser = data?.user;
        let role = respUser?.role;
        if (!role) {
          try {
            const raw = localStorage.getItem('user');
            if (raw) {
              const parsed = JSON.parse(raw);
              role = parsed?.role;
            }
          } catch {}
        }

        if (role === 'Employee' || role === 2) {
          navigate('/employee-dashboard');
        } else {
          navigate('/');
        }
      },
    });
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex flex-col items-center max-w-xs mb-6">
          <img
            width={231}
            height={48}
            src="/images/logo/haiibo-logo-white-background.png"
            alt="Logo"
          />
        </div>
        <div className="w-full flex flex-col items-center">
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div className="w-full flex flex-col items-center">
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@haiibo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <span className="text-error-500 text-xs mt-1 block">{errors.email}</span>
                  )}
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <span className="text-error-500 text-xs mt-1 block">{errors.password}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
