import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Welcome to Haaibo Admin Portal | Secure Sign In"
        description="Access your HR, assets, and infrastructure management dashboard. Sign in to unlock intelligent business operations."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
