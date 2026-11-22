import React from 'react';
import type { EquipmentState } from '../types/game';

interface AvatarProps {
  type: 'player' | 'enemy';
  equipment?: EquipmentState;
  enemyType?: string;
  isBoss?: boolean;
}

export const PixelAvatar: React.FC<AvatarProps> = ({ type, equipment, enemyType, isBoss }) => {
  if (type === 'player') {
    const hasHelm = Boolean(equipment?.head);
    const hasChest = Boolean(equipment?.chest);
    const hasMainHand = Boolean(equipment?.mainHand);
    const hasOffHand = Boolean(equipment?.offHand);
    const hasLegs = Boolean(equipment?.legs);

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* 背景の微弱なルーンサークル */}
        <div className="absolute inset-0 rounded-full bg-cyan-950/20 blur-md pointer-events-none" />

        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
          <defs>
            {/* 甲冑の金属グラデーション */}
            <linearGradient id="armorSteel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#1e293b" />
              <stop offset="80%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            {/* 刃のハイライト */}
            <linearGradient id="bladeGleam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="30%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            {/* 盾のダークメタル */}
            <linearGradient id="shieldPlate" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            {/* バイザーのサイバーアイ発光 */}
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 接地面のリアルな影 */}
          <ellipse cx="50" cy="94" rx="28" ry="5" fill="#000" opacity="0.6" filter="blur(2px)" />

          {/* マント（背景側） */}
          <path d="M34 42 Q20 68 24 88 Q48 84 72 88 Q78 65 66 42 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />

          {/* 脚部（グリーブ） */}
          <g>
            {/* 左脚 */}
            <path d="M40 68 L36 88 L44 91 L46 68 Z" fill={hasLegs ? 'url(#armorSteel)' : '#1c1917'} stroke="#334155" strokeWidth="0.8" />
            {/* 右脚 */}
            <path d="M54 68 L52 91 L60 88 L58 68 Z" fill={hasLegs ? 'url(#armorSteel)' : '#1c1917'} stroke="#334155" strokeWidth="0.8" />
            {/* 鉄甲靴 */}
            <path d="M34 87 L44 91 L32 93 Z" fill="#090d16" />
            <path d="M62 87 L52 91 L64 93 Z" fill="#090d16" />
          </g>

          {/* 胴体部（チェストプレート） */}
          <path
            d="M34 38 L40 68 L60 68 L66 38 Q50 34 34 38 Z"
            fill={hasChest ? 'url(#armorSteel)' : '#1e293b'}
            stroke={hasChest ? '#64748b' : '#334155'}
            strokeWidth="1.2"
          />
          {/* 胸部エンブレム/コア */}
          {hasChest && (
            <path d="M47 46 L53 46 L50 54 Z" fill="#38bdf8" className="animate-pulse" filter="drop-shadow(0 0 3px #38bdf8)" />
          )}

          {/* 肩当て（ポールドロン） */}
          <path d="M28 36 Q38 32 40 44 L32 48 Z" fill="url(#armorSteel)" stroke="#475569" strokeWidth="1" />
          <path d="M72 36 Q62 32 60 44 L68 48 Z" fill="url(#armorSteel)" stroke="#475569" strokeWidth="1" />

          {/* 頭部（兜またはフード） */}
          {hasHelm ? (
            <g>
              {/* 重装ヘルム */}
              <path d="M38 24 Q50 14 62 24 L60 38 Q50 42 40 38 Z" fill="url(#armorSteel)" stroke="#64748b" strokeWidth="1.2" />
              {/* バイザースリット */}
              <path d="M42 27 L58 27 L50 31 Z" fill="#020617" />
              {/* 瞳の発光 */}
              <circle cx="47" cy="28.5" r="1.5" fill="#38bdf8" filter="url(#eyeGlow)" />
              <circle cx="53" cy="28.5" r="1.5" fill="#38bdf8" filter="url(#eyeGlow)" />
              {/* 兜のクレスト/飾り羽 */}
              <path d="M48 14 L50 8 L52 14 Z" fill="#d97706" />
            </g>
          ) : (
            <g>
              {/* ダークフード */}
              <path d="M36 26 Q50 16 64 26 Q62 42 50 42 Q38 42 36 26 Z" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
              {/* 覗く双眸 */}
              <circle cx="46" cy="30" r="1.2" fill="#38bdf8" />
              <circle cx="54" cy="30" r="1.2" fill="#38bdf8" />
            </g>
          )}

          {/* メインウェポン（長剣/両手剣） */}
          {hasMainHand && (
            <g transform="translate(18, 22) rotate(-18)">
              {/* 剣身 */}
              <path d="M3 0 L6 40 L3 45 L0 40 Z" fill="url(#bladeGleam)" stroke="#cbd5e1" strokeWidth="0.5" />
              <line x1="3" y1="4" x2="3" y2="40" stroke="#475569" strokeWidth="0.8" />
              {/* 鍔（クロスガード） */}
              <rect x="-5" y="40" width="16" height="3" rx="1" fill="#d97706" stroke="#78350f" strokeWidth="0.5" />
              {/* 柄 & 鬼頭 */}
              <rect x="1.5" y="43" width="3" height="10" fill="#292524" />
              <circle cx="3" cy="55" r="2.5" fill="#b45309" />
            </g>
          )}

          {/* オフハンド（大盾/カイトシールド） */}
          {hasOffHand && (
            <g transform="translate(64, 40)">
              <path
                d="M4 0 L24 4 Q20 28 4 38 Q-1 20 4 0 Z"
                fill="url(#shieldPlate)"
                stroke="#6366f1"
                strokeWidth="1.2"
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.8))"
              />
              {/* 盾の紋章 */}
              <path d="M12 8 L16 16 L8 16 Z" fill="#a5b4fc" opacity="0.8" />
              <line x1="12" y1="16" x2="12" y2="28" stroke="#a5b4fc" strokeWidth="1.2" opacity="0.8" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // 敵モンスターの描画
  return (
    <div className={`relative ${isBoss ? 'w-36 h-36' : 'w-28 h-28'} flex items-center justify-center`}>
      {/* ボス特有のダークオーラ */}
      {isBoss && (
        <div className="absolute inset-0 rounded-full bg-rose-600/25 blur-xl animate-pulse pointer-events-none" />
      )}

      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)]">
        <defs>
          <radialGradient id="bossCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="60%" stopColor="#881337" />
            <stop offset="100%" stopColor="#1f0208" />
          </radialGradient>
          <linearGradient id="bonePlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* 接地影 */}
        <ellipse cx="50" cy="94" rx={isBoss ? '36' : '26'} ry="5" fill="#000" opacity="0.7" filter="blur(2px)" />

        {isBoss ? (
          /* ボス: 深淵の覇王 (Void Arch-Fiend) */
          <g>
            {/* 巨大な悪魔の翼 */}
            <path
              d="M50 48 Q20 10 2 28 Q15 50 38 60 Z"
              fill="#26040c"
              stroke="#e11d48"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <path
              d="M50 48 Q80 10 98 28 Q85 50 62 60 Z"
              fill="#26040c"
              stroke="#e11d48"
              strokeWidth="1.2"
              opacity="0.9"
            />

            {/* 禍々しい体躯 */}
            <path d="M36 40 Q50 34 64 40 L60 84 Q50 88 40 84 Z" fill="url(#bossCore)" stroke="#f43f5e" strokeWidth="1.5" />

            {/* 巨大な角（左右） */}
            <path d="M38 34 Q20 22 18 6 Q32 16 36 28 Z" fill="url(#bonePlate)" stroke="#475569" strokeWidth="1" />
            <path d="M62 34 Q80 22 82 6 Q68 16 64 28 Z" fill="url(#bonePlate)" stroke="#475569" strokeWidth="1" />

            {/* 頭部スカル */}
            <path d="M38 28 Q50 20 62 28 L58 48 Q50 54 42 48 Z" fill="#090205" stroke="#e11d48" strokeWidth="1.2" />

            {/* 灼熱の3つ目 */}
            <circle cx="44" cy="36" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #f59e0b)" />
            <circle cx="56" cy="36" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #f59e0b)" />
            <circle cx="50" cy="30" r="2" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />

            {/* 巨大な胸部コア */}
            <circle cx="50" cy="62" r="6" fill="#f43f5e" className="animate-ping" opacity="0.75" />
            <circle cx="50" cy="62" r="5" fill="#fbbf24" />
          </g>
        ) : enemyType === 'spider' ? (
          /* サイバー機械蜘蛛 (Scrap Stalker) */
          <g>
            {/* 蜘蛛の8本脚 */}
            <path d="M35 50 Q10 32 4 48 M35 55 Q8 50 2 68 M65 50 Q90 32 96 48 M65 55 Q92 50 98 68" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* 機械甲殻 */}
            <ellipse cx="50" cy="62" rx="16" ry="12" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
            <ellipse cx="50" cy="44" rx="11" ry="9" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            {/* 単眼センサー群 */}
            <circle cx="46" cy="42" r="2" fill="#06b6d4" filter="drop-shadow(0 0 2px #06b6d4)" />
            <circle cx="54" cy="42" r="2" fill="#06b6d4" filter="drop-shadow(0 0 2px #06b6d4)" />
            <circle cx="50" cy="47" r="1.5" fill="#ef4444" />
          </g>
        ) : (
          /* 通常ゴースト (Abyssal Shade) */
          <g>
            {/* 揺らめく煙・怨霊 */}
            <path
              d="M30 84 Q24 50 32 30 Q50 12 68 30 Q76 50 70 84 Q60 76 50 84 Q40 76 30 84 Z"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* 引き裂かれたボロ布 */}
            <path d="M36 44 L64 44 L50 68 Z" fill="#1e293b" opacity="0.6" />
            {/* 冷気の双眸 */}
            <ellipse cx="44" cy="34" rx="2.5" ry="3.5" fill="#38bdf8" filter="drop-shadow(0 0 5px #0284c7)" />
            <ellipse cx="56" cy="34" rx="2.5" ry="3.5" fill="#38bdf8" filter="drop-shadow(0 0 5px #0284c7)" />
          </g>
        )}
      </svg>
    </div>
  );
};
