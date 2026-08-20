'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useMemo } from 'react';
import type { TourConfig, TourHotspot, TourScene } from '@/lib/tour/types';
import { FloorSelector } from '@/components/tour/FloorSelector';
import { FloorPlanOverlay } from '@/components/tour/FloorPlanOverlay';
import { Compass } from '@/components/tour/Compass';
import { PhotoGallery } from '@/components/tour/PhotoGallery';
import { TimelinePlayer } from '@/components/tour/TimelinePlayer';
import { VisualEffectsControls } from '@/components/tour/VisualEffectsControls';
import { AudioPlayer } from '@/components/tour/AudioPlayer';
import { TourMenu } from '@/components/tour/TourMenu';
import { ModeManager } from '@/components/tour/ModeManager';
import { MeasurementTool } from '@/components/tour/MeasurementTool';
import { TourFeatureProvider } from '@/components/tour/TourFeatureContext';

interface TourPageClientProps {
  config: TourConfig | null;
}

export function TourPageClient({ config }: TourPageClientProps) {
  if (!config) {
    return (
      <div className="viztr-tour-page">
        <div className="viztr-tour-missing">
          <h1>Tour Not Found</h1>
          <p>The requested virtual tour could not be found.</p>
          <Link href="/" className="viztr-tour-back-link">
            ← Back home
          </Link>
        </div>
        <style jsx>{`
          .viztr-tour-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080a0f;
            padding: 24px;
          }
          .viztr-tour-missing {
            text-align: center;
            color: #fff;
            max-width: 400px;
          }
          .viztr-tour-missing h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-missing p {
            color: #94a3b8;
            margin-bottom: 24px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #0d9488;
            text-decoration: none;
            font-weight: 500;
            font-family: Inter, system-ui, sans-serif;
            transition: color 0.2s;
          }
          .viztr-tour-back-link:hover {
            color: #06b6d4;
          }
        `}</style>
      </div>
    );
  }

  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState<boolean>(false);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [autoplayDelay, setAutoplayDelay] = useState<number>(5); // seconds
  const [brightness, setBrightness] = useState<number>(config?.settings?.brightness ?? 0);
  const [contrast, setContrast] = useState<number>(config?.settings?.contrast ?? 0);
  const [saturation, setSaturation] = useState<number>(config?.settings?.saturation ?? 0);

  const floors = config?.settings?.floors ?? [];
  const floorPlan = config?.settings?.floorPlan ?? '';
  const audioUrl = config?.settings?.audioUrl ?? '';

  // Apply visual effects to viewer
  useEffect(() => {
    const viewerContainer = document.querySelector<HTMLElement>('.marzipano-viewer');
    if (viewerContainer) {
      viewerContainer.style.filter = `
        brightness(${brightness + 100}%)
        contrast(${contrast + 100}%)
        saturate(${saturation + 100}%)
      `;
    }
  }, [brightness, contrast, saturation]);

  // Find initial scene (first scene or one with sortOrder 0)
  useEffect(() => {
    if (config?.scenes && config.scenes.length > 0) {
      const initialScene = config.scenes.find(scene => scene.sortOrder === 0) || config.scenes[0];
      setCurrentSceneId(initialScene.id);
    }
  }, [config]);

  // Compute currentIndex from currentSceneId and scenes
  const currentIndex = useMemo(() => {
    if (config?.scenes && config.scenes.length > 0 && currentSceneId) {
      const foundIndex = config.scenes.findIndex(scene => scene.id === currentSceneId);
      return foundIndex !== -1 ? foundIndex : 0;
    }
    return 0;
  }, [config?.scenes, currentSceneId]);

  // Handle hotspot clicks from Marzipano viewer
  const handleHotspotClick = (hotspot: TourHotspot) => {
    if (hotspot.hotspotType === 'navigation' && hotspot.targetSceneId) {
      setCurrentSceneId(hotspot.targetSceneId);
    } else if (hotspot.hotspotType === 'gallery' && hotspot.galleryId) {
      setActiveGalleryId(hotspot.galleryId);
      setShowPhotoGallery(true);
    } else if (hotspot.hotspotType === 'info' && hotspot.url) {
      // Open external URL in new tab
      window.open(hotspot.url, '_blank');
    }
    // floorplan hotspots handled by FloorPlanOverlay
  };

  // Find gallery items for active gallery
  const getGalleryItems = (galleryId: string) => {
    if (!config?.scenes) return [];

    const galleryItems: Array<{
      id: string;
      galleryId: string;
      imageUrl: string;
      caption?: string | undefined;
      sortOrder: number;
      is360: boolean;
      sceneId?: string | undefined;
    }> = [];

    config.scenes.forEach(scene => {
      // Safely access galleryItems
      const items = scene.galleryItems ?? [];
      items.forEach(item => {
        if (item.galleryId === galleryId) {
          galleryItems.push({
            id: item.id,
            galleryId: item.galleryId,
            imageUrl: item.imageUrl,
            caption: item.caption ?? undefined, // Convert null to undefined
            sortOrder: item.sortOrder,
            is360: item.is360,
            sceneId: scene.id
          });
        }
      });
    });

    // Sort by sortOrder
    return galleryItems.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Handle scene change from timeline or navigation
  const handleSceneChange = (sceneId: string) => {
    setCurrentSceneId(sceneId);

    // If playing, pause when user manually changes scene
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  // Handle floor plan click (from FloorPlanOverlay)
  const handleRoomClick = (sceneId: string) => {
    setCurrentSceneId(sceneId);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="viztr-tour-page">
      <div className="viztr-tour-container relative">
        {/* Top Toolbar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 px-4">
          <div className="flex items-center space-x-4">
            {/* Visual Effects Controls */}
            <VisualEffectsControls
              initialBrightness={brightness}
              initialContrast={contrast}
              initialSaturation={saturation}
              onChange={(b, c, s) => {
                setBrightness(b);
                setContrast(c);
                setSaturation(s);
              }}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Floor Selector (Top Left) */}
            <div className="relative">
              <FloorSelector
                floors={floors}
                selectedFloor={selectedFloor}
                onFloorChange={setSelectedFloor}
              />
            </div>
            
            {/* Compass (Top Center) */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Compass heading={currentHeading} />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Audio Player (Top Right) */}
            {audioUrl && (
              <AudioPlayer
                audioUrl={audioUrl}
                autoplay={false} // Disabled for safety, user must interact
                volume={0.5}
              />
            )}
          </div>
        </div>

        {/* Tour Menu (Top Right) */}
        <TourMenu
          title={config.title}
          description={config.description}
          viewCount={config.viewCount}
        />

        {/* Floor Plan Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20">
          {floorPlan && (
            <FloorPlanOverlay
              floorPlan={floorPlan}
              onRoomClick={handleRoomClick}
            />
          )}
        </div>

        {/* Timeline Player (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          {config?.scenes && (
            <TimelinePlayer
              scenes={config.scenes}
              currentSceneId={currentSceneId}
              onSceneChange={handleSceneChange}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              autoAdvanceDelay={autoplayDelay}
            />
          )}
        </div>

        {/* Autoplay Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          <button
            onClick={() => setAutoplayDelay(prev => prev === 5 ? 10 : 5)}
            className="p-2 rounded hover:bg-gray-700"
            title="Toggle autoplay speed: 5s/10s"
          >
            {autoplayDelay === 5 ? '⚡' : '🐢'}
          </button>
        </div>

        {/* Main Tour Viewer */}
        {/* Main Tour Viewer */}
        <TourFeatureProvider config={config}>
          <MeasurementTool />
          <Suspense
            fallback={
              <div className="viztr-tour-fallback">
                <div className="viztr-spinner" role="status" aria-label="Loading tour" />
              </div>
            }
          >
            <ModeManager
              config={config}
              selectedFloor={selectedFloor}
              onHeadingChange={(heading) => { if (heading !== null) setCurrentHeading(heading); }}
              onHotspotClick={handleHotspotClick}
              currentSceneId={currentSceneId}
            />
          </Suspense>
        </TourFeatureProvider>

        {/* Photo Gallery Modal */}
        {showPhotoGallery && activeGalleryId && (
          <PhotoGallery
            _galleryId={activeGalleryId}
            galleryItems={getGalleryItems(activeGalleryId)}
            isOpen={showPhotoGallery}
            onClose={() => {
              setShowPhotoGallery(false);
              setActiveGalleryId(null);
            }}
            onNavigateToScene={handleSceneChange}
          />
        )}
        
        <style jsx>{`
          .viztr-tour-page {
            min-height: 100vh;
            background: #080a0f;
            padding: 0;
            overflow: hidden;
          }
          .viztr-tour-container {
            width: 100%;
            height: 100vh;
            max-width: 100%;
            position: relative;
          }
          .viztr-tour-fallback {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080a0f;
          }
          .viztr-spinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid rgba(13, 148, 136, 0.25);
            border-top-color: #0d9488;
            animation: viztr-spin 0.8s linear infinite;
          }
          @keyframes viztr-spin {
            to {
              transform: rotate(360deg);
            }
          }
          @media (min-width: 1024px) {
            .viztr-tour-container {
              max-width: 896px;
              margin: 0 auto;
              height: 100vh;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .viztr-spinner {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}