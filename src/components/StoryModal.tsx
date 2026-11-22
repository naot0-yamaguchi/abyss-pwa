import React, { useState } from 'react';
import type { StoryScene } from '../types/game';

interface Props {
  scene: StoryScene;
  onComplete: () => void;
}

export const StoryModal: React.FC<Props> = ({ scene, onComplete }) => {
  const [lineIdx, setLineIdx] = useState(0);

  const handleNext = () => {
    if (lineIdx < scene.text.length - 1) {
      setLineIdx(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      onClick={handleNext}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer select-none"
    >
      <div className="w-full max-w-md bg-stone-950/95 border-2 border-stone-700/80 rounded-2xl p-4 shadow-2xl relative">
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-stone-800 text-xs font-mono">
          <span className="text-amber-500 font-bold tracking-wider">{scene.title}</span>
          <span className="text-stone-500 text-[10px]">画面タップで進む ▼</span>
        </div>

        <div className="text-stone-400 font-serif font-bold text-xs mb-1.5 flex items-center space-x-1.5">
          <span className="text-base">🏮</span>
          <span>{scene.speaker}</span>
        </div>

        <p className="text-stone-200 text-xs leading-relaxed font-serif min-h-[56px]">
          {scene.text[lineIdx]}
        </p>

        <div className="text-right mt-2">
          <span className="text-[10px] text-stone-500 font-mono">
            {lineIdx + 1} / {scene.text.length}
          </span>
        </div>
      </div>
    </div>
  );
};
