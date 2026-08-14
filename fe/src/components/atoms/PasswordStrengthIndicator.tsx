import { useEffect, useState } from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { t } = useTranslation();
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    setRequirements([
      { id: "length", label: t("auth.passwordReq.length"), met: password.length >= 8 },
      { id: "upper", label: t("auth.passwordReq.upper"), met: /[A-Z]/.test(password) },
      { id: "lower", label: t("auth.passwordReq.lower"), met: /[a-z]/.test(password) },
      { id: "number", label: t("auth.passwordReq.number"), met: /[0-9]/.test(password) },
      { id: "special", label: t("auth.passwordReq.special"), met: /[^A-Za-z0-9]/.test(password) },
    ]);
  }, [password, t]);

  const metCount = requirements.filter((r) => r.met).length;
  const strengthColor = 
    metCount <= 2 ? "bg-red-500" : 
    metCount <= 4 ? "bg-yellow-500" : 
    "bg-green-500";
    
  const strengthLabel = 
    metCount <= 2 ? t("auth.passwordStrength.weak") : 
    metCount <= 4 ? t("auth.passwordStrength.medium") : 
    t("auth.passwordStrength.strong");

  return (
    <div className="mt-2 space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {metCount <= 2 ? <ShieldAlert className="w-4 h-4 text-red-500" /> : 
           metCount <= 4 ? <Shield className="w-4 h-4 text-yellow-500" /> : 
           <ShieldCheck className="w-4 h-4 text-green-500" />}
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            {strengthLabel}
          </span>
        </div>
        <span className="text-xs text-gray-400">{metCount}/5</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${strengthColor}`}
          style={{ width: `${(metCount / 5) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-center gap-2">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            )}
            <span className={`text-[11px] ${req.met ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
