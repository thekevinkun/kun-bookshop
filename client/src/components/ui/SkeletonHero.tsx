import { Star } from "lucide-react";

const SkeletonHero = () => {
  return (
    <div className="animate-pulse w-full order-2">
      <div className="w-72 lg:w-84 h-10 bg-bg-hover rounded mb-4" />
      <div className="w-40 lg:w-48 h-6 bg-bg-hover rounded mb-4" />
      <div className="flex items-center gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} className="text-bg-hover fill-bg-hover" />
        ))}
      </div>
      <div className="w-68 lg:w-74 h-24 bg-bg-hover rounded mb-6" />
      <div className="flex items-center gap-3">
        <div className="w-20 h-6 bg-bg-hover rounded" />
        <div className="w-26 h-6 bg-bg-hover rounded" />
      </div>
    </div>
  );
};

export default SkeletonHero;
