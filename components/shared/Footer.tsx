// Site footer with legal/info links. Static content — no auth logic needed.
const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-200">
      {/* Desktop footer */}
      <div className="hidden md:block">
        <div className="max-w-[980px] mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-500 mb-3">
            Copyright&copy; 2026 Interval. All rights reserved.
          </p>
          <div className="flex justify-center flex-wrap gap-x-1 text-xs text-gray-600">
            <a href="#" className="hover:underline">About</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:underline">Privacy and Cookie Policies</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:underline">Legal Information</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:underline">Customer Support</a>
            <span className="text-gray-400">|</span>
            <a href="#" className="hover:underline">FAQs</a>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="md:hidden text-center py-4 px-4">
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-gray-600 mb-2">
          <a href="#" className="hover:underline">About Us</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Privacy &amp; Cookie Policies</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Legal</a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">Support</a>
        </div>
        <p className="text-xs text-gray-500">
          Copyright&copy; 2026 Interval. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
