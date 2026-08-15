'use client';

import React, { useState, useEffect } from 'react';

interface AnnotationPinProps {
  id: string;
  position: { yaw: number; pitch: number };
  content: string;
  resolved: boolean;
  onClick: () => void;
  isSelected?: boolean;
}

export default function AnnotationPin({ id, position, content, resolved, onClick, isSelected }: AnnotationPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, this would position the pin in 3D space
    // For now, we just render a 2D representation
  }, [position]);

  return (
    <div
      ref={pinRef}
      className={`absolute cursor-pointer transition-all duration-200 ${
        resolved ? 'opacity-50' : 'opacity-100'
      } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      style={{
        transform: `translate(${position.yaw * 100}px, ${position.pitch * 100}px)`,
        zIndex: 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
        resolved ? 'bg-green-500' : 'bg-primary-600'
      } ${isSelected || isHovered ? 'scale-125' : ''} shadow-lg`}>
        {resolved ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 2-5 5-5s5 3 5 5c0 1.5-.5 3-1.5 3.5s-1.5 1-2.5 1.5a5 5 0 01-2.5-1.5 7 7 0 00-2.5 1.5c-.5.5-.5 1.5 0 2z" />
          </svg>
        )}
      </div>
      {(isHovered || isSelected) && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg p-3 border z-20">
          <p className="text-sm text-gray-900">{content}</p>
          {resolved && <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Resolved</span>}
        </div>
      )}
    </div>
  );
}

import { useRef } from 'react';