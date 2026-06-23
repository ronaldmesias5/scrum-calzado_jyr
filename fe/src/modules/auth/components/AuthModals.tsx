/**
 * AuthModals.tsx — Container managing auth modal state and view switching.
 * Renders login, register, and forgot-password modals over the landing page.
 * Uses the existing Modal component with blur variant.
 *
 * Usage:
 *   const { view, openLogin, openRegister, openForgot, close, AuthModals } = useAuthModals();
 *   // Pass openLogin/openRegister to LandingHeader, HeroSection, etc.
 *   // Render <AuthModals /> in LandingPage
 */

import { useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ReactivationForm } from "./ReactivationForm";
import { useTranslation } from "react-i18next";
import { useToast } from "@/context/ToastContext";

type AuthView = "login" | "register" | "forgot" | "reactivation";

export function useAuthModals() {
  const [view, setView] = useState<AuthView | null>(null);

  const openLogin = useCallback(() => setView("login"), []);
  const openRegister = useCallback(() => setView("register"), []);
  const openForgot = useCallback(() => setView("forgot"), []);
  const openReactivation = useCallback(() => setView("reactivation"), []);
  const close = useCallback(() => setView(null), []);

  const switchToLogin = useCallback(() => setView("login"), []);
  const switchToRegister = useCallback(() => setView("register"), []);
  const switchToForgot = useCallback(() => setView("forgot"), []);
  const switchToReactivation = useCallback(() => setView("reactivation"), []);

  return {
    view,
    openLogin,
    openRegister,
    openForgot,
    openReactivation,
    close,
    switchToLogin,
    switchToRegister,
    switchToForgot,
    switchToReactivation,
  };
}

export function AuthModals({
  view,
  onClose,
  onSwitchToLogin,
  onSwitchToRegister,
  onSwitchToForgot,
  onSwitchToReactivation,
}: {
  view: "login" | "register" | "forgot" | "reactivation" | null;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  onSwitchToReactivation?: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleRegisterSuccess = useCallback(() => {
    onClose();
    showToast("¡Registro exitoso! Ya puedes iniciar sesión.");
  }, [onClose, showToast]);

  return (
    <>
      {/* Login Modal */}
      <Modal
        isOpen={view === "login"}
        onClose={onClose}
        title={t('common.login')}
        size="md"
        variant="blur"
      >
        <div className="px-2 py-4">
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={onSwitchToRegister}
            onSwitchToForgot={onSwitchToForgot}
            onSwitchToReactivation={onSwitchToReactivation}
          />
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={view === "register"}
        onClose={onClose}
        title={t('common.register')}
        size="2xl"
        variant="blur"
      >
        <div className="px-2 py-4">
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={onSwitchToLogin}
          />
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={view === "forgot"}
        onClose={onClose}
        title="Recuperar contraseña"
        size="md"
        variant="blur"
      >
        <div className="px-2 py-4">
          <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />
        </div>
      </Modal>

      {/* Reactivation Modal */}
      <Modal
        isOpen={view === "reactivation"}
        onClose={onClose}
        title="Solicitar reactivación de cuenta"
        size="md"
        variant="blur"
      >
        <div className="px-2 py-4">
          <ReactivationForm onSwitchToLogin={onSwitchToLogin} />
        </div>
      </Modal>
    </>
  );
}