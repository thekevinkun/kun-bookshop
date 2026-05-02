import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { X, ChevronUp } from "lucide-react";

import { useAuthStore } from "../../store/auth";
import { useChat } from "../../hooks/useChat";

import ChatPanel from "./ChatPanel";

import { panelVariants } from "../../lib/animations";

const ChatWidget = () => {
  const { isHydrated } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { messages, isLoading, sendMessage, clearMessages } = useChat();

  const handleClose = () => {
    setIsOpen(false);
    clearMessages();
  };

  // Lock body scroll when the chat panel is open on desktop too (prevents
  // the page scrolling behind the overlay on shorter viewports)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Don't render widget on the contact page — it has its own embedded chatbot
  if (pathname === "/contact") return null;

  // Wait until auth is ready — prevents null userContext on first message
  if (!isHydrated) return null;

  return (
    // The entire widget is fixed bottom-right on DESKTOP only.
    // On mobile, this component renders nothing visible — BottomNav handles it.
    <div className="fixed z-50 bottom-6 right-6 flex flex-col items-end gap-3">
      {/* Chat panel — desktop only
          On mobile the panel is rendered by BottomNav.tsx, not here.
          We use hidden md:block so this panel never shows on small screens.
      */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chat-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              originX: 1, // Scale from right edge
              originY: 1, // Scale from bottom edge
            }}
            className="
              hidden md:flex
              w-98 max-h-[min(675px,85vh)] h-[min(675px,calc(100vh-3.5rem))]
              rounded-2xl overflow-hidden border border-white/10 
              flex-col bg-navy shadow-2xl shadow-black/50
            "
          >
            {/* Panel header */}
            <div
              className="
              flex items-center justify-between px-4 py-3
              bg-[#deb368] border-b border-white/15 flex-shrink-0
            "
            >
              <div>
                <p className="text-text-dark text-sm font-bold leading-none">
                  Talk with KUN!
                </p>
                <p className="text-black/75 text-[11px] mt-0.5">AI Assistant</p>
              </div>

              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-dark 
                  hover:bg-slate-200/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              className="flex-1 min-h-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble button — DESKTOP ONLY
          hidden on mobile (md:flex) — BottomNav has the KUN tab there.
      */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          hidden md:flex
          w-14 h-14 rounded-full bg-gradient-to-br from-[#173e82] to-[#123573] 
          hover:bg-gradient-to-tr hover:from-[#102347] hover:to-[#173B7A] 
          shadow-sm shadow-golden/20 items-center justify-center 
          transition-all duration-100 cursor-pointer relative overflow-hidden
        "
      >
        {/* Icon rotates between KUN logo and chevron-up based on open state */}
        <motion.div
          className="w-8 h-8 flex items-center justify-center rounded-full"
          animate={{ rotate: isOpen ? -180 : 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
            duration: 0.4,
          }}
        >
          {isOpen ? (
            <ChevronUp className="w-6 h-6 text-golden drop-shadow-sm" />
          ) : (
            <img
              src="/images/kun-chatbot-golden.webp"
              alt="KUN Chatbot"
              className="w-full h-full rounded-full object-contain"
            />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default ChatWidget;
