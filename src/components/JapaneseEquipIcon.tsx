import React from "react";
import type { EquipSlot, Rarity } from "../types/game";
import { RARITY_CONFIG } from "../data/items";

interface Props {
  slot: EquipSlot;
  rarity?: Rarity;
  size?: "sm" | "md" | "lg";
}

// 修正後（17行目付近〜SVG外枠部分）
export const JapaneseEquipIcon: React.FC<Props> = ({
  slot,
  rarity = "一般",
  size = "md",
}) => {
  const rKey = (rarity || "一般") as keyof typeof RARITY_CONFIG;
  const rCfg = RARITY_CONFIG[rKey] || RARITY_CONFIG["一般"];
  const sizeClass =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8";

  return (
    <div
      className={`relative ${sizeClass} flex items-center justify-center shrink-0`}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient
            id={`goldGrad_${slot}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* 外枠装飾（レアリティ枠色を反映） */}
        <rect
          x="5"
          y="5"
          width="30"
          height="30"
          rx="4"
          transform="rotate(45 20 20)"
          fill="#1c1917"
          stroke={rCfg ? "#78716c" : "#44403c"}
          strokeWidth="1.5"
        />

        {slot === "mainHand" && (
          /* 日本刀の反りと刃文 */
          <g transform="translate(4, 2)">
            <path
              d="M6 30 Q18 20 28 6 L26 4 Q16 18 4 28 Z"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            <line
              x1="6"
              y1="30"
              x2="2"
              y2="34"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="6" cy="30" r="1.5" fill="#ca8a04" />
          </g>
        )}

        {slot === "offHand" && (
          /* 陣扇 / 破魔盾 */
          <g transform="translate(6, 6)">
            <path
              d="M4 24 Q14 8 24 24 Q14 20 4 24 Z"
              fill="#991b1b"
              stroke="#f87171"
              strokeWidth="0.8"
            />
            <circle cx="14" cy="18" r="3" fill="#fbbf24" />
          </g>
        )}

        {slot === "head" && (
          /* 陣笠・兜の前立 */
          <g transform="translate(5, 7)">
            <path
              d="M2 18 Q15 6 28 18 Z"
              fill="#292524"
              stroke="#78716c"
              strokeWidth="1"
            />
            <path d="M15 6 L15 1 L17 4 Z" fill="url(#goldGrad_head)" />
          </g>
        )}

        {slot === "chest" && (
          /* 胴丸・大鎧 */
          <g transform="translate(7, 7)">
            <path
              d="M4 4 L22 4 L20 22 L6 22 Z"
              fill="#1e1b4b"
              stroke="#818cf8"
              strokeWidth="1"
            />
            <line
              x1="4"
              y1="10"
              x2="22"
              y2="10"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            <line
              x1="5"
              y1="16"
              x2="21"
              y2="16"
              stroke="#f59e0b"
              strokeWidth="1"
            />
          </g>
        )}

        {slot === "legs" && (
          /* 脛当 */
          <g transform="translate(9, 6)">
            <rect
              x="2"
              y="4"
              width="6"
              height="18"
              rx="2"
              fill="#27272a"
              stroke="#71717a"
              strokeWidth="1"
            />
            <rect
              x="14"
              y="4"
              width="6"
              height="18"
              rx="2"
              fill="#27272a"
              stroke="#71717a"
              strokeWidth="1"
            />
          </g>
        )}

        {slot === "ring" && (
          /* 勾玉 */
          <g transform="translate(10, 8)">
            <path
              d="M10 2 C16 2 18 8 14 14 C10 18 10 22 10 22 C10 22 6 18 6 12 C6 6 8 2 10 2 Z"
              fill="#047857"
              stroke="#34d399"
              strokeWidth="1"
            />
            <circle cx="10" cy="7" r="1.5" fill="#064e3b" />
          </g>
        )}
      </svg>
    </div>
  );
};
