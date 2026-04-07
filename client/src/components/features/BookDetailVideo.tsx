import { Play } from "lucide-react";

interface Props {
  posterUrl: string;
  videoUrl: string; // Always a real YouTube embed URL — component only renders if this exists
}

// This component is only rendered from [id].tsx when book.videoUrl is defined
// So we never need a fallback video here — if there's no URL, the parent hides us entirely
const BookDetailVideo = ({ videoUrl }: Props) => {
  // Confirm it's a YouTube embed URL — just a safety check
  const isYouTube = videoUrl.includes("youtube.com/embed");

  // If somehow a non-YouTube URL slipped through, don't render anything broken
  if (!isYouTube) return null;

  return (
    <div>
      <h2 className="text-text-light text-lg font-semibold mb-4 flex items-center gap-2">
        <Play size={16} className="text-teal" />
        Video
      </h2>
      <div className="rounded-xl overflow-hidden bg-dark aspect-video border border-bg-hover">
        <iframe
          src={videoUrl}
          title="Book trailer"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default BookDetailVideo;
