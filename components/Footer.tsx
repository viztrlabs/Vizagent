import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Social */}
          <div className="col-span-1">
            <span className="font-display text-2xl text-cyan">VizTR</span>
            <p className="text-gray-400 mt-4 text-sm sm:text-base">
              Architectural visualization platform connecting architects, designers, and clients
              through advanced 3D visualization and AI-powered rendering.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-medium text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/demo" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Demo
                </a>
              </li>
              <li>
                <a href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-medium text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Blog
                </a>
              </li>
              <li>
                <a href="/community" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Community
                </a>
              </li>
              <li>
                <a href="/guides" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Guides
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Privacy
                </a>
              </li>
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
