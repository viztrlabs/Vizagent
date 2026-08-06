export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center mb-4 sm:mb-6">
        Architectural Visualization <span className="text-cyan">Reimagined</span>
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-400 text-center max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
        Create immersive 3D experiences for your architectural projects with real-time collaboration and AI-powered rendering.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
        <a
          href="/signup"
          className="w-full sm:w-auto px-8 py-3 bg-cyan text-bg rounded-lg font-medium text-lg hover:bg-cyan/90 transition-colors text-center min-h-touch"
        >
          Get Started Free
        </a>
        <a
          href="/demo"
          className="w-full sm:w-auto px-8 py-3 bg-surface text-white rounded-lg font-medium text-lg hover:bg-surface/80 transition-colors text-center min-h-touch"
        >
          View Demo
        </a>
      </div>
    </div>
  );
}
