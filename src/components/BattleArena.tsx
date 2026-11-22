import React from 'react';
import type { Enemy, PlayerStats } from '../types/game';

interface Props {
  player: PlayerStats;
  enemy: Enemy | null;
  isFighting: boolean;
  onToggleFight: () => void;
}

export const BattleArena: React.FC<Props> = ({
  player,
  enemy,
  isFighting,
  onToggleFight
}) => {
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const enemyHpPct = enemy ? Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100)) : 0;

  return (
    <div className="w-full bg-slate-900/60 rounded-xl border border-slate-800 p-3 mb-3 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-cyan-400 font-mono font-bold">FLOOR {player.floor}</span>
        <button
          onClick={onToggleFight}
          className={`px-3 py-1 rounded-full font-bold text-xs transition-colors ${
            isFighting
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isFighting ? 'BATTLE IN PROGRESS...' : 'START CLIMB'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center">
        {/* プレイヤー情報 */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-slate-200">Player Lv.{player.level}</span>
            <span className="text-[11px] text-slate-400 font-mono">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-200"
              style={{ width: `${playerHpPct}%` }}
            />
          </div>
        </div>

        {/* 敵情報 */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-rose-300 truncate">{enemy ? enemy.name : 'No Target'}</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {enemy ? `${enemy.hp}/${enemy.maxHp}` : '-'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-200"
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

