import { useState } from "react";
import { Mail, FileText, Phone } from "lucide-react";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { requestReactivation, type ReactivationRequest } from "../services/api";

interface ReactivationFormProps {
  onSwitchToLogin?: () => void;
}

export function ReactivationForm({ onSwitchToLogin }: ReactivationFormProps) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    identity_document: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.phone || !formData.identity_document) {
      showToast("Todos los campos son obligatorios.", "error");
      return;
    }

    if (formData.phone.trim().length < 7) {
      showToast("El teléfono debe tener al menos 7 caracteres.", "error");
      return;
    }

    if (formData.identity_document.trim().length < 8) {
      showToast("El documento de identidad debe tener al menos 8 caracteres.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload: ReactivationRequest = {
        email: formData.email.trim(),
        reason: "Solicitud de reactivación de cuenta",
        phone: formData.phone.trim(),
        identity_document: formData.identity_document.trim(),
      };
      const response = await requestReactivation(payload);
      showToast(response.message, "success");
      setFormData({ email: "", phone: "", identity_document: "" });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        showToast(detail, "error");
      } else if (Array.isArray(detail)) {
        showToast(detail.map((d: any) => d.msg).join(". "), "error");
      } else {
        showToast("Error al enviar la solicitud. Inténtalo de nuevo.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <InputField
        label="Correo electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="tucorreo@ejemplo.com"
        icon={<Mail size={18} />}
      />

      <InputField
        label="Número de teléfono"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="3001234567"
        icon={<Phone size={18} />}
      />

      <InputField
        label="Documento de identidad"
        name="identity_document"
        type="text"
        value={formData.identity_document}
        onChange={handleChange}
        placeholder="1234567890"
        icon={<FileText size={18} />}
      />

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Importante:</strong> Solo puedes solicitar reactivación si tu cuenta está{" "}
          <strong>inactiva o suspendida</strong>.
        </p>
      </div>

      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? "Enviando solicitud..." : "Enviar solicitud"}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
        >
          Volver al inicio de sesión
        </button>
      </p>
    </form>
  );
}
