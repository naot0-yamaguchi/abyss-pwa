import React from 'react';

interface Props {
  currentFloor: number;
  maxFloorReached: number;
  onSelectFloor: (floor: number) => void;
  onChallengeBossSkip: (targetBossFloor: number) => void;
  onClose: () => void;
}

export const FloorSelectModal: React.FC<Props> = ({
  currentFloor,
  maxFloorReached,
  onSelectFloor,
  onChallengeBossSkip,
  onClose
}) => {
  // アンロック済みの10の倍数ボスフロア
  const nextBossFloor = Math.ceil(currentFloor / 10) * 10;
  const canSkipBoss = nextBossFloor <= maxFloorReached + 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-4 shadow-2xl text-stone-200 text-xs">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-800">
          <div>
            <h3 className="font-serif font-black text-stone-100 tracking-wide text-sm">EXPEDITION WAYPOINT</h3>
            <p className="text-[10px] text-stone-400">Deepest Descent: Floor {maxFloorReached}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-stone-400 text-base">✕</button>
        </div>

        {/* ボス直行スキップバナー */}
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl">
          <div className="font-bold text-rose-300 mb-0.5">⚡ Boss Challenge Skip</div>
          <p className="text-[10px] text-stone-400 mb-2">
            Directly assault the Floor {nextBossFloor} Boss. Victory instantly clears all intermediate floors!
          </p>
          <button
            onClick={() => onChallengeBossSkip(nextBossFloor)}
            disabled={!canSkipBoss}
            className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              canSkipBoss
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            Assault Floor {nextBossFloor} Boss
          </button>
        </div>

        {/* 階層選択グリッド */}
        <div className="text-[10px] font-mono text-stone-500 mb-2">CHOOSE DESTINATION</div>
        <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1 bg-stone-950/60 rounded-xl border border-stone-800">
          {Array.from({ length: maxFloorReached }).map((_, i) => {
            const floorNum = i + 1;
            const isCurrent = currentFloor === floorNum;
            const isBoss = floorNum % 10 === 0;

            return (
              <button
                key={floorNum}
                onClick={() => onSelectFloor(floorNum)}
                className={`py-2 rounded font-mono font-bold text-center transition-all ${
                  isCurrent
                    ? 'bg-stone-100 text-stone-950'
                    : isBoss
                    ? 'bg-rose-950/70 border border-rose-700/80 text-rose-300'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800/80'
                }`}
              >
                {floorNum}F
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
