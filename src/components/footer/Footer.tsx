import { footerConfig } from '../../config/footerConfig';
import ScrollToTopButton from './ScrollToTopButton';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const copyrightText = footerConfig.copyrightText
    .replace('{year}', currentYear.toString())
    .replace('{product}', footerConfig.productName);

  return (
    <footer className="relative w-full bg-white border-t border-gray-100 overflow-hidden mt-auto">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none select-none">
        <img
          src={footerConfig.backgroundImage}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        {/* Optional overlay for better contrast if image is busy */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-white/10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Left Side: Logo & Branding */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <a href={footerConfig.homeLink} className="flex items-center space-x-3 group text-decoration-none">
              <img
                src={footerConfig.logo}
                alt={`${footerConfig.productName} Logo`}
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-wider text-gray-900 uppercase leading-none">
                  {footerConfig.productName}
                </span>
                <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-medium leading-none mt-1">
                  Pet Lovers
                </span>
              </div>
            </a>

            {/* Copyright */}
            <p className="text-sm text-gray-600 font-medium">
              {copyrightText}
            </p>
          </div>

          {/* Right Side: Reserved for future links or social icons */}
          <div className="flex items-center space-x-4">
             {/* Add social links here if needed */}
          </div>
        </div>
      </div>

      {/* Scroll To Top Button Component */}
      <ScrollToTopButton />
    </footer>
  );
};

export default Footer;
