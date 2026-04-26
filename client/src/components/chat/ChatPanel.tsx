import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import ChatMessage from "./ChatMessage";
import QuickReplies from "./QuickReplies";

import type { ChatMessage as ChatMessageType } from "../../types/chat";

interface ChatPanelProps {
  messages: ChatMessageType[]; // Full conversation history
  isLoading: boolean; // true = show typing indicator
  onSendMessage: (text: string) => void; // Called when user sends a message
  className?: string; // Optional extra classes for sizing
}

const ChatPanel = ({
  messages,
  isLoading,
  onSendMessage,
  className = "",
}: ChatPanelProps) => {
  // inputValue — controlled input state for the message text field
  const [inputValue, setInputValue] = useState("");

  // messagesEndRef — a hidden div at the bottom of the message list
  // We scroll to it whenever new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // showQuickReplies — true until the user sends their first message
  // Once the conversation starts, chips disappear permanently
  const showQuickReplies = messages.length === 0;

  // Auto-scroll to the bottom whenever messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Smooth scroll to latest message
  }, [messages, isLoading]);

  // handleSend — called by button click or Enter key
  // Trims input, calls onSendMessage, then clears the field
  const handleSend = () => {
    const trimmed = inputValue.trim(); // Remove leading/trailing whitespace
    if (!trimmed) return; // Ignore empty submissions
    onSendMessage(trimmed); // Pass to useChat's sendMessage
    setInputValue(""); // Clear the input field
  };

  // handleKeyDown — allow Enter to send, Shift+Enter to add a newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter alone = send
      e.preventDefault(); // Prevent the default newline
      handleSend();
    }
    // Shift+Enter falls through and adds a newline naturally
  };

  return (
    // Panel wrapper — flex column so messages take all space, input stays at bottom
    <div className={`flex flex-col bg-navy ${className}`}>
      {/* Message list */}
      <div className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 
        scrollbar-track-transparent hover:scrollbar-thumb-white/30"
        >
          {/* Empty state — shown before any messages */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4 py-8">
              {/* KUN avatar */}
              <img
                src="/images/kun-chatbot-golden.webp"
                alt="KUN Chatbot"
                className="w-16 h-16 object-contain"
              />

              <p className="text-slate-300 text-sm font-medium">Hi! I'm KUN</p>
              <p className="text-slate-500 text-xs">
                Your Kun Bookshop assistant. Ask me anything!
              </p>
            </div>
          )}

          {/* Render each message bubble */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing indicator — shown while waiting for the first token */}
          {isLoading && (
            <div className="flex p-3 items-end gap-2">
              {/* KUN avatar */}
              <div className="flex flex-shrink-0">
                <img
                  src="/images/kun-chatbot-golden.webp"
                  alt="KUN Chatbot"
                  className="w-7 h-7 object-contain"
                />
              </div>
              {/* Three animated dots */}
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Invisible div at the bottom — we scroll here on new messages */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick-reply chips */}
      {/* Only shown before the first message is sent */}
      {showQuickReplies && (
        <div className="border-t border-white/5">
          <QuickReplies onSelect={onSendMessage} />
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/10 px-3 py-2.5 flex items-end gap-2">
        {/* Textarea — auto-grows with content, max 3 lines */}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)} // Update controlled state
          onKeyDown={handleKeyDown} // Enter to send
          placeholder="Ask KUN anything..."
          rows={1}
          maxLength={500} // Hard cap matches backend sanitizer
          className="
            flex-1 resize-none bg-white/5 border border-white/10
            rounded-xl px-3 py-2 text-base text-slate-200 placeholder:text-slate-500
            focus:outline-none focus:border-golden/25 focus:bg-white/8
            transition-colors duration-150 max-h-24 overflow-y-auto
            scrollbar-thin scrollbar-thumb-white/10
          "
          style={{ fieldSizing: "content" } as React.CSSProperties} // Auto-grow with content
        />

        {/* Send button — disabled when input is empty or KUN is typing */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading} // Disable if nothing to send
          className="
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            bg-[#173e82] hover:bg-[#123573] disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150 cursor-pointer
          "
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
