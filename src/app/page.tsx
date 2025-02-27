import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import MenuOption from "@/components/Landing/MenuOption";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <PolkaDotBackground />
      <MenuOption />
    </main>
  );
}
