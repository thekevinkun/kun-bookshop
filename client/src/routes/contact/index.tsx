import { useState, useEffect } from "react";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";

import { useAuthStore } from "../../store/auth";
import { useChat } from "../../hooks/useChat";

import ChatPanel from "../../components/chat/ChatPanel";

import { TOPIC_CHIPS, FAQ_ITEMS } from "../../lib/constants";

// FAQItem — a single collapsible accordion row
const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  // isOpen — controls whether this item's answer is visible
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-0">
      {/* Question row — clicking toggles the answer */}
      <button
        onClick={() => setIsOpen((prev) => !prev)} // Toggle open state
        tabIndex={-1}
        className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer group"
      >
        <span className="text-slate-200 text-sm font-medium group-hover:text-golden/80 transition-colors">
          {question}
        </span>
        {/* Chevron rotates when open */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-golden/80 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Answer — only rendered when open */}
      {isOpen && (
        <p className="text-slate-400 text-sm leading-relaxed pb-4">{answer}</p>
      )}
    </div>
  );
};

// ContactPage — main component
const ContactPage = () => {
  // Pull auth state for the hero greeting and ChatPanel personalization
  const { user, isAuthenticated } = useAuthStore();

  // Chat state — same hook as ChatWidget, fresh instance for this page
  const { messages, isLoading, sendMessage, clearMessages } = useChat();

  // Clear messages on unmount so navigating away resets the conversation
  useEffect(() => {
    return () => clearMessages(); // Cleanup on unmount
  }, []); // Empty deps — runs once on unmount only

  // handleTopicChip — fires a preset message and scrolls to the chat panel
  const handleTopicChip = (text: string) => {
    // 1. Capture current scroll position
    const currentScrollY = window.scrollY;

    // 2. Send message
    sendMessage(text);

    // 3. Force stay at current position (triple-fire beats all scroll effects)
    const lockScroll = () => {
      window.scrollTo({ top: currentScrollY, left: 0, behavior: "instant" });
    };

    requestAnimationFrame(lockScroll);
    setTimeout(lockScroll, 50);
    setTimeout(lockScroll, 150); // Covers ChatPanel scrollToBottom delays
  };

  return (
    <main className="min-h-screen bg-dark">
      {/* 1. HERO */}
      <section className="border-b border-white/10">
        <div className="container-page py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left — heading + topic chips */}
            <div className="flex flex-col gap-6">
              {/* Greeting */}
              <div>
                <p className="text-golden text-sm font-medium tracking-wide uppercase mb-2">
                  Help Center
                </p>
                <h1 className="!text-3xl lg:!text-4xl font-bold text-slate-100 leading-tight">
                  {isAuthenticated && user?.firstName
                    ? `Hi ${user.firstName}, how can we help?`
                    : "Hi there, how can we help?"}
                </h1>
                <p className="text-slate-400 text-base mt-3 leading-relaxed">
                  Ask KUN anything about your orders, downloads, formats, or
                  account — or browse the topics below.
                </p>
              </div>

              {/* Topic category chips */}
              <div className="flex flex-col gap-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                  Browse by topic
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleTopicChip(chip.text)} // Fire preset message
                      tabIndex={-1}
                      className="
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-white/5 border border-white/10
                        text-slate-300 text-sm
                        hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-400
                        transition-all duration-150 cursor-pointer
                      "
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — KUN chat panel, open by default */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 flex flex-col">
              {/* Chat panel header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-[#1e293b] border-b border-white/10 flex-shrink-0">
                {/* KUN avatar */}
                <div>
                  <p className="text-slate-200 text-sm font-semibold leading-none">
                    Talk with KUN!
                  </p>
                  <p className="text-golden/80 text-[10px] mt-0.5">
                    AI Assistant
                  </p>
                </div>
                {/* Online indicator */}
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-slate-500 text-xs">Online</span>
                </div>
              </div>

              {/* ChatPanel — same component as the widget, full height here */}
              <ChatPanel
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                firstName={user?.firstName ?? null}
                isAuthenticated={isAuthenticated}
                className="h-[420px]" // Fixed height on desktop — scrollable inside
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FAQ ACCORDION */}
      <section className="border-b border-white/10">
        <div className="container-page py-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Common questions
            </p>
            <h2 className="text-2xl font-bold text-slate-100 mb-8">
              Frequently Asked Questions
            </h2>

            {/* FAQ items */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-6">
              {FAQ_ITEMS.map((item) => (
                <FAQItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTACT INFO */}
      <section>
        <div className="container-page py-12">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Still need help?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              KUN handles most questions instantly. For anything else, reach out
              directly — we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:hello@kunbookshop.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-white/5 border border-white/10 text-slate-300 text-sm
                hover:border-teal-500/40 hover:text-teal-400 hover:bg-teal-500/10
                transition-all duration-150"
            >
              <Mail className="w-4 h-4" />
              hello@kunbookshop.com
            </a>
            <p className="text-slate-600 text-xs">
              KUN is AI-powered — responses are instant but not a substitute for
              human support on complex issues.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
