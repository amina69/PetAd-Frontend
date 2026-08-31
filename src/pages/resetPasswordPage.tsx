import { AuthLayout } from "../components/auth/AuthLayout";
import { ResetPasswordForm } from "../components/auth/resetPasswordForm";

const ResetPasswordPage = () => {
  return (
    <AuthLayout
      title="Create a New Password"
      description="Choose a strong password for your PetAd account. Make it unique and memorable."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
