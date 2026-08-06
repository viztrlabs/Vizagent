export default function ConfiguratorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Initializing Babylon.js engine...</p>
      </div>
    </div>
  );
}