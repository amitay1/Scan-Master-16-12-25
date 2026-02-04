/**
 * Splash Screen Demo Page
 * 3 video options to preview and select as the app intro
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const videoOptions = [
  {
    id: 1,
    name: 'Intro Original',
    src: '/output_HD1080.mp4',
  },
  {
    id: 2,
    name: 'Intro V2',
    src: '/output_HD1080%20(1).mp4',
  },
  {
    id: 3,
    name: 'Intro V3',
    src: '/output_HD1080%20(2).mp4',
  },
];

const SplashScreenDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedSplashVideo');
    return saved ? parseInt(saved) : 1;
  });
  const [playingId, setPlayingId] = useState<number | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const handleSelect = (id: number) => {
    localStorage.setItem('selectedSplashVideo', id.toString());
    setSelectedId(id);
  };

  const handlePlay = (id: number) => {
    // Pause any currently playing
    if (playingId !== null && videoRefs.current[playingId]) {
      videoRefs.current[playingId]!.pause();
      videoRefs.current[playingId]!.currentTime = 0;
    }

    const video = videoRefs.current[id];
    if (video) {
      video.currentTime = 0;
      video.play();
      setPlayingId(id);
    }
  };

  const handleVideoEnd = (id: number) => {
    if (playingId === id) setPlayingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Scan Master</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Splash Screen Options
          </h1>
          <p className="text-slate-400 text-lg">
            Preview each option and choose your intro
          </p>
        </div>

        {/* Video Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {videoOptions.map((option) => (
            <div
              key={option.id}
              className={`relative bg-slate-800/50 border rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                selectedId === option.id
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-green-500/20'
                  : 'border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              {/* Selected badge */}
              {selectedId === option.id && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-green-500 rounded-full text-xs font-bold text-white shadow-lg">
                  Selected
                </div>
              )}

              {/* Video preview */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={(el) => { videoRefs.current[option.id] = el; }}
                  src={option.src}
                  className="w-full h-full object-cover"
                  onEnded={() => handleVideoEnd(option.id)}
                  playsInline
                />
                {/* Play overlay */}
                {playingId !== option.id && (
                  <button
                    onClick={() => handlePlay(option.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>

              {/* Info & actions */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-3">{option.name}</h3>
                <button
                  onClick={() => handleSelect(option.id)}
                  disabled={selectedId === option.id}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedId === option.id
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400'
                  }`}
                >
                  {selectedId === option.id ? 'Selected' : 'Set as Intro'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreenDemo;
