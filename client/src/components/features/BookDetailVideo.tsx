import { Play } from "lucide-react";
import { PLACEHOLDER_VIDEO } from "../../lib/data";

interface Props {
  posterUrl: string;
  videoUrl?: string; // Real YouTube embed URL from the book model
}

const BookDetailVideo = ({ posterUrl, videoUrl }: Props) => {
  // If a YouTube embed URL exists, show it in an iframe
  // Otherwise fall back to the placeholder mp4 video
  const isYouTube = videoUrl && videoUrl.includes("youtube.com/embed");

  return (
    <div>
      <h2 className="text-text-light text-lg font-semibold mb-4 flex items-center gap-2">
        <Play size={16} className="text-teal" />
        Video
      </h2>
      <div className="rounded-xl overflow-hidden bg-dark aspect-video border border-bg-hover">
        {isYouTube ? (
          // YouTube embed — admins paste the embed URL when creating a book
          <iframe
            src={videoUrl}
            title="Book trailer"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
          />
        ) : (
          // Fallback placeholder video
          <video
            controls
            className="w-full h-full object-cover"
            poster={posterUrl}
          >
            <source src={PLACEHOLDER_VIDEO} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
};

export default BookDetailVideo;
