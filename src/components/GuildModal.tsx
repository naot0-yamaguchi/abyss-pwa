import React, { useState } from 'react';
import type { Quest, Title, Talisman, EquipmentState, EquipSlot } from '../types/game';
import { generateGachaTalisman } from '../data/guild';
import { RARITY_CONFIG } from '../data/items';

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
  const [tab, setTab] = useState<'guild' | 'forge' | 'talisman' | 'titles'>('guild');

  // 全装備の修理費用計算
  const brokenItems = Object.values(equipment).filter(i => i && i.durability < i.maxDurability);
  const totalRepairCost = brokenItems.reduce((acc, cur) => acc + (cur!.maxDurability - cur!.durability) * 2, 0);

  const handleGacha = () => {
    const cost = 250;
    if (gold < cost) return;
    const tal = generateGachaTalisman(); // 引数なしで呼ぶ
    onDrawTalisman(tal, cost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md h-[88vh] bg-stone-900 border border-stone-700 rounded-2xl flex flex-col justify-between shadow-2xl text-stone-200 overflow-hidden">
        {/* ヘッダー */}
        <div className="p-3 border-b border-stone-800 bg-stone-950/80 flex justify-between items-center">
          <div>
            <h3 className="font-serif font-black text-amber-400 tracking-wider text-sm">
              HAVEN GUILD & FORGE
            </h3>
            <p className="text-[10px] text-stone-400">Receptionist Elysia welcomes you.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-stone-400 text-lg">✕</button>
        </div>

        {/* タブナビゲーション */}
        <div className="grid grid-cols-4 border-b border-stone-800 text-xs font-mono bg-stone-950">
          <button
            onClick={() => setTab('guild')}
            className={`py-2 text-center border-b-2 ${tab === 'guild' ? 'border-amber-400 text-amber-300 font-bold' : 'border-transparent text-stone-400'}`}
          >
            Quests
          </button>
          <button
            onClick={() => setTab('forge')}
            className={`py-2 text-center border-b-2 ${tab === 'forge' ? 'border-amber-400 text-amber-300 font-bold' : 'border-transparent text-stone-400'}`}
          >
            Forge
          </button>
          <button
            onClick={() => setTab('talisman')}
            className={`py-2 text-center border-b-2 ${tab === 'talisman' ? 'border-amber-400 text-amber-300 font-bold' : 'border-transparent text-stone-400'}`}
          >
            Talismans
          </button>
          <button
            onClick={() => setTab('titles')}
            className={`py-2 text-center border-b-2 ${tab === 'titles' ? 'border-amber-400 text-amber-300 font-bold' : 'border-transparent text-stone-400'}`}
          >
            Titles
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
          {tab === 'guild' && (
            <div>
              {/* 受付嬢エリスのダイアログ */}
              <div className="flex items-start space-x-3 bg-stone-950/70 p-3 rounded-xl border border-stone-800 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-600 flex items-center justify-center text-xl shrink-0">
                  👩‍💼
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300 font-serif">Elysia (Guild Receptionist)</div>
                  <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">
                    "Welcome back, Delver. The Abyss grows more restless each day. Fulfill our bounties and I will ensure you are well rewarded."
                  </p>
                </div>
              </div>

              {/* クエスト一覧 */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Active Bounties</div>
                {quests.map(q => (
                  <div key={q.id} className="p-2.5 rounded-xl border border-stone-800 bg-stone-950/50 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-stone-200">{q.title}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        Progress: {q.currentCount}/{q.targetCount} • Reward: <span className="text-amber-400">{q.rewardGold} G</span>
                      </div>
                    </div>
                    {q.isClaimed ? (
                      <span className="text-[10px] text-stone-500 font-bold px-2 py-1 bg-stone-900 rounded">Claimed</span>
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
                        Claim
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'forge' && (
            <div className="space-y-3">
              {/* 全修理ボタン */}
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-200">Blacksmith Repair Service</div>
                  <div className="text-[10px] text-stone-400">Restore all equipped relics to 100% condition.</div>
                </div>
                <button
                  onClick={() => onRepairAll(totalRepairCost)}
                  disabled={totalRepairCost === 0 || gold < totalRepairCost}
                  className={`px-3 py-1.5 rounded font-bold text-xs ${
                    totalRepairCost > 0 && gold >= totalRepairCost
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Repair All ({totalRepairCost} G)
                </button>
              </div>

              {/* 装備強化セクション */}
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Enhance Equipment</div>
              <div className="space-y-2">
                {(Object.entries(equipment) as [EquipSlot, EquipmentState[EquipSlot]][]).map(([slot, item]) => {
                  if (!item) return null;
                  const upgradeCost = (item.upgradeLevel + 1) * 75;
                  return (
                    <div key={slot} className="p-2.5 rounded-xl border border-stone-800 bg-stone-950/50 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-stone-200">
                          {item.icon} {item.name} <span className="text-amber-400">+{item.upgradeLevel}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          Durability: {item.durability}/{item.maxDurability} • Next: +15% Stats
                        </div>
                      </div>
                      <button
                        onClick={() => onUpgradeItem(slot, upgradeCost)}
                        disabled={gold < upgradeCost}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          gold >= upgradeCost ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        Upgrade ({upgradeCost} G)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'talisman' && (
            <div className="space-y-3">
              {/* ガチャ召喚バナー */}
              <div className="p-3 bg-gradient-to-br from-purple-950/60 to-stone-950 border border-purple-800/60 rounded-xl text-center">
                <div className="font-serif font-black text-purple-300 text-sm mb-1">
                  ABYSSAL TALISMAN TRANSMUTATION
                </div>
                <p className="text-[10px] text-stone-400 mb-2">
                  Transmute dark essence into unique Talismans with game-changing passives.
                </p>
                <button
                  onClick={handleGacha}
                  disabled={gold < 250}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                    gold >= 250
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Summon Talisman (250 G)
                </button>
              </div>

              {/* 装着中の護石 */}
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Equipped Talisman</div>
              {equippedTalisman ? (
                <div className={`p-3 rounded-xl border bg-stone-950/80 ${RARITY_CONFIG[equippedTalisman.rarity].border}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${RARITY_CONFIG[equippedTalisman.rarity].color}`}>
                      🔮 {equippedTalisman.name}
                    </span>
                    <span className="text-[9px] font-bold text-purple-400">{equippedTalisman.rarity}</span>
                  </div>
                  <div className="text-[11px] text-stone-300 mb-1">{equippedTalisman.skillDesc}</div>
                  <div className="text-[10px] font-mono text-stone-400">
                    +{equippedTalisman.atkBonus} ATK • +{Math.round(equippedTalisman.critBonus * 100)}% CRIT
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-stone-800 text-center text-stone-500">
                  No Talisman equipped.
                </div>
              )}
            </div>
          )}

          {tab === 'titles' && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Earned Titles</div>
              {titles.map(t => {
                const isActive = activeTitleId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border flex justify-between items-center ${
                      t.unlocked
                        ? isActive
                          ? 'border-amber-500 bg-amber-950/30'
                          : 'border-stone-800 bg-stone-950/60'
                        : 'border-stone-900 bg-stone-950/30 opacity-40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-stone-200">
                        {t.name} {isActive && <span className="text-amber-400 text-[10px] font-mono">(Active)</span>}
                      </div>
                      <div className="text-[10px] text-stone-400">{t.desc}</div>
                    </div>
                    {t.unlocked && !isActive && (
                      <button
                        onClick={() => onSelectTitle(t.id)}
                        className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs font-mono">
          <span className="text-stone-400">Delver Treasury:</span>
          <span className="text-amber-400 font-bold">💰 {gold} G</span>
        </div>
      </div>
    </div>
  );
};
