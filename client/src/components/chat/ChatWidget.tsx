import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Add Framer Motion

import { X, ChevronUp } from "lucide-react";

import { useAuthStore } from "../../store/auth";
import { useChat } from "../../hooks/useChat";

import ChatPanel from "./ChatPanel";

import { panelVariants } from "../../lib/animations";

const ChatWidget = () => {
  // Pull user from auth store to personalize the greeting
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { messages, isLoading, sendMessage, clearMessages, isAuthenticated } =
    useChat();

  const handleClose = () => {
    setIsOpen(false);
    clearMessages();
  };

  if (pathname === "/contact") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Animated Chat panel with AnimatePresence */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chat-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              originX: 1, // Right edge
              originY: 1, // Bottom edge
            }}
            className="
              w-80 sm:w-98 h-[670px] rounded-2xl overflow-hidden
              border border-white/10 shadow-2xl shadow-black/50
              flex flex-col bg-navy
            "
          >
            {/* Panel header */}
            <div
              className="
              flex items-center justify-between px-4 py-3
              bg-[#deb368] border-b border-white/15 flex-shrink-0
            "
            >
              <div className="">
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
              firstName={user?.firstName ?? null}
              isAuthenticated={isAuthenticated}
              className="flex-1 min-h-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          w-14 h-14 rounded-full bg-gradient-to-br from-[#173e82] to-[#123573] 
          hover:bg-gradient-to-tr hover:from-[#102347] hover:to-[#173B7A] 
          shadow-sm shadow-golden/20 flex items-center justify-center 
          transition-all duration-100 cursor-pointer relative overflow-hidden
        "
      >
        {/* Animated Icon Container */}
        <motion.div
          className="w-8 h-8 flex items-center justify-center rounded-full"
          // Rotate 90° clockwise when closing, -90° counterclockwise when opening
          animate={{
            rotate: isOpen ? -180 : 0,
          }}
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
