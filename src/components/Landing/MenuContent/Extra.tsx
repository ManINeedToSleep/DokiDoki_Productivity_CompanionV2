"use client";

export default function Extra() {
  return (
    <div className="absolute right-0 top-0 w-[65vw] h-screen p-8">
      <h2 className="text-4xl font-[Riffic] text-pink-400 mb-6">Extra</h2>
      <div className="space-y-4">
        <section>
          <h3 className="text-2xl text-pink-300 mb-3">Gallery</h3>
          {/* Add gallery content */}
        </section>
        <section>
          <h3 className="text-2xl text-pink-300 mb-3">Music Box</h3>
          {/* Add music player */}
        </section>
      </div>
    </div>
  );
}
