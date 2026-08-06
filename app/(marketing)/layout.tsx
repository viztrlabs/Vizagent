export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-gray-800">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-2xl text-cyan">VizTR</span>
          <div className="flex items-center gap-6">
            <a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a>
            <a href="/signup" className="px-4 py-2 bg-cyan text-bg rounded-md font-medium hover:bg-cyan/90 transition-colors">Sign Up</a>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
