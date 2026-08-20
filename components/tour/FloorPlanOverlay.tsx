import { useStore } from '@/lib/store/useStore'

export function FloorPlanOverlay({ 
  floorPlan, 
  onRoomClick 
}: {
  floorPlan: string // SVG content as string or URL to SVG
  onRoomClick: (sceneId: string) => void
}) {
  const { showFloorPlan, currentRoom, setTourStore } = useStore()

  if (!floorPlan) {
    return null
  }

  // Check if it's a URL or inline SVG
  const isUrl = floorPlan.startsWith('http') || floorPlan.startsWith('/')

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="relative">
        <button
          onClick={() => setTourStore({ showFloorPlan: !showFloorPlan })}
          className="p-2 bg-gray-800/50 backdrop-blur rounded hover:bg-gray-700/70 transition-colors"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 18L21 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        {showFloorPlan && (
          <div className="absolute bottom-[60px] left-0 w-64 bg-gray-900/90 backdrop-blur rounded border border-gray-800 p-4 max-h-[300px] overflow-y-auto">
            {isUrl ? (
              <img 
                src={floorPlan} 
                alt="Floor plan" 
                className="w-full h-auto rounded"
                onLoad={() => {}}
                onError={() => {}}
              />
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: floorPlan }} 
                className="w-full"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}