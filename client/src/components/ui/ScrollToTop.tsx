import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Clear hash + scroll to top
    if (hash) {
      window.history.replaceState(null, "", pathname);
    }

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    // Triple-fire to beat ALL race conditions
    scrollTop();
    requestAnimationFrame(scrollTop);
    setTimeout(scrollTop, 50);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
