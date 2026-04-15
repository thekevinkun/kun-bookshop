import { Outlet } from "react-router-dom";
import { FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      {/* MAIN CONTENT */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* BOTTOM BAR FOOTER */}
      <footer className="h-12.5 border-t border-bg-hover">
        <div className="px-12 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Kun Bookshop. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <p className="text-text-muted text-xs text-center">
              Digital books delivered instantly · PDF & ePub formats · Powered
              by <span className="text-emerald-500 font-medium">Stripe</span>
            </p>

            <div className="flex gap-3">
              {[
                { icon: <FaTwitter size={13} />, href: "#", label: "Twitter" },
                {
                  icon: <FaInstagram size={13} />,
                  href: "#",
                  label: "Instagram",
                },
                { icon: <FaGithub size={13} />, href: "#", label: "GitHub" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-6 h-6 rounded-full border border-bg-hover
                      flex items-center justify-center text-text-muted
                      hover:border-golden hover:text-golden transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
