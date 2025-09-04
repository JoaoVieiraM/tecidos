import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

const WhatsAppButton = ({ 
  phoneNumber = "5513996479114", // WhatsApp Business da Letícia Tecidos
  message = "Olá! Visitei o site da Letícia Tecidos e gostaria de saber mais sobre os tecidos premium. Podem me ajudar com informações sobre preços, disponibilidade e modalidades de entrega?" 
}: WhatsAppButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir em nova aba
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Verificar se é horário comercial (segunda a sexta, 8h às 18h)
  const isBusinessHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = domingo, 1 = segunda, etc.
    const hour = now.getHours();
    
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 18;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 mb-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span>Fale conosco no WhatsApp</span>
            {isBusinessHours() ? (
              <div className="flex items-center gap-1 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400">
                <Clock size={12} />
                <span className="text-xs">Responderemos em breve</span>
              </div>
            )}
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
      
      {/* Botão Principal */}
      <Button
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-xl hover:scale-105 transition-all duration-300 animate-pulse hover:animate-none"
        size="icon"
        title="Fale conosco no WhatsApp"
      >
        {/* Ícone do WhatsApp usando SVG */}
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          className="drop-shadow-sm"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/>
        </svg>
      </Button>
    </div>
  );
};

export default WhatsAppButton;