export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="font-display text-6xl text-center mb-6">
        Architectural Visualization <span className="text-cyan">Reimagined</span>
      </h1>
      <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-10">
        Create immersive 3D experiences for your architectural projects with real-time collaboration and AI-powered rendering.
      </p>
      <div className="flex justify-center gap-4">
        <a href="/signup" className="px-8 py-3 bg-cyan text-bg rounded-lg font-medium text-lg hover:bg-cyan/90 transition-colors">
          Get Started Free
        </a>
        <a href="/demo" className="px-8 py-3 bg-surface text-white rounded-lg font-medium text-lg hover:bg-surface/80 transition-colors">
          View Demo
        </a>
      </div>
    </div>
  );
}
