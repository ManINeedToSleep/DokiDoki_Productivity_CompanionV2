"use client";

export default function LoadGame() {
  return (
    <div className="absolute right-0 top-0 w-[65vw] h-screen p-8">
      <h2 className="text-4xl font-[Riffic] text-pink-400 mb-6">Load Game</h2>
      <div className="space-y-4">
        <p className="text-lg text-pink-200">
          Continue from where you left off...
        </p>
        {/* Add your save game slots here */}
      </div>
    </div>
  );
}
