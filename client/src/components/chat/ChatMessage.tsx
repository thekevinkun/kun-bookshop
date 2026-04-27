import ReactMarkdown from "react-markdown"; // Parses markdown from KUN's responses
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
              ? "bg-[#173e82] text-white rounded-br-sm" // User: teal, right corner flat
              : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm" // KUN: glass, left corner flat
          }
        `}
      >
        {/* ReactMarkdown renders bold, lists, line breaks from KUN's responses */}
        <div
          className="prose prose-invert prose-sm max-w-none
          prose-p:my-1 prose-p:leading-relaxed
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:my-1 prose-ul:pl-4
          prose-ol:my-1 prose-ol:pl-4
          prose-li:my-0.5
          prose-a:text-teal-400 prose-a:no-underline"
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Blinking cursor — only shown while KUN is still streaming this message */}
        {message.isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-golden/85 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
