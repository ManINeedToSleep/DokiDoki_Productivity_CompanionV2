"use client";

export default function Help() {
  return (
    <div className="absolute right-0 top-0 w-[65vw] h-screen p-8">
      <h2 className="text-4xl font-[Riffic] text-pink-400 mb-6">Help</h2>
      <div className="space-y-4">
        <section>
          <h3 className="text-2xl text-pink-300 mb-3">How to Play</h3>
          <p className="text-lg text-pink-200">
            Guide to interacting with the AI chat system...
          </p>
        </section>
        {/* Add more help sections */}
      </div>
    </div>
  );
}
