import React from 'react';
import { getDropRateForFloor, RARITY_CONFIG } from '../data/items';
import type { Rarity } from '../types/game';

interface Props {
  currentFloor: number;
  onClose: () => void;
}

export const DropRateTipsModal: React.FC<Props> = ({ currentFloor, onClose }) => {
  const tiers = [
    { label: '第一領域: 逢魔が辻 (1 - 10 階層)', floor: 5 },
    { label: '第二領域: 羅生門 (11 - 30 階層)', floor: 20 },
    { label: '第三領域: 怨嗟の大樹 (31 - 60 階層)', floor: 45 },
    { label: '第四領域: 常夜の奈落 (61+ 階層)', floor: 70 }
  ];

  const rarities: Rarity[] = ['一般', '上等', '希少', '名品', '伝説', '神話'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-2xl p-4 shadow-2xl text-stone-200 text-xs font-serif">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-sm text-stone-100 tracking-wide">武具排出確率</h3>
            <p className="text-[10px] text-stone-400">現在到達深度: 第 {currentFloor} 階層</p>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-stone-400 text-base">✕</button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {tiers.map(tier => {
            const normalRates = getDropRateForFloor(tier.floor, false);
            return (
              <div key={tier.label} className="bg-stone-950/70 p-3 rounded-lg border border-stone-800/80">
                <div className="font-semibold text-stone-300 mb-2">{tier.label}</div>
                <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-mono mb-2">
                  {rarities.map(r => (
                    <div key={r} className="flex flex-col">
                      <span className={`font-bold ${RARITY_CONFIG[r].color}`}>{r}</span>
                      <span className="text-stone-400">{normalRates[r]}%</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] bg-rose-950/40 border border-rose-900/40 rounded p-1.5 flex justify-between items-center">
                  <span className="text-rose-300 font-semibold">境界守護者 (10階層ごと):</span>
                  <span className="font-mono text-stone-300">希少以上確定！</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
