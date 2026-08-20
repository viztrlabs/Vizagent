import { useStore } from '@/lib/store/useStore'

export function FloorSelector({ 
  floors, 
  selectedFloor, 
  onFloorChange 
}: {
  floors: Array<{ id: string; name: string; order: number }>
  selectedFloor: string | null
  onFloorChange: (floorId: string | null) => void
}) {
  const { setTourStore } = useStore()

  const handleFloorChange = (floorId: string | null) => {
    onFloorChange(floorId)
    // Update tour store with selected floor
    setTourStore({ selectedFloor: floorId })
  }

  if (floors.length <= 1) {
    return null // Hide selector if only one floor or none
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-200 mb-1">
        Floor
      </label>
      <select
        value={selectedFloor ?? ''}
        onChange={(e) => handleFloorChange(e.target.value || null)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Floors</option>
        {floors
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
      </select>
    </div>
  )
}