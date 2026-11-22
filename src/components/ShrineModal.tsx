import React, { useState } from 'react';

interface Props {
  onClaimReward: (gold: number, fortuneText: string) => void;
  canClaim: boolean;
  onClose: () => void;
}

export const ShrineModal: React.FC<Props> = ({ onClaimReward, canClaim, onClose }) => {
  const [result, setResult] = useState<string | null>(null);

  const handleDrawOmikuji = () => {
    if (!canClaim) return;
    const fortunes = [
      { text: '【大吉】八咫烏の御加護あり。莫大な財を得る。', gold: 500 },
      { text: '【中吉】道中平穏にして吉事多し。', gold: 250 },
      { text: '【小吉】備えあれば憂いなし。武具を研ぎ澄ませ。', gold: 120 }
    ];
    const chosen = fortunes[Math.floor(Math.random() * fortunes.length)];
    setResult(chosen.text);
    onClaimReward(chosen.gold, chosen.text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-4 shadow-2xl text-stone-200 text-xs text-center font-serif">
        <h3 className="font-bold text-base text-amber-400 mb-1">⛩️ 常夜の鎮守神社</h3>
        <p className="text-[10px] text-stone-400 mb-4">一日一回、神前で御神籤を引き運気を占うことができます。</p>

        {result ? (
          <div className="p-3 bg-stone-950 rounded-xl border border-amber-600/60 mb-4 animate-fade-in">
            <div className="text-amber-300 font-bold mb-1">{result}</div>
            <div className="text-[10px] text-stone-400">本日の祈祷が完了しました。</div>
          </div>
        ) : (
          <button
            onClick={handleDrawOmikuji}
            disabled={!canClaim}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mb-4 ${
              canClaim
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/50'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            {canClaim ? '御神籤を引いて参拝する' : '本日の参拝は受領済みです'}
          </button>
        )}

        <button onClick={onClose} className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg">
          神社を辞去する
        </button>
      </div>
    </div>
  );
};
