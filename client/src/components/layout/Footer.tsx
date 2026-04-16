import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import {
  FOOTER_CONTACT,
  FOOTER_NAV_LINKS,
  FOOTER_SOCIAL_LINKS,
} from "../../lib/constants";

const Footer = () => {
  return (
    <footer className="bg-dark border-t border-bg-hover">
      {/* MAIN FOOTER CONTENT */}
      <div className="container-page py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr_0.9fr] gap-10 lg:gap-14 items-start">
          {/* Brand */}
          <div className="flex flex-col gap-5 max-w-sm">
            {/* Logo — reuses same markup as Navbar */}
            <Link
              to="/"
              className="flex items-center w-fit"
            >
              <img 
                src="/images/logo.webp"
                alt="Logo"
                className="w-6 h-6 object-cover"
              />
              <span className="text-gradient font-cinzel font-medium text-lg">
                un <span className="text-golden">Bookshop</span>
              </span>
            </Link>

            <p className="text-text-muted text-sm leading-relaxed">
              A quieter place to discover digital books that are worth keeping.
              Read instantly in PDF and ePub, with a catalog built for focused
              browsing rather than noise.
            </p>

            <div className="flex flex-col gap-3 pt-1">
              <a
                href={`mailto:${FOOTER_CONTACT.email}`}
                className="inline-flex items-center gap-2 text-sm text-text-light hover:text-golden transition-colors w-fit"
              >
                <Mail size={14} className="text-golden flex-shrink-0" />
                {FOOTER_CONTACT.email}
              </a>
              <p className="text-text-muted text-sm">
                {FOOTER_CONTACT.supportText}
              </p>
              <p className="text-text-muted text-xs uppercase tracking-[0.18em]">
                {FOOTER_CONTACT.availability}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-bg-hover/80 bg-card/30
                    flex items-center justify-center text-text-muted
                    hover:border-golden hover:text-golden transition-all duration-200"
                >
                  {social.label === "Twitter" && <FaTwitter size={15} />}
                  {social.label === "Instagram" && <FaInstagram size={15} />}
                  {social.label === "GitHub" && <FaGithub size={15} />}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4">
            <p className="text-text-light text-xs font-semibold uppercase tracking-[0.22em]">
              Explore
            </p>
            <nav className="grid grid-cols-1 gap-3">
              {FOOTER_NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="group inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-light transition-colors duration-150 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Utility */}
          <div className="flex flex-col gap-4 lg:pl-4">
            <p className="text-text-light text-xs font-semibold uppercase tracking-[0.22em]">
              Support
            </p>
            <div className="rounded-2xl border border-bg-hover/80 bg-card/35 p-5">
              <p className="text-text-light text-sm leading-relaxed">
                Need help with downloads, formats, or an order issue?
              </p>
              <a
                href={`mailto:${FOOTER_CONTACT.email}`}
                className="inline-flex items-center gap-2 mt-4 text-sm text-golden hover:text-white transition-colors"
              >
                Contact support
                <ArrowRight size={14} />
              </a>
              <p className="text-text-muted text-xs mt-4">
                Secure checkout with Stripe.
                <br />PDF and ePub formats.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-bg-hover">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs text-center sm:text-left">
            © 2026 Kun Bookshop. All rights reserved.
          </p>
          <p className="text-text-muted text-xs text-center">
            Digital books delivered instantly · PDF & ePub formats · Powered by{" "}
            <span className="text-emerald-500 font-medium">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
