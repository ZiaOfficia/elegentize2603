import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className="bg-stone-950 border-t border-white/10 py-16 px-6 text-white text-texture"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 ">
          {/* Brand */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 md:col-span-1"
          >
            <div className="text-2xl font-display font-bold tracking-tighter mb-3  text-white">
              ELEGANTIZE<span className="text-primary">.</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-widest">
              Elegantize: Where weddings become legends! We’re not just a decor
              company in New York or in New Jersey; we’re your VIP pass to
              enchantment. From breathtaking florals to ceiling charm and vinyl
              floor allure, we’ve got the magic touch.
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div variants={itemVariants} className="lg:ml-17">
            <h5 className="text-[14px] uppercase tracking-widest font-bold mb-6 text-white">
              Navigation
            </h5>
            <ul className="text-xs space-y-4 uppercase tracking-widest text-gray-400">
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="hover:text-primary transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="/gallery"
                  className="hover:text-primary transition-colors"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="/portfolio"
                  className="hover:text-primary transition-colors"
                >
                  Portfolio
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="hover:text-primary transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div variants={itemVariants}>
            <h5 className="text-[14px] uppercase tracking-widest font-bold mb-6 text-white">
              Connect
            </h5>
            <ul className="text-xs space-y-4 uppercase tracking-widest text-gray-400">
              <li>
                <a
                  href="https://www.instagram.com/elegantizeevents/"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Instagram size={16} /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://in.pinterest.com/elegantizeevents/"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="shrink-0"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.246.957-.899 2.152-1.341 2.889.36.109.734.166 1.117.166 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
                  </svg>
                  Pinterest
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/people/Elegantize-Productions/100083099336478/"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Facebook size={16} /> Facebook
                </a>
              </li>
              <li>
                <a
                  href="www.youtube.com/@elegantize"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Youtube size={16} /> Youtube
                </a>
              </li>
            </ul>

            <ul className="text-xs space-y-4 uppercase tracking-widest text-gray-400 mt-3">
              <li className="hover:text-primary transition-colors flex items-center gap-2">
                <Phone size={14} /> +1(347)686-4562
              </li>
              <li className="hover:text-primary transition-colors flex items-center gap-2">
                <MapPin size={14} className="shrink-0" />
                <span>8 Di Tomas Ct, Copiague, NY, 11726</span>
              </li>
              <li className="hover:text-primary transition-colors flex items-center gap-2">
                <Mail size={14} /> info@elegantize.com
              </li>
            </ul>
          </motion.div>

          {/* Featured Section */}
          <motion.div variants={itemVariants}>
            <h5 className="text-[14px] uppercase tracking-widest font-bold mb-6 text-white">
              Also Featured In
            </h5>
            <div className="flex flex-wrap items-center gap-5">
              {/* The Luxury Bride Magazine */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/screenshot-2026-02-10-205318.webp"
                alt="The Luxury Bride Magazine"
                className="h-18 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              />

              {/* Maharani */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/maharani.webp"
                alt="Maharani Weddings"
                className="h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />

              {/* Vogue Weddings */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/358054850_1645118269287715_7591891286819020443_n.webp"
                alt="Vogue Weddings"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-sm"
              />

              {/* Brides */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/212027854_503914070828276_8392782795759379749_n.webp"
                alt="Brides"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-sm"
              />

              {/* Modern Luxury Weddings */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/497509931_18507082408031379_9071343399086700481_n.webp"
                alt="Modern Luxury Weddings"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-sm"
              />

              {/* Carats & Cakes */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/568631337_18538482400017750_8428615054160921167_n.webp"
                alt="Carats & Cakes"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-sm"
              />

              {/* Elle Weddings */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/326374167_520572563502506_3682989526405299889_n.webp"
                alt="Elle Weddings"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-sm"
              />

              {/* Munaluchi Bride */}
              <img
                loading="lazy"
                decoding="async"
                src="/images/general/munaluchi_horizontal_black-web.webp"
                alt="Munaluchi Bride"
                className="h-10 w-auto object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-all duration-500"
              />

              {/* Wezoree */}

              <img
                loading="lazy"
                decoding="async"
                src="/images/logos/logo_wezoree_black-01.webp"
                alt="Wezoree"
                className="h-8 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-500"
        >
          <p>© 2024 Elegantize Weddings. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy-policy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};
