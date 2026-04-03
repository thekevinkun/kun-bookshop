import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="section bg-navy">
      <div className="container-page">
        <div
          className="relative overflow-hidden rounded-2xl min-h-[220px] flex items-center"
          style={{
            background:
              "linear-gradient(135deg, #0f4c4c 0%, #134e4a 60%, #0a1628 100%)",
          }}
        >
          {/* Left side — overlapping book cluster for a stronger product composition */}
          <div className="absolute left-8 top-1/2 hidden h-[240px] w-[380px] -translate-y-1/2 md:block">
            <div className="absolute inset-0 rounded-full bg-teal/15 blur-3xl" />

            <div className="absolute left-0 top-11 w-28 lg:w-32 rounded-xl overflow-hidden rotate-[-12deg] 
              scale-[0.94] shadow-[0_24px_50px_rgba(0,0,0,0.4)] opacity-80"
            >
              <img
                src="https://m.media-amazon.com/images/I/51IKycqTPUL._AC_UF1000,1000_QL80_.jpg"
                alt="Book"
                className="w-full h-full object-cover aspect-[2/3] brightness-[0.8] saturate-[0.9]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />
            </div>

            <div className="absolute left-20 top-1 w-32 lg:w-36 rounded-xl overflow-hidden rotate-[-2deg] 
              shadow-[0_28px_60px_rgba(0,0,0,0.5)] z-15"
            >
              <img
                src="https://m.media-amazon.com/images/I/71T7aD3EOTL._AC_UF1000,1000_QL80_.jpg"
                alt="Featured book"
                className="w-full h-full object-cover aspect-[2/3]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />
            </div>

            <div className="absolute left-44 top-12 w-28 lg:w-32 rounded-xl overflow-hidden rotate-[10deg] 
              scale-[0.96] shadow-[0_24px_50px_rgba(0,0,0,0.42)] opacity-85 z-10"
            >
              <img
                src="https://m.media-amazon.com/images/I/81wgcld4wxL._AC_UF1000,1000_QL80_.jpg"
                alt="Book"
                className="w-full h-full object-cover aspect-[2/3] brightness-[0.85] saturate-[0.95]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />
            </div>

            <div className="absolute left-[248px] top-7 w-24 lg:w-28 rounded-xl overflow-hidden rotate-[18deg] 
              scale-[0.92] shadow-[0_22px_45px_rgba(0,0,0,0.38)] opacity-75"
            >
              <img
                src="https://m.media-amazon.com/images/I/81-QB7nDh4L._AC_UF1000,1000_QL80_.jpg"
                alt="Book"
                className="w-full h-full object-cover aspect-[2/3] brightness-[0.78] saturate-[0.88]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />
            </div>

            <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-r from-transparent via-[#134e4a]/50 to-[#134e4a]/15" />
          </div>

          {/* Right side — CTA text + button */}
          <div className="relative z-10 ml-auto w-full md:w-3/5 p-10 md:pr-16 text-right md:text-right">
            <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-2">
              Our Biggest Deal
            </p>
            <h2 className="text-white text-3xl sm:text-4xl font-black mb-1">
              PDF & ePub delivered
            </h2>
            <h2 className="text-white text-3xl sm:text-4xl font-black mb-3">
              straight to your <span className="text-teal">inbox</span>
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-sm ml-auto">
              Purchase any book and receive your file instantly via email. No
              waiting. No shipping. Just reading.
            </p>
            <button
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold 
                  px-7 py-3 rounded-full hover:bg-teal hover:text-white transition-all duration-200"
              onClick={() => navigate("/books")}
            >
              Shop Now
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
