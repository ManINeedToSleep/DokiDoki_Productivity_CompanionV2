"use client";

export default function Options() {
  return (
    <div className="absolute right-0 top-0 w-[65vw] h-screen p-8">
      <h2 className="text-4xl font-[Riffic] text-pink-400 mb-6">Options</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-2xl text-pink-300 mb-3">Sound</h3>
          {/* Add sound controls */}
        </section>
        <section>
          <h3 className="text-2xl text-pink-300 mb-3">Display</h3>
          {/* Add display settings */}
        </section>
      </div>
    </div>
  );
}
