'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ProjectViewerProps {
  projectId: string;
  projectName: string;
  settings?: {
    cameraHeight?: number;
    autoRotate?: boolean;
    hotspotStyle?: string;
  };
}

export default function ProjectViewer({ projectId, projectName, settings }: ProjectViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initViewer = async () => {
      try {
        if (!viewerRef.current) return;
        
        // Dynamically import Marzipano to avoid SSR issues
        const { Viewer, RectilinearView, HotSpot } = await import('marzipano');
        
        const viewer = new Viewer(viewerRef.current!);
        
        // Create a simple scene for demo purposes
        // In production, this would load the actual panorama
        const geometry = new RectilinearView({
          yaw: 0,
          pitch: 0,
          fov: Math.PI / 2,
        });
        
        const scene = viewer.createScene({
          view: geometry,
        });
        
        // Set initial view
        scene.view.setParameters({
          yaw: 0,
          pitch: 0,
          fov: Math.PI / 2,
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      // Cleanup
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <div ref={viewerRef} className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {projectName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={viewerRef} className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef} 
      className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative"
      style={{ minHeight: '500px' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{projectName}</h3>
          <p className="text-sm text-gray-500 mt-1">3D Virtual Tour Viewer</p>
        </div>
      </div>
    </div>
  );
}