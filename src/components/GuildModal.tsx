import React, { useState } from 'react';
import type { Quest, Title, Talisman, EquipmentState, EquipSlot } from '../types/game';
import { generateGachaTalisman } from '../data/guild';
import { RARITY_CONFIG } from '../data/items';
import { JapaneseEquipIcon } from './JapaneseEquipIcon';

interface Props {
  gold: number;
  quests: Quest[];
  titles: Title[];
  activeTitleId: string | null;
  equipment: EquipmentState;
  equippedTalisman: Talisman | null;
  onClaimQuest: (questId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onRepairAll: (cost: number) => void;
  onUpgradeItem: (slot: EquipSlot, cost: number) => void;
  onDrawTalisman: (talisman: Talisman, cost: number) => void;
  onEquipTalisman: (talisman: Talisman) => void;
  onClose: () => void;
}

export const GuildModal: React.FC<Props> = ({
  gold,
  quests,
  titles,
  activeTitleId,
  equipment,
  equippedTalisman,
  onClaimQuest,
  onSelectTitle,
  onRepairAll,
  onUpgradeItem,
  onDrawTalisman,
  onClose
}) => {
  const [tab, setTab] = useState<'bounty' | 'forge' | 'talisman' | 'titles'>('bounty');

  const brokenItems = Object.values(equipment).filter(i => i && i.durability < i.maxDurability);
// 修正後:
  const totalRepairCost = brokenItems.reduce((acc, cur) => {
    const rKey = (cur?.rarity || '一般') as keyof typeof RARITY_CONFIG;
    const rate = RARITY_CONFIG[rKey]?.repairMult ?? 1;
    return acc + (cur!.maxDurability - cur!.durability) * rate * 3;
  }, 0);

  const handleGacha = () => {
    const cost = 250;
    if (gold < cost) return;
    const tal = generateGachaTalisman();
    onDrawTalisman(tal, cost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md font-serif">
      <div className="w-full max-w-md h-[88vh] bg-stone-900 border-2 border-stone-700 rounded-2xl flex flex-col justify-between shadow-2xl text-stone-200 overflow-hidden">
        {/* 表題部 */}
        <div className="p-3 border-b border-stone-800 bg-stone-950 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-amber-400 tracking-wider text-sm">
              常夜の宿場・鍛冶処
            </h3>
            <p className="text-[10px] text-stone-400">社守の巫女・静音と刀鍛冶が逗留しています。</p>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-stone-400 text-lg">✕</button>
        </div>

        {/* 和風タブナビゲーション */}
        <div className="grid grid-cols-4 border-b border-stone-800 text-xs bg-stone-950 font-bold">
          <button
            onClick={() => setTab('bounty')}
            className={`py-2 text-center border-b-2 ${tab === 'bounty' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-500'}`}
          >
            討伐手配書
          </button>
          <button
            onClick={() => setTab('forge')}
            className={`py-2 text-center border-b-2 ${tab === 'forge' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-500'}`}
          >
            銘刀鍛冶
          </button>
          <button
            onClick={() => setTab('talisman')}
            className={`py-2 text-center border-b-2 ${tab === 'talisman' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-500'}`}
          >
            深淵護石
          </button>
          <button
            onClick={() => setTab('titles')}
            className={`py-2 text-center border-b-2 ${tab === 'titles' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-500'}`}
          >
            武名称号
          </button>
        </div>

        {/* 本文エリア */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
          {tab === 'bounty' && (
            <div>
              {/* 静音の台詞枠 */}
              <div className="flex items-start space-x-3 bg-stone-950/80 p-3 rounded-xl border border-stone-800 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-600 flex items-center justify-center text-xl shrink-0">
                  ⛩️
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300">巫女・静音</div>
                  <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">
                    「流浪人様、深層より這い出る妖異の討伐手配書が届いております。達成なされば相応の両目を差し上げましょう。」
                  </p>
                </div>
              </div>

              {/* クエスト一覧 */}
              <div className="space-y-2">
                {quests.map(q => (
                  <div key={q.id} className="p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-stone-200">{q.title}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        進捗: {q.currentCount}/{q.targetCount} • 褒美: <span className="text-amber-400">{q.rewardGold} 両</span>
                      </div>
                    </div>
                    {q.isClaimed ? (
                      <span className="text-[10px] text-stone-500 font-bold px-2 py-1 bg-stone-900 rounded">受領済</span>
                    ) : (
                      <button
                        onClick={() => onClaimQuest(q.id)}
                        disabled={!q.isCompleted}
                        className={`px-3 py-1 rounded text-[11px] font-bold ${
                          q.isCompleted
                            ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 animate-bounce'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        褒美を受取る
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'forge' && (
            <div className="space-y-3">
              {/* 全武具修理 */}
              <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-200">研ぎ師の武具手入れ</div>
                  <div className="text-[10px] text-stone-400">身に纏う全武具の刃こぼれを研ぎ直します。</div>
                </div>
                <button
                  onClick={() => onRepairAll(totalRepairCost)}
                  disabled={totalRepairCost === 0 || gold < totalRepairCost}
                  className={`px-3 py-1.5 rounded font-bold text-xs ${
                    totalRepairCost > 0 && gold >= totalRepairCost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  研ぎ直す ({totalRepairCost} 両)
                </button>
              </div>

              {/* 武具鍛錬 */}
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">武具鍛錬</div>
              <div className="space-y-2">
                {(Object.entries(equipment) as [EquipSlot, EquipmentState[EquipSlot]][]).map(([slot, item]) => {
                  if (!item) return null;
                  const upgradeCost = (item.upgradeLevel + 1) * 85;
                  return (
                    <div key={slot} className="p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <JapaneseEquipIcon slot={slot} rarity={item.rarity} size="sm" />
                        <div>
                          <div className="font-bold text-stone-200">
                            {item.name} <span className="text-amber-400">+{item.upgradeLevel}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            耐久: {item.durability}/{item.maxDurability} • 次回性能: +15%
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onUpgradeItem(slot, upgradeCost)}
                        disabled={gold < upgradeCost}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          gold >= upgradeCost ? 'bg-amber-600 hover:bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        鍛錬 ({upgradeCost} 両)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'talisman' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-br from-indigo-950/70 to-stone-950 border border-indigo-700/60 rounded-xl text-center">
                <div className="font-black text-amber-300 text-sm mb-1">
                  深淵の霊核鑑定
                </div>
                <p className="text-[10px] text-stone-300 mb-2">
                  常夜の穢れから極上の効果を秘めた護石を錬成します。
                </p>
                <button
                  onClick={handleGacha}
                  disabled={gold < 250}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                    gold >= 250
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-900/40'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  霊核を錬成する (250 両)
                </button>
              </div>

              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">装着中の護石</div>
              {equippedTalisman ? (
                <div className={`p-3 rounded-xl border bg-stone-950/90 ${RARITY_CONFIG[equippedTalisman.rarity]?.border || 'border-stone-700'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${RARITY_CONFIG[equippedTalisman.rarity]?.color || 'text-stone-300'}`}>
                      🔮 {equippedTalisman.name}
                    </span>
                    <span className="text-[9px] font-bold text-amber-400">{equippedTalisman.rarity}</span>
                  </div>
                  <div className="text-[11px] text-stone-300 mb-1">{equippedTalisman.skillDesc}</div>
                  <div className="text-[10px] font-mono text-stone-400">
                    +{equippedTalisman.atkBonus} 攻撃力 • +{Math.round(equippedTalisman.critBonus * 100)}% 会心率
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-stone-800 text-center text-stone-500">
                  護石は未装着です。
                </div>
              )}
            </div>
          )}

          {tab === 'titles' && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">獲得済みの武名</div>
              {titles.map(t => {
                const isActive = activeTitleId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border flex justify-between items-center ${
                      t.unlocked
                        ? isActive
                          ? 'border-amber-500 bg-amber-950/40'
                          : 'border-stone-800 bg-stone-950/60'
                        : 'border-stone-900 bg-stone-950/30 opacity-40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-stone-200">
                        {t.name} {isActive && <span className="text-amber-400 text-[10px]">（名乗り中）</span>}
                      </div>
                      <div className="text-[10px] text-stone-400">{t.desc}</div>
                    </div>
                    {t.unlocked && !isActive && (
                      <button
                        onClick={() => onSelectTitle(t.id)}
                        className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold"
                      >
                        名乗る
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-between items-center text-xs font-mono">
          <span className="text-stone-400">手持ち両目:</span>
          <span className="text-amber-400 font-bold">💰 {gold} 両</span>
        </div>
      </div>
    </div>
  );
};
