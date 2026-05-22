import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <div
      key={location.pathname + location.search}
      className="animate-in fade-in duration-500"
    >
      {children}
    </div>
  );
}
