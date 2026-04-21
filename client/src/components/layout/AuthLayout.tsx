import { Outlet } from "react-router-dom";
import { FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import { FOOTER_SOCIAL_LINKS } from "../../lib/constants";

const AuthLayout = () => {
  return (
    <main className="min-h-screen flex flex-col bg-bg-dark">
      {/* MAIN CONTENT */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* BOTTOM BAR FOOTER */}
      <footer className="h-12.5 border-t border-gray-800">
        <div className="px-12 py-3 flex flex-wrap flex-col lg:flex-row items-center justify-center md:justify-between gap-3">
          <p className="text-text-muted text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Kun Bookshop. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <p className="text-text-muted text-xs text-center max-w-xs sm:max-w-full">
              Digital books delivered instantly · PDF & ePub formats · Powered
              by <span className="text-emerald-500 font-medium">Stripe</span>
            </p>

            <div className="flex gap-3">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-6 h-6 rounded-full border border-bg-hover
                      flex items-center justify-center text-text-muted
                      hover:border-golden hover:text-golden transition-all duration-200"
                >
                  {social.label === "Twitter" && <FaTwitter size={12} />}
                  {social.label === "Instagram" && <FaInstagram size={12} />}
                  {social.label === "GitHub" && <FaGithub size={12} />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default AuthLayout;
