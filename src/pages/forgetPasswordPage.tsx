import { AuthLayout } from "../components/auth/AuthLayout";
import { ForgetPasswordForm } from "../components/auth/forgetPasswordForm";

const ForgetPasswordPage = () => {
  return (
    <AuthLayout
      title="Forgot Your Password?"
      description="No worries! We'll send you a secure link to create a new password for your PetAd account."
    >
      <ForgetPasswordForm />
    </AuthLayout>
  );
};

export default ForgetPasswordPage;
