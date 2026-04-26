import type { ChatMessage as ChatMessageType } from "../../types/chat"; // Our message type

interface ChatMessageProps {
  message: ChatMessageType; // The message to render
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user"; // true = right-aligned user bubble

  return (
    // Outer wrapper — flex row, aligned right for user, left for KUN
    <div
      className={`flex p-3 items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* KUN's avatar — only shown for assistant messages */}
      {!isUser && (
        <div className="flex flex-shrink-0">
          <img
            src="/images/kun-chatbot-golden.webp"
            alt="KUN Chatbot"
            className="w-7 h-7 object-contain"
          />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`
          max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
          ${
            isUser
              ? "bg-teal-500 text-white rounded-br-sm" // User: teal, right corner flat
              : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm" // KUN: glass, left corner flat
          }
        `}
      >
        {/* Render the message content — preserve newlines with whitespace-pre-wrap */}
        <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>

        {/* Blinking cursor — only shown while KUN is still streaming this message */}
        {message.isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-teal-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
