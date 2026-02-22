export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-900 via-green-800 to-green-700 px-6 pt-32 pb-24">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
          Skip the wait. Your{" "}
          <span className="text-brand-400">digital waiter</span> is ready.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-green-100/80">
          Ask about dietary restrictions, get recommendations, and build your
          order smoothly with our AI-powered dining assistant.
        </p>
      </div>
    </section>
  );
}
