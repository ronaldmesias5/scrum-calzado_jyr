/**
 * LandingPage.tsx — Landing page with auth modals overlay.
 * Login, register, and forgot-password are now modals over this page.
 * Supports URL params: ?login=true, ?register=true to auto-open modals.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LandingHeader from '@/features/landing/components/organisms/LandingHeader';
import LandingFooter from '@/features/landing/components/organisms/LandingFooter';
import HeroSection from '@/features/landing/components/organisms/HeroSection';
import CategoriesSection from '@/features/landing/components/organisms/CategoriesSection';
import AsessoriaSection from '@/features/landing/components/organisms/AsessoriaSection';
import WhyChooseUsSection from '@/features/landing/components/organisms/WhyChooseUsSection';
import CTAFinalSection from '@/features/landing/components/organisms/CTAFinalSection';
import WhatsAppButton from '@/features/landing/components/atoms/WhatsAppButton';
import {
  AuthModals,
  useAuthModals
} from '@/features/auth/components/organisms/AuthModals';

export default function LandingPage() {
  const {
    view,
    openLogin,
    openRegister,
    close,
    switchToLogin,
    switchToRegister,
    switchToForgot,
    switchToReactivation
  } = useAuthModals();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open modal based on URL params (?login=true, ?register=true)
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      openLogin();
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('register') === 'true') {
      openRegister();
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader onLoginClick={openLogin} onRegisterClick={openRegister} />
      <main id="main-content" className="flex-1">
        <HeroSection onLoginClick={openLogin} />
        <CategoriesSection />
        <AsessoriaSection />
        <WhyChooseUsSection />
        <CTAFinalSection onRegisterClick={openRegister} />
      </main>
      <LandingFooter />
      <WhatsAppButton />

      <AuthModals
        view={view}
        onClose={close}
        onSwitchToLogin={switchToLogin}
        onSwitchToRegister={switchToRegister}
        onSwitchToForgot={switchToForgot}
        onSwitchToReactivation={switchToReactivation}
      />
    </div>
  );
}
