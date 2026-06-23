import { AuthLayout } from "@/components/layout/AuthLayout";
import { ReactivationForm } from "../components/ReactivationForm";

export function ReactivationPage() {
  return (
    <AuthLayout
      title="Solicitar reactivación de cuenta"
      subtitle="Completa el formulario para solicitar la reactivación de tu cuenta"
    >
      <ReactivationForm onSwitchToLogin={() => window.location.href = "/"} />
    </AuthLayout>
  );
}
