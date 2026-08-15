'use client';

import React, { useState } from 'react';
import AnnotationPin from './AnnotationPin';

interface AnnotationThreadProps {
  annotations: Array<{
    id: string;
    position: { yaw: number; pitch: number };
    content: string;
    resolved: boolean;
    authorId: string;
    createdAt: string;
  }>;
  onAnnotationClick: (annotation: any) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  isStaff?: boolean;
}

export default function AnnotationThread({ annotations, onAnnotationClick, onResolve, onDelete, isStaff }: AnnotationThreadProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Annotations ({annotations.length})</h3>
        {selectedAnnotation && (
          <button
            onClick={() => setSelectedAnnotation(null)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="space-y-3">
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className={`p-4 border rounded-lg bg-white transition-colors ${
              selectedAnnotation === annotation.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onAnnotationClick(annotation)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    annotation.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {annotation.resolved ? 'Resolved' : 'Open'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(annotation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 mb-2">{annotation.content}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Author: {annotation.authorId}</span>
                  <span>Yaw: {annotation.position.yaw.toFixed(2)}</span>
                  <span>Pitch: {annotation.position.pitch.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationClick({ ...annotation, id: annotation.id });
                  }}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  title="View annotation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 6 12 6c4.478 0 8.268 1.943 9.542 5-1.274 3.093-5.064 5-9.542 5C7.523 17 3.732 15.057 2.458 11z" />
                  </svg>
                </button>
                {!annotation.resolved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // In a real app, this would call an API to resolve
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Mark as resolved"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnnotationThread;