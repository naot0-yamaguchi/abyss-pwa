import React from "react";
import type { Enemy, PlayerStats } from "../types/game";

interface Props {
  player: PlayerStats;
  enemy: Enemy | null;
  isFighting: boolean;
  isMarching: boolean;
  bloodEffect: { x: number; y: number; id: number } | null;
  critFlash: boolean;
  leechSoul: boolean;
  specialGauge: number;
  onUseSpecial: () => void;
}

export const BattleStage: React.FC<Props> = ({
  player,
  enemy,
  isFighting,
  isMarching,
  bloodEffect,
  critFlash,
  leechSoul,
  specialGauge,
  onUseSpecial,
}) => {
  return (
    <div
      className={`w-full h-56 rounded-2xl overflow-hidden relative border border-stone-700/80 shadow-2xl transition-all duration-300 ${
        critFlash
          ? "bg-white invert"
          : "bg-gradient-to-b from-slate-900 via-indigo-950/70 to-stone-900"
      }`}
    >
      {/* 背景の枯山水・月輪グラフィック */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(217,119,6,0.15),transparent_60%)] pointer-events-none" />

      {/* 会心一閃の走光 */}
      {critFlash && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping">
          <div className="w-full h-1 bg-amber-300 shadow-[0_0_20px_#f59e0b] -rotate-12" />
        </div>
      )}

      {/* 吸血エフェクト（緑・深紅の魂魄がプレイヤーへ収束） */}
      {leechSoul && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-400/40 blur-lg animate-ping" />
          <span className="text-emerald-400 font-bold font-mono text-xs absolute -top-4">
            吸血回復！
          </span>
        </div>
      )}

      {/* 出血スプラッター */}
      {bloodEffect && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          <div
            className="w-16 h-16 bg-rose-600/80 rounded-full blur-md animate-ping"
            style={{
              left: `${bloodEffect.x}%`,
              top: `${bloodEffect.y}%`,
              position: "absolute",
            }}
          />
          <div
            className="w-8 h-8 bg-red-700 rounded-full blur-sm"
            style={{
              left: `${bloodEffect.x + 4}%`,
              top: `${bloodEffect.y + 2}%`,
              position: "absolute",
            }}
          />
        </div>
      )}

      {/* 進軍中のアニメーション表示（ざっ、ざっ…） */}
      {isMarching ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/70 backdrop-blur-sm animate-pulse">
          <div className="text-xl font-serif font-black tracking-[0.3em] text-amber-300">
            ざっ…… ざっ……
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono tracking-widest">
            奥層へ歩を進める……
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full p-4 flex justify-between items-center z-10">
          {/* プレイヤー陣営 */}
          <div
            className={`flex flex-col items-center transition-transform ${isFighting ? "translate-x-2" : ""}`}
          >
            <div className="w-20 h-20 rounded-2xl bg-stone-900/90 border-2 border-amber-600/60 shadow-lg flex items-center justify-center relative">
              <span className="text-3xl">🥷</span>
              {/* レベルバッジ */}
              <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-stone-950 border border-amber-500 rounded text-[9px] font-mono font-bold text-amber-300">
                Lv.{player.level}
              </span>
            </div>
            <span className="text-xs font-serif font-bold text-stone-200 mt-1">
              流浪人
            </span>
          </div>

          {/* 対峙の間（VS） */}
          <div className="flex flex-col items-center">
            {isFighting ? (
              <span className="text-rose-500 font-serif font-black text-xl italic animate-bounce tracking-widest">
                刃交
              </span>
            ) : (
              <span className="text-stone-600 font-serif text-sm">睨合</span>
            )}

            {/* 絶技（必殺技）発動ボタン */}
            <button
              onClick={onUseSpecial}
              disabled={specialGauge < 100}
              className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold font-serif transition-all shadow-lg ${
                specialGauge >= 100
                  ? "bg-gradient-to-r from-amber-500 to-rose-600 text-stone-950 ring-2 ring-amber-300 animate-pulse scale-105"
                  : "bg-stone-800 text-stone-500 cursor-not-allowed"
              }`}
            >
              {specialGauge >= 100
                ? "⚡ 秘奥義・一閃！"
                : `気合 ${specialGauge}%`}
            </button>
          </div>

          {/* 敵陣営 */}
          <div
            className={`flex flex-col items-center transition-transform ${isFighting ? "-translate-x-2" : ""}`}
          >
            <div
              className={`w-20 h-20 rounded-2xl bg-stone-900/90 border-2 shadow-lg flex items-center justify-center relative ${
                enemy?.isBoss
                  ? "border-rose-600 bg-rose-950/40 animate-pulse"
                  : "border-stone-700"
              }`}
            >
              <span className="text-3xl">{enemy?.isBoss ? "👹" : "💀"}</span>
            </div>
            <span className="text-xs font-serif font-bold text-rose-300 mt-1 truncate max-w-[100px]">
              {enemy ? enemy.name : "気配を探る"}
            </span>
          </div>
        </div>
      )}

      {/* 画面下部HPバー帯 */}
      <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent flex justify-between items-center text-[10px] font-mono z-10">
        <div className="w-5/12">
          <div className="flex justify-between mb-0.5 text-stone-300">
            <span>体力</span>
            <span>
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{
                width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%`,
              }}
            />
          </div>
        </div>

        <span className="text-amber-400 font-bold font-serif">
          第 {player.floor} 階層
        </span>

        <div className="w-5/12">
          <div className="flex justify-between mb-0.5 text-rose-300">
            <span className="truncate">{enemy ? enemy.name : "敵影"}</span>
            <span>{enemy ? `${enemy.hp}/${enemy.maxHp}` : "-"}</span>
          </div>
          <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-150"
              style={{
                width: `${enemy ? Math.max(0, (enemy.hp / enemy.maxHp) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
