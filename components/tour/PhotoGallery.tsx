import { useState } from 'react';
import Image from 'next/image';

interface PhotoGalleryProps {
  _galleryId: string; // Prefixed with _ to indicate unused for now
  galleryItems: Array<{
    id: string;
    galleryId: string;
    imageUrl: string;
    caption?: string;
    sortOrder: number;
    is360: boolean;
    sceneId?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToScene?: (sceneId: string) => void;
}

export function PhotoGallery({ 
  _galleryId, 
  galleryItems, 
  isOpen, 
  onClose,
  onNavigateToScene
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || galleryItems.length === 0) {
    return null;
  }

  const currentItem = galleryItems[currentIndex];
  const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  const nextIndex = (currentIndex + 1) % galleryItems.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex(prevIndex);
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex(nextIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="relative max-w-4xl max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 text-white hover:text-gray-300"
          aria-label="Close gallery"
        >
          ✕
        </button>

        {/* Image */}
        {currentItem.is360 ? (
          // For 360 images, we could use a different viewer, but for now just show the image
          <Image
            src={currentItem.imageUrl}
            alt={currentItem.caption || `Gallery image ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            width={800}   // placeholder width
            height={600}  // placeholder height
          />
        ) : (
          <Image
            src={currentItem.imageUrl}
            alt={currentItem.caption || `Gallery image ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            width={800}
            height={600}
          />
        )}

        {/* Caption */}
        {currentItem.caption && (
          <div className="absolute bottom-4 left-4 right-4 text-center text-white bg-black bg-opacity-50 px-4 py-2 rounded">
            <p>{currentItem.caption}</p>
          </div>
        )}

        {/* Navigation arrows */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <button
            onClick={() => setCurrentIndex(prevIndex)}
            className="text-2xl text-white hover:text-gray-300"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentIndex(nextIndex)}
            className="text-2xl text-white hover:text-gray-300"
            aria-label="Next image"
          >
            ›
          </button>
        </div>

        {/* Scene navigation link for 360 images */}
        {currentItem.is360 && currentItem.sceneId && onNavigateToScene && (
          <button
            onClick={() => onNavigateToScene(currentItem.sceneId ?? '')}
            className="absolute bottom-4 right-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded hover:bg-white bg-opacity-30"
          >
            View in 360°
          </button>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 text-white text-sm">
          {currentIndex + 1} / {galleryItems.length}
        </div>
      </div>
    </div>
  );
}