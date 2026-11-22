import type { Quest, Title, Talisman, Rarity } from '../types/game';

export const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: '妖異を5体討伐せよ', targetCount: 5, currentCount: 0, rewardGold: 120, isCompleted: false, isClaimed: false },
  { id: 'q2', title: '深層の怨霊掃討 (15体討伐)', targetCount: 15, currentCount: 0, rewardGold: 400, isCompleted: false, isClaimed: false },
  { id: 'q3', title: '境界守護者を2体屠れ', targetCount: 2, currentCount: 0, rewardGold: 1000, isCompleted: false, isClaimed: false }
];

export const INITIAL_TITLES: Title[] = [
  { id: 't1', name: '流浪の剣客', desc: '初期称号。', unlocked: true, atkBuff: 0, critBuff: 0 },
  { id: 't2', name: '結界破り', desc: '第10階層の守護者を撃破 (+5 攻撃力)', unlocked: false, atkBuff: 5, critBuff: 0 },
  { id: 't3', name: '百妖斬り', desc: '妖異を累計50体討伐 (+4% 会心率)', unlocked: false, atkBuff: 0, critBuff: 0.04 },
  { id: 't4', name: '夜叉殺し', desc: '第30階層に到達 (+15 攻撃力, +6% 会心率)', unlocked: false, atkBuff: 15, critBuff: 0.06 }
];

// ガチャ用護石生成
export const generateGachaTalisman = (): Talisman => {
  const roll = Math.random() * 100;
  let rarity: Rarity = '希少';
  if (roll > 95) rarity = '神話';
  else if (roll > 80) rarity = '伝説';
  else if (roll > 50) rarity = '名品';

  const effects: Array<{ name: string; desc: string; special?: 'boss_slayer' | 'berserker' | 'blood_harvest' }> = [
    { name: '破魔の神核', desc: '境界守護者への与ダメージ +35%', special: 'boss_slayer' },
    { name: '血契の勾玉', desc: '会心攻撃時、与ダメージの50%を吸収回復', special: 'blood_harvest' },
    { name: '修羅の怨念', desc: '体力が40%以下のとき与ダメージ2倍', special: 'berserker' },
    { name: '月光の宝珠', desc: '全能力値及び会心率が向上' }
  ];

  const chosen = effects[Math.floor(Math.random() * effects.length)];
  const scale = rarity === '神話' ? 3.5 : rarity === '伝説' ? 2.5 : rarity === '名品' ? 1.8 : 1.2;

  return {
    id: `tal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `【${rarity}】${chosen.name}`,
    rarity,
    skillName: chosen.name,
    skillDesc: chosen.desc,
    atkBonus: Math.round(8 * scale),
    critBonus: Math.round(3 * scale) / 100,
    specialEffect: chosen.special
  };
};
