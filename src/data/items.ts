import type { Item, Rarity, EquipSlot, ItemAffix } from '../types/game';

export const RARITY_CONFIG: Record<Rarity, { color: string; border: string; bg: string; mult: number; repairMult: number; affixesCount: number }> = {
  '一般': { color: 'text-stone-400', border: 'border-stone-700', bg: 'bg-stone-900', mult: 1.0, repairMult: 1, affixesCount: 0 },
  '上等': { color: 'text-emerald-400', border: 'border-emerald-700', bg: 'bg-emerald-950/40', mult: 1.3, repairMult: 2, affixesCount: 1 },
  '希少': { color: 'text-cyan-400', border: 'border-cyan-600', bg: 'bg-cyan-950/40', mult: 1.7, repairMult: 4, affixesCount: 2 },
  '名品': { color: 'text-purple-400', border: 'border-purple-600', bg: 'bg-purple-950/40', mult: 2.2, repairMult: 8, affixesCount: 3 },
  '伝説': { color: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-950/40', mult: 3.0, repairMult: 15, affixesCount: 4 },
  '神話': { color: 'text-rose-400', border: 'border-rose-500 ring-1 ring-rose-400', bg: 'bg-rose-950/50', mult: 4.2, repairMult: 30, affixesCount: 5 }
};

export const SLOT_LABELS: Record<EquipSlot, { label: string; icon: string }> = {
  head: { label: '頭防具', icon: '👒' },
  chest: { label: '胴大鎧', icon: '🥋' },
  mainHand: { label: '主太刀', icon: '⚔️' },
  offHand: { label: '脇差/陣盾', icon: '🗡️' },
  legs: { label: '脚部具足', icon: '🥾' },
  ring: { label: '護り勾玉', icon: '📿' }
};

// 階層別ドロップ率
export const getDropRateForFloor = (floor: number, isBoss: boolean = false, diffBonus: number = 0): Record<Rarity, number> => {
  if (isBoss) {
    return {
      '一般': 0,
      '上等': 0,
      '希少': Math.max(0, 30 - diffBonus),
      '名品': 40,
      '伝説': 25 + Math.floor(diffBonus / 2),
      '神話': 5 + Math.floor(diffBonus / 2)
    };
  }
  if (floor <= 10) return { '一般': 60, '上等': 28, '希少': 10, '名品': 2, '伝説': 0, '神話': 0 };
  if (floor <= 30) return { '一般': 30, '上等': 35, '希少': 22, '名品': 10, '伝説': 3, '神話': 0 };
  if (floor <= 60) return { '一般': 10, '上等': 25, '希少': 35, '名品': 20, '伝説': 8, '神話': 2 };
  return { '一般': 5, '上等': 15, '希少': 30, '名品': 25, '伝説': 18, '神話': 7 };
};

const BASE_WEAPONS: Record<EquipSlot, { names: string[]; icons: string[]; base: { atk: number; def: number; hp: number } }> = {
  head: {
    names: ['編笠', '鬼面兜', '南蛮烏帽子', '鉄地黒漆笠', '夜叉の鉢金', '般若の仮面'],
    icons: ['👒', '👹', '👺', '🪖'],
    base: { atk: 1, def: 5, hp: 25 }
  },
  chest: {
    names: ['大鎧', '黒漆塗南蛮胴', '鎖帷子', '陣羽織', '修羅の戦装束', '怨嗟の羽織'],
    icons: ['🥋', '🦺', '🥼', '👘'],
    base: { atk: 0, def: 14, hp: 60 }
  },
  mainHand: {
    names: ['打刀・村正', '大太刀・破邪', '名刀・備前長船', '妖刀・紅蓮', '薙刀・無情', '鬼切丸'],
    icons: ['⚔️', '🗡️', '🪓', '🔱'],
    base: { atk: 18, def: 0, hp: 0 }
  },
  offHand: {
    names: ['名脇差', '鉄扇', '破魔の木盾', '退魔の数珠', '怨霊の鞘', '式神の呪符'],
    icons: ['🗡️', '🛡️', '🪭', '📜'],
    base: { atk: 5, def: 9, hp: 30 }
  },
  legs: {
    names: ['脛当', '脚絆', '金剛具足', '漆塗具足', '影走りの足袋', '修羅の佩楯'],
    icons: ['🥾', '👟', '🩳', '👖'],
    base: { atk: 0, def: 8, hp: 35 }
  },
  ring: {
    names: ['八咫の勾玉', '黄泉の珠数', '血濡れの指輪', '清めの念珠', '蛇骨の腕輪', '宿怨の封珠'],
    icons: ['📿', '💍', '🧿', '💎'],
    base: { atk: 8, def: 4, hp: 20 }
  }
};

const PREFIXES = [
  '血塗れの', '宿怨の', '神鳴の', '宵闇の', '夜叉の', '怨嗟渦巻く', '不動の',
  '影縫いの', '修羅の', '滅殺の', '薄氷の', '黄泉還りの', '古の', '業火の'
];

const SUFFIXES = [
  '・不知火', '・絶命', '・千代金丸', '・狂乱', '・破軍', '・乱れ雪月花',
  '・刹那', '・魂喰らい', '・羅刹', '・常夜', '・風雅', '・逢魔時'
];

const AFFIX_POOL = [
  { name: '剛力', type: 'atk', min: 4, max: 14, label: '攻撃力' },
  { name: '鉄壁', type: 'def', min: 3, max: 10, label: '防御力' },
  { name: '生命', type: 'hp', min: 20, max: 80, label: '最大体力' },
  { name: '会心', type: 'critRate', min: 3, max: 8, label: '会心率(%)' },
  { name: '会心威力', type: 'critDmg', min: 15, max: 40, label: '会心倍率(%)' },
  { name: '吸血', type: 'lifeSteal', min: 2, max: 6, label: '与ダメ吸収(%)' }
] as const;

export const generateProceduralItem = (floor: number, isBoss: boolean = false, targetSlot?: EquipSlot, diffBonus: number = 0): Item => {
  const rates = getDropRateForFloor(floor, isBoss, diffBonus);
  const roll = Math.random() * 100;
  let cum = 0;
  let selectedRarity: Rarity = '一般';
  for (const [r, rate] of Object.entries(rates) as [Rarity, number][]) {
    cum += rate;
    if (roll <= cum) {
      selectedRarity = r;
      break;
    }
  }

  const slots: EquipSlot[] = ['head', 'chest', 'mainHand', 'offHand', 'legs', 'ring'];
  const slot = targetSlot || slots[Math.floor(Math.random() * slots.length)];
  const template = BASE_WEAPONS[slot];
  const baseName = template.names[Math.floor(Math.random() * template.names.length)];
  const icon = template.icons[Math.floor(Math.random() * template.icons.length)];

  const prefix = Math.random() > 0.35 ? PREFIXES[Math.floor(Math.random() * PREFIXES.length)] : '';
  const suffix = Math.random() > 0.45 ? SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)] : '';
  const fullName = `${prefix}${baseName}${suffix}`;

  const cfg = RARITY_CONFIG[selectedRarity];
  const scale = (1 + floor * 0.14) * cfg.mult;

  const affixes: ItemAffix[] = [];
  const chosenIndices = new Set<number>();
  while (chosenIndices.size < Math.min(cfg.affixesCount, AFFIX_POOL.length)) {
    const idx = Math.floor(Math.random() * AFFIX_POOL.length);
    if (!chosenIndices.has(idx)) {
      chosenIndices.add(idx);
      const affDef = AFFIX_POOL[idx];
      const val = Math.round((affDef.min + Math.random() * (affDef.max - affDef.min)) * (1 + floor * 0.08));
      affixes.push({
        name: affDef.name,
        type: affDef.type as ItemAffix['type'],
        value: val,
        text: `+${val} ${affDef.label}`
      });
    }
  }

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: fullName,
    slot,
    rarity: selectedRarity,
    icon,
    level: floor,
    baseAtk: template.base.atk > 0 ? Math.round(template.base.atk * scale) : 0,
    baseDef: template.base.def > 0 ? Math.round(template.base.def * scale) : 0,
    baseHp: template.base.hp > 0 ? Math.round(template.base.hp * scale) : 0,
    affixes,
    sellPrice: Math.round((floor * 6 + 15) * cfg.mult),
    durability: 100,
    maxDurability: 100,
    upgradeLevel: 0
  };
};
