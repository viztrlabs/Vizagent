export default function Footer() {
  return (
    <footer className="bg-surface border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <span className="font-display text-2xl text-cyan">VizTR</span>
            <p className="text-gray-400 mt-4 max-w-md text-sm sm:text-base">
              Architectural visualization platform connecting architects, designers, and clients
              through advanced 3D visualization and AI-powered rendering.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Pricing</a></li>
              <li><a href="/demo" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Demo</a></li>
              <li><a href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">About</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-8 text-center text-gray-500 text-sm">
          © 2026 VizTR. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
