interface QuickRepliesProps {
  onSelect: (text: string) => void; // Called with the chip label when tapped
}

// Two rows of chips — informational then action
// Labels are the exact text sent as the user's message
const ROW_ONE = [
  { label: "🔍 Find a book", text: "Help me find a book" },
  { label: "❓ How downloads work", text: "How do downloads work?" },
  { label: "🎟 Check a coupon", text: "I want to check a coupon" },
];

const ROW_TWO = [
  { label: "🛒 View my Cart", text: "Show my cart" },
  { label: "📚 My Library", text: "Show my library" },
  { label: "📦 My Orders", text: "Show my orders" },
];

const QuickReplies = ({ onSelect }: QuickRepliesProps) => {
  return (
    // Wrapper — two rows of chips with a small gap between rows
    <div className="flex flex-col gap-2 px-3 py-2">
      {/* Row 1 — informational chips */}
      <div className="flex flex-wrap gap-1.5">
        {ROW_ONE.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onSelect(chip.text)} // Send the chip text as a message
            className="
              px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10
              text-slate-300 hover:text-teal-400 hover:border-teal-500/40 
              hover:bg-teal-500/10 transition-colors duration-150 cursor-pointer
            "
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Row 2 — action chips */}
      <div className="flex flex-wrap gap-1.5">
        {ROW_TWO.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onSelect(chip.text)} // Send the chip text as a message
            className="
              px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10
              text-slate-300 hover:text-teal-400 hover:border-teal-500/40 
              hover:bg-teal-500/10 transition-colors duration-150 cursor-pointer
            "
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;
