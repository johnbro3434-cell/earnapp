import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function WhatsAppButton() {
  const { settings } = useAuth();
  const rawNumber = settings?.whatsappNumber || '+8801700112233';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

  const handleClick = () => {
    window.open(`https://wa.me/${cleanNumber}?text=Hello%20EarnHub%20BD%20Support,%20I%20need%20assistance.`, '_blank');
  };

  return (
    <motion.button
      id="btn-whatsapp-floating"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(37, 211, 102, 0.5)',
          '0 0 0 14px rgba(37, 211, 102, 0)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      onClick={handleClick}
      className="fixed bottom-20 md:bottom-8 right-5 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full font-semibold shadow-2xl transition-all cursor-pointer"
      title="Chat with WhatsApp Support 24/7"
    >
      <MessageCircle className="w-6 h-6 fill-current" />
      <span className="hidden sm:inline text-sm font-medium">WhatsApp Support</span>
    </motion.button>
  );
}
