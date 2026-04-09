import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, MapPin, Phone, Send } from "lucide-react";
import { FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Newsletter logic comes in a later phase — for now just show confirmation
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-dark border-t border-bg-hover">
      {/* MAIN FOOTER CONTENT */}
      <div className="container-page py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* COL 1: Brand */}
          <div className="flex flex-col gap-4">
            {/* Logo — reuses same markup as Navbar */}
            <Link
              to="/"
              className="flex items-center gap-2 text-text-light hover:text-teal transition-colors w-fit"
            >
              <BookOpen size={22} className="text-teal" />
              <span className="font-bold text-lg">
                Kun <span className="text-teal">Bookshop</span>
              </span>
            </Link>

            <p className="text-text-muted text-sm leading-relaxed">
              Your premium digital bookstore. Thousands of PDF and ePub books
              delivered instantly to your inbox after purchase.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mt-2">
              <a
                href="mailto:hello@kunbookshop.com"
                className="flex items-center gap-2 text-text-muted text-sm
                hover:text-teal transition-colors"
              >
                <Mail size={14} className="text-teal flex-shrink-0" />
                hello@kunbookshop.com
              </a>
              <span className="flex items-center gap-2 text-text-muted text-sm">
                <Phone size={14} className="text-teal flex-shrink-0" />
                +1 (800) 123-4567
              </span>
              <span className="flex items-center gap-2 text-text-muted text-sm">
                <MapPin size={14} className="text-teal flex-shrink-0" />
                Available worldwide — digital only
              </span>
            </div>

            {/* Social links */}
            <div className="flex gap-3 mt-2">
              {[
                { icon: <FaTwitter size={15} />, href: "#", label: "Twitter" },
                {
                  icon: <FaInstagram size={15} />,
                  href: "#",
                  label: "Instagram",
                },
                { icon: <FaGithub size={15} />, href: "#", label: "GitHub" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-full border border-bg-hover
                      flex items-center justify-center text-text-muted
                      hover:border-teal hover:text-teal transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* COL 2: Explore */}
          <div className="flex flex-col gap-4">
            <h4 className="text-text-light font-semibold text-sm uppercase tracking-wider">
              Explore
            </h4>
            <div className="w-6 h-0.5 bg-teal rounded-full -mt-2" />
            <nav className="flex flex-col gap-2.5">
              {[
                { label: "Browse Books", to: "/books" },
                { label: "Featured Books", to: "/books?sortBy=purchaseCount" },
                { label: "New Arrivals", to: "/books?sortBy=createdAt" },
                { label: "Top Rated", to: "/books?sortBy=rating" },
                { label: "My Library", to: "/library" },
                { label: "My Profile", to: "/profile" },
                { label: "GraphQL Demo", to: "/graphql-demo" },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-text-muted text-sm hover:text-teal transition-colors duration-150 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* COL 3: Support */}
          <div className="flex flex-col gap-4">
            <h4 className="text-text-light font-semibold text-sm uppercase tracking-wider">
              Support
            </h4>
            <div className="w-6 h-0.5 bg-teal rounded-full -mt-2" />
            <nav className="flex flex-col gap-2.5">
              {[
                { label: "Help Center", to: "#" },
                { label: "How to Download", to: "#" },
                { label: "Supported Formats", to: "#" },
                { label: "Refund Policy", to: "#" },
                { label: "Privacy Policy", to: "#" },
                { label: "Terms of Service", to: "#" },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-text-muted text-sm hover:text-teal transition-colors duration-150 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* COL 4: Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="text-text-light font-semibold text-sm uppercase tracking-wider">
              Subscribe
            </h4>
            <div className="w-6 h-0.5 bg-teal rounded-full -mt-2" />
            <p className="text-text-muted text-sm leading-relaxed">
              Be the first to know about new releases, collections, and
              exclusive discounts.
            </p>

            {subscribed ? (
              // Success state after subscribing
              <div className="flex items-center gap-2 text-teal text-sm font-medium">
                <Send size={14} />
                You're subscribed — thank you!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div
                  className="flex overflow-hidden rounded-lg border border-bg-hover
                    focus-within:border-teal transition-colors duration-200"
                >
                  <input
                    type="email"
                    placeholder="Email address"
                    className="flex-1 bg-card text-text-light text-sm px-4 py-2.5
                      placeholder:text-text-muted focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-teal text-white px-4 hover:opacity-90 transition-opacity duration-200 flex items-center"
                    aria-label="Subscribe"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-text-muted text-xs">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            )}

            {/* Secure payment badges */}
            <div className="mt-4">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-3">
                Secure Payments
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Stripe badge */}
                <div className="flex items-center gap-1.5 bg-card border border-bg-hover rounded-md px-3 py-1.5">
                  <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                    <path
                      d="M4.5 5.8c0-.6.5-1 1.3-1 1.1 0 2.3.4 3.2.9V3.3C8 2.9 6.9 2.7 5.8 2.7 3 2.7 1 4.1 1 6.1c0 3 4.2 2.5 4.2 3.8 0 .7-.6 1-1.4 1-1.2 0-2.6-.5-3.6-1.1v2.5c1 .4 2 .6 3.1.6 2.8 0 4.8-1.3 4.8-3.4C8.1 6.6 4.5 7.1 4.5 5.8z"
                      fill="#635BFF"
                    />
                    <text
                      x="11"
                      y="11"
                      fontSize="8"
                      fill="#635BFF"
                      fontWeight="700"
                    >
                      stripe
                    </text>
                  </svg>
                </div>

                {/* Visa */}
                <div
                  className="bg-card border border-bg-hover rounded-md px-3 py-1.5
                      text-xs font-bold text-blue-400 tracking-wider"
                >
                  VISA
                </div>

                {/* Mastercard */}
                <div className="bg-card border border-bg-hover rounded-md px-2 py-1.5 flex items-center gap-0.5">
                  <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                  <div className="w-4 h-4 rounded-full bg-yellow-400 opacity-90 -ml-2" />
                </div>

                {/* PayPal */}
                <div className="bg-card border border-bg-hover rounded-md px-3 py-1.5 text-xs font-bold tracking-wide">
                  <span className="text-blue-500">Pay</span>
                  <span className="text-blue-300">Pal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-bg-hover">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Kun Bookshop. All rights reserved.
          </p>
          <p className="text-text-muted text-xs text-center">
            Digital books delivered instantly · PDF & ePub formats · Powered by{" "}
            <span className="text-teal font-medium">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
