'use client';

import { useState } from 'react';
import { Menu, X, ExternalLink, Eye } from 'lucide-react';

interface TourMenuProps {
  title: string;
  description?: string;
  viewCount?: number;
  logoUrl?: string;
  externalLinks?: Array<{ label: string; url: string }>;
}

export function TourMenu({
  title,
  description,
  viewCount = 0,
  logoUrl,
  externalLinks = [],
}: TourMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="viztr-tour-menu-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open tour menu"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="viztr-tour-menu-overlay" onClick={() => setIsOpen(false)}>
          <nav
            className="viztr-tour-menu"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Tour information"
          >
            <div className="viztr-tour-menu-header">
              <h2 className="viztr-tour-menu-title">{title}</h2>
              <button
                type="button"
                className="viztr-tour-menu-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {logoUrl && (
              <div className="viztr-tour-menu-logo">
                <img src={logoUrl} alt={`${title} logo`} />
              </div>
            )}

            {description && (
              <p className="viztr-tour-menu-description">{description}</p>
            )}

            <div className="viztr-tour-menu-stats">
              <div className="viztr-tour-menu-stat">
                <Eye size={16} />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
            </div>

            {externalLinks.length > 0 && (
              <div className="viztr-tour-menu-links">
                <h3>Links</h3>
                {externalLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="viztr-tour-menu-link"
                  >
                    <ExternalLink size={14} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </nav>

          <style jsx>{`
            .viztr-tour-menu-trigger {
              position: absolute;
              top: 16px;
              right: 16px;
              z-index: 20;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              border: none;
              border-radius: 50%;
              background: rgba(13, 17, 23, 0.85);
              color: #e2e8f0;
              cursor: pointer;
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              transition: background 0.2s;
            }
            .viztr-tour-menu-trigger:hover {
              background: rgba(13, 17, 23, 0.95);
            }
            .viztr-tour-menu-overlay {
              position: fixed;
              inset: 0;
              z-index: 50;
              background: rgba(0, 0, 0, 0.5);
            }
            .viztr-tour-menu {
              position: fixed;
              top: 0;
              right: 0;
              bottom: 0;
              width: 320px;
              max-width: 85vw;
              background: #0d1117;
              border-left: 1px solid rgba(255, 255, 255, 0.1);
              padding: 24px;
              overflow-y: auto;
              animation: slideIn 0.2s ease-out;
            }
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .viztr-tour-menu-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 24px;
            }
            .viztr-tour-menu-title {
              font-size: 18px;
              font-weight: 600;
              color: #fff;
              font-family: Inter, system-ui, sans-serif;
              margin: 0;
            }
            .viztr-tour-menu-close {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border: none;
              border-radius: 6px;
              background: rgba(255, 255, 255, 0.05);
              color: #94a3b8;
              cursor: pointer;
              transition: background 0.2s, color 0.2s;
            }
            .viztr-tour-menu-close:hover {
              background: rgba(255, 255, 255, 0.1);
              color: #fff;
            }
            .viztr-tour-menu-logo {
              margin-bottom: 16px;
            }
            .viztr-tour-menu-logo img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
            }
            .viztr-tour-menu-description {
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.5;
              margin-bottom: 16px;
              font-family: Inter, system-ui, sans-serif;
            }
            .viztr-tour-menu-stats {
              padding: 12px 0;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              margin-bottom: 16px;
            }
            .viztr-tour-menu-stat {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #94a3b8;
              font-size: 14px;
              font-family: Inter, system-ui, sans-serif;
            }
            .viztr-tour-menu-links {
              margin-top: 16px;
            }
            .viztr-tour-menu-links h3 {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin: 0 0 12px 0;
              font-family: Inter, system-ui, sans-serif;
            }
            .viztr-tour-menu-link {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              border-radius: 8px;
              color: #e2e8f0;
              text-decoration: none;
              font-size: 14px;
              font-family: Inter, system-ui, sans-serif;
              transition: background 0.2s;
            }
            .viztr-tour-menu-link:hover {
              background: rgba(255, 255, 255, 0.05);
            }
          `}</style>
        </div>
      )}
    </>
  );
}

TourMenu.displayName = 'TourMenu';
