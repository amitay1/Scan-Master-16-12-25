/**
 * Splash Screen Demo Page
 *
 * דף להצגת והשוואת כל 10 אופציות הפתיח
 * לחץ על כפתור כדי לראות את האנימציה במסך מלא
 */

import React, { useState } from 'react';
import SplashOption1_UltrasonicWaves from './SplashOption1_UltrasonicWaves';
import SplashOption2_HolographicCube from './SplashOption2_HolographicCube';
import SplashOption3_ParticleFormation from './SplashOption3_ParticleFormation';
import SplashOption4_TechMatrix from './SplashOption4_TechMatrix';
import SplashOption5_AerospaceCommand from './SplashOption5_AerospaceCommand';
import SplashOption6_DNAHelix from './SplashOption6_DNAHelix';
import SplashOption7_PortalWormhole from './SplashOption7_PortalWormhole';
import SplashOption8_NeonElectric from './SplashOption8_NeonElectric';
import SplashOption9_HologramProjection from './SplashOption9_HologramProjection';
import SplashOption10_QuantumField from './SplashOption10_QuantumField';
import SplashOption11_ImmersionTank from './SplashOption11_ImmersionTank';
import SplashOption12_RoboticArm from './SplashOption12_RoboticArm';
import SplashOption13_CScanReveal from './SplashOption13_CScanReveal';
import SplashOption14_AScanPulse from './SplashOption14_AScanPulse';
import SplashOption15_GantrySystem from './SplashOption15_GantrySystem';

const splashOptions = [
  {
    id: 1,
    name: 'Ultrasonic Waves',
    nameHe: 'גלי אולטרסאונד',
    description: 'גלים מתפשטים מהמרכז עם קרן סריקה וטקסט מתגלה',
    Component: SplashOption1_UltrasonicWaves,
    preview: '🌊',
    style: 'אלגנטי ומקצועי',
  },
  {
    id: 2,
    name: 'Holographic Cube',
    nameHe: 'קוביה הולוגרפית',
    description: 'קוביה תלת מימדית מסתובבת שמתפרקת לחלקיקים',
    Component: SplashOption2_HolographicCube,
    preview: '🔮',
    style: 'עתידני וחללי',
  },
  {
    id: 3,
    name: 'Particle Formation',
    nameHe: 'התהוות חלקיקים',
    description: 'אלפי חלקיקים מתרכזים ויוצרים את הלוגו',
    Component: SplashOption3_ParticleFormation,
    preview: '✨',
    style: 'דינמי ומרשים',
  },
  {
    id: 4,
    name: 'Tech Matrix',
    nameHe: 'מטריקס טכנולוגי',
    description: 'סגנון מטריקס/סייברפאנק עם קוד זורם ואפקט גליץ\'',
    Component: SplashOption4_TechMatrix,
    preview: '🖥️',
    style: 'האקר/סייברפאנק',
  },
  {
    id: 5,
    name: 'Aerospace Command',
    nameHe: 'מרכז פיקוד אווירי',
    description: 'מרכז בקרה מקצועי עם מכשירים וגרפים',
    Component: SplashOption5_AerospaceCommand,
    preview: '🛩️',
    style: 'תעשייתי ומקצועי',
  },
  {
    id: 6,
    name: 'DNA Helix',
    nameHe: 'סליל DNA',
    description: 'הלוגו נוצר מתוך מבנה DNA מסתובב - אפקט מדעי מרהיב',
    Component: SplashOption6_DNAHelix,
    preview: '🧬',
    style: 'מדעי וביולוגי',
  },
  {
    id: 7,
    name: 'Portal Wormhole',
    nameHe: 'פורטל חור תולעת',
    description: 'הלוגו צץ מתוך פורטל/חור תולעת מסתחרר',
    Component: SplashOption7_PortalWormhole,
    preview: '🌀',
    style: 'חללי ומיסטי',
  },
  {
    id: 8,
    name: 'Neon Electric',
    nameHe: 'ניאון חשמלי',
    description: 'שלט ניאון עם אפקטים חשמליים והבהובים',
    Component: SplashOption8_NeonElectric,
    preview: '💡',
    style: 'רטרו-פיוצ\'ריסטי',
  },
  {
    id: 9,
    name: 'Hologram Projection',
    nameHe: 'הקרנת הולוגרמה',
    description: 'הולוגרמה מוקרנת כמו בסרטי מדע בדיוני',
    Component: SplashOption9_HologramProjection,
    preview: '📽️',
    style: 'עתידני וטכנולוגי',
  },
  {
    id: 10,
    name: 'Quantum Field',
    nameHe: 'שדה קוונטי',
    description: 'חלקיקים קוונטיים מתחברים ביניהם בשדה אנרגטי',
    Component: SplashOption10_QuantumField,
    preview: '⚛️',
    style: 'מדע עתידני',
  },
  {
    id: 11,
    name: 'Immersion Tank',
    nameHe: 'בריכת טבילה',
    description: 'בריכת בדיקה אולטרסונית עם מים מתמלאים וזרוע רובוטית יורדת',
    Component: SplashOption11_ImmersionTank,
    preview: '🌊',
    style: 'תעשייתי אמיתי',
  },
  {
    id: 12,
    name: 'Robotic Arm',
    nameHe: 'זרוע רובוטית',
    description: 'זרוע רובוטית 6 צירים עם גשש אולטרסוני סורקת חלק',
    Component: SplashOption12_RoboticArm,
    preview: '🦾',
    style: 'רובוטיקה תעשייתית',
  },
  {
    id: 13,
    name: 'C-Scan Reveal',
    nameHe: 'חשיפת C-Scan',
    description: 'תמונת C-Scan נבנית בזמן אמת - הלוגו מתגלה מתוך נתוני הסריקה',
    Component: SplashOption13_CScanReveal,
    preview: '🖥️',
    style: 'הדמיית בדיקה',
  },
  {
    id: 14,
    name: 'A-Scan Pulse',
    nameHe: 'פולס A-Scan',
    description: 'תצוגת A-Scan עם גלים אולטרסוניים חיים ושערים',
    Component: SplashOption14_AScanPulse,
    preview: '📊',
    style: 'אותות UT',
  },
  {
    id: 15,
    name: 'Gantry System',
    nameHe: 'מערכת גנטרי',
    description: 'מערכת בדיקה מלאה - גנטרי 5 צירים עם בריכה וחלק',
    Component: SplashOption15_GantrySystem,
    preview: '🏭',
    style: 'מערכת מלאה',
  },
];

const SplashScreenDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<number | null>(null);
  const [selectedSplash, setSelectedSplash] = useState<number>(() => {
    const saved = localStorage.getItem('selectedSplashScreen');
    return saved ? parseInt(saved) : 1;
  });

  const handleDemoComplete = () => {
    setActiveDemo(null);
  };

  const handleSelectSplash = (id: number) => {
    localStorage.setItem('selectedSplashScreen', id.toString());
    setSelectedSplash(id);
  };

  // If a demo is active, show it fullscreen
  if (activeDemo !== null) {
    const option = splashOptions.find((o) => o.id === activeDemo);
    if (option) {
      const Component = option.Component;
      return (
        <div className="relative">
          <Component onComplete={handleDemoComplete} />
          <button
            onClick={() => setActiveDemo(null)}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/20 transition-all"
          >
            ✕ סגור (או המתן לסיום)
          </button>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🎬 Splash Screen Options - 15 אופציות!
          </h1>
          <p className="text-slate-400 text-lg">
            לחץ על כל אופציה כדי לראות אותה במסך מלא
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {splashOptions.map((option) => (
            <div
              key={option.id}
              className={`group relative bg-slate-800/50 border rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                selectedSplash === option.id
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-green-500/20'
                  : 'border-slate-700 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
              }`}
            >
              {/* Selected badge */}
              {selectedSplash === option.id && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-xs font-bold text-white shadow-lg">
                  נבחר לפתיח
                </div>
              )}

              {/* Preview icon */}
              <div className="text-5xl mb-4">{option.preview}</div>

              {/* Option number */}
              <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedSplash === option.id
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
              }`}>
                {option.id}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-1">{option.name}</h3>
              <h4 className="text-md text-cyan-400 mb-3">{option.nameHe}</h4>

              {/* Style badge */}
              <div className="inline-block px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 mb-3">
                {option.style}
              </div>

              {/* Description */}
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{option.description}</p>

              {/* Action buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => setActiveDemo(option.id)}
                  className="flex-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  צפה
                </button>
                <button
                  onClick={() => handleSelectSplash(option.id)}
                  disabled={selectedSplash === option.id}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSplash === option.id
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400'
                  }`}
                >
                  {selectedSplash === option.id ? 'נבחר' : 'בחר'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-12 bg-slate-800/50 rounded-xl border border-slate-700 p-6 overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-center">📊 השוואה מהירה</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">#</th>
                  <th className="text-left py-3 px-4 text-slate-400">שם</th>
                  <th className="text-left py-3 px-4 text-slate-400">סגנון</th>
                  <th className="text-left py-3 px-4 text-slate-400">WOW Factor</th>
                  <th className="text-left py-3 px-4 text-slate-400">אנימציית לוגו</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: 'גלי אולטרסאונד', style: 'אלגנטי', wow: '⭐⭐⭐⭐', logo: 'ריחוף + טבעות' },
                  { id: 2, name: 'קוביה הולוגרפית', style: 'עתידני', wow: '⭐⭐⭐⭐⭐', logo: '3D + סריקה' },
                  { id: 3, name: 'התהוות חלקיקים', style: 'דינמי', wow: '⭐⭐⭐⭐⭐', logo: 'מחלקיקים' },
                  { id: 4, name: 'מטריקס טכנולוגי', style: 'סייברפאנק', wow: '⭐⭐⭐⭐', logo: 'גליץ\' RGB' },
                  { id: 5, name: 'מרכז פיקוד', style: 'תעשייתי', wow: '⭐⭐⭐⭐', logo: 'רדאר + ריחוף' },
                  { id: 6, name: 'סליל DNA', style: 'מדעי', wow: '⭐⭐⭐⭐⭐', logo: 'מורפינג DNA' },
                  { id: 7, name: 'פורטל', style: 'מיסטי', wow: '⭐⭐⭐⭐⭐', logo: 'יציאה מפורטל' },
                  { id: 8, name: 'ניאון', style: 'רטרו', wow: '⭐⭐⭐⭐⭐', logo: 'הבהוב + ניצוצות' },
                  { id: 9, name: 'הולוגרמה', style: 'עתידני', wow: '⭐⭐⭐⭐⭐', logo: 'הקרנה + גליץ\'' },
                  { id: 10, name: 'שדה קוונטי', style: 'מדע', wow: '⭐⭐⭐⭐⭐', logo: 'צבעים + ריחוף' },
                  { id: 11, name: 'בריכת טבילה', style: 'תעשייתי', wow: '⭐⭐⭐⭐⭐', logo: 'ריחוף + קרני UT' },
                  { id: 12, name: 'זרוע רובוטית', style: 'רובוטיקה', wow: '⭐⭐⭐⭐⭐', logo: 'תנועת סריקה' },
                  { id: 13, name: 'C-Scan', style: 'הדמיה', wow: '⭐⭐⭐⭐⭐', logo: 'מתוך פיקסלים' },
                  { id: 14, name: 'A-Scan', style: 'אותות', wow: '⭐⭐⭐⭐⭐', logo: 'פולס + גלים' },
                  { id: 15, name: 'גנטרי', style: 'מערכת', wow: '⭐⭐⭐⭐⭐', logo: 'תעשייה מלאה' },
                ].map((row) => (
                  <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-bold text-cyan-400">{row.id}</td>
                    <td className="py-3 px-4">{row.name}</td>
                    <td className="py-3 px-4 text-slate-400">{row.style}</td>
                    <td className="py-3 px-4">{row.wow}</td>
                    <td className="py-3 px-4 text-purple-400">{row.logo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>💡 כל אנימציה נמשכת ~5 שניות ומסתיימת אוטומטית</p>
          <p className="mt-2">📁 הקבצים נמצאים ב: <code className="text-cyan-400">src/demos/splash-screens/</code></p>
          <p className="mt-2">🎨 <span className="text-purple-400">5 אופציות UT אמיתיות!</span> בריכת טבילה, זרוע רובוטית, C-Scan, A-Scan, גנטרי</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreenDemo;
