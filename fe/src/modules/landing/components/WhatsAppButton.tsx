import { WHATSAPP_CONFIG } from '../config/whatsappConfig';

/**
 * Componente de botón flotante de WhatsApp
 * Permite a los usuarios contactar por WhatsApp directamente desde la landing page
 */
export default function WhatsAppButton() {
  const { phoneNumber, defaultMessage, contactName } = WHATSAPP_CONFIG;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group"
      aria-label={`Contactar a ${contactName} por WhatsApp`}
      title={`Contactar a ${contactName}`}
    >
      {/* Botón circular verde */}
      <div className="relative w-14 h-14 bg-green-500 rounded-full shadow-lg hover:shadow-2xl hover:bg-green-600 transition-all duration-300 flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95">
        {/* Icono de teléfono SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-white"
          aria-hidden="true"
        >
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      </div>

      {/* Tooltip que aparece al pasar el mouse */}
      <div className="absolute right-16 bottom-0 bg-gray-800 text-white text-sm py-2 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg">
        Contáctanos por WhatsApp
        {/* Flecha del tooltip */}
        <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 w-0 h-0 border-l-8 border-l-gray-800 border-t-4 border-b-4 border-t-transparent border-b-transparent" />
      </div>
    </a>
  );
}
