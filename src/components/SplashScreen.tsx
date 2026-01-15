/**
 * Dynamic Splash Screen Loader
 * Loads the user's selected splash screen from localStorage
 */

import { useState, useEffect } from "react";

// Import all splash screen options
import SplashOption1_UltrasonicWaves from "@/demos/splash-screens/SplashOption1_UltrasonicWaves";
import SplashOption2_HolographicCube from "@/demos/splash-screens/SplashOption2_HolographicCube";
import SplashOption3_ParticleFormation from "@/demos/splash-screens/SplashOption3_ParticleFormation";
import SplashOption4_TechMatrix from "@/demos/splash-screens/SplashOption4_TechMatrix";
import SplashOption5_AerospaceCommand from "@/demos/splash-screens/SplashOption5_AerospaceCommand";
import SplashOption6_DNAHelix from "@/demos/splash-screens/SplashOption6_DNAHelix";
import SplashOption7_PortalWormhole from "@/demos/splash-screens/SplashOption7_PortalWormhole";
import SplashOption8_NeonElectric from "@/demos/splash-screens/SplashOption8_NeonElectric";
import SplashOption9_HologramProjection from "@/demos/splash-screens/SplashOption9_HologramProjection";
import SplashOption10_QuantumField from "@/demos/splash-screens/SplashOption10_QuantumField";
import SplashOption11_ImmersionTank from "@/demos/splash-screens/SplashOption11_ImmersionTank";
import SplashOption12_RoboticArm from "@/demos/splash-screens/SplashOption12_RoboticArm";
import SplashOption13_CScanReveal from "@/demos/splash-screens/SplashOption13_CScanReveal";
import SplashOption14_AScanPulse from "@/demos/splash-screens/SplashOption14_AScanPulse";
import SplashOption15_GantrySystem from "@/demos/splash-screens/SplashOption15_GantrySystem";

// Map of all splash screen components by ID
const splashScreens: Record<number, React.ComponentType<{ onComplete: () => void }>> = {
  1: SplashOption1_UltrasonicWaves,
  2: SplashOption2_HolographicCube,
  3: SplashOption3_ParticleFormation,
  4: SplashOption4_TechMatrix,
  5: SplashOption5_AerospaceCommand,
  6: SplashOption6_DNAHelix,
  7: SplashOption7_PortalWormhole,
  8: SplashOption8_NeonElectric,
  9: SplashOption9_HologramProjection,
  10: SplashOption10_QuantumField,
  11: SplashOption11_ImmersionTank,
  12: SplashOption12_RoboticArm,
  13: SplashOption13_CScanReveal,
  14: SplashOption14_AScanPulse,
  15: SplashOption15_GantrySystem,
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedId, setSelectedId] = useState<number>(1);

  useEffect(() => {
    // Load selected splash screen from localStorage
    const saved = localStorage.getItem('selectedSplashScreen');
    if (saved) {
      const id = parseInt(saved);
      if (id >= 1 && id <= 15) {
        setSelectedId(id);
      }
    }
  }, []);

  // Get the selected splash screen component
  const SelectedSplash = splashScreens[selectedId] || SplashOption1_UltrasonicWaves;

  return <SelectedSplash onComplete={onComplete} />;
};

export default SplashScreen;
