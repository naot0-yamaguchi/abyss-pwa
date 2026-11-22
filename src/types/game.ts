export type Rarity = '一般' | '上等' | '希少' | '名品' | '伝説' | '神話';

export type EquipSlot = 'head' | 'chest' | 'mainHand' | 'offHand' | 'legs' | 'ring';

export type GameDifficulty = '幽世 (普通)' | '修羅 (高難度)' | '常夜 (狂乱)';

export interface ItemAffix {
  name: string;
  type: 'atk' | 'def' | 'hp' | 'critRate' | 'critDmg' | 'lifeSteal';
  value: number;
  text: string;
}

export interface Item {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  icon: string;
  level: number;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  affixes: ItemAffix[];
  sellPrice: number;
  durability: number;
  maxDurability: number;
  upgradeLevel: number;
}

export interface EquipmentState {
  head: Item | null;
  chest: Item | null;
  mainHand: Item | null;
  offHand: Item | null;
  legs: Item | null;
  ring: Item | null;
}

export interface StoryScene {
  id: string;
  floorTrigger: number;
  title: string;
  speaker: string;
  text: string[];
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  level: number;
  isBoss: boolean;
  avatarType: string;
}

export interface Talisman {
  id: string;
  name: string;
  rarity: Rarity;
  skillName: string;
  skillDesc: string;
  atkBonus: number;
  critBonus: number;
  specialEffect?: 'boss_slayer' | 'berserker' | 'blood_harvest';
}

export interface Quest {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardGold: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  critRate: number;
  critDmg: number;
  lifeSteal: number;
  gold: number;
  floor: number;
  maxFloorReached: number;
  level: number;
  lastLoginDate?: string;
  loginStreak?: number;
  difficulty: GameDifficulty;
  equippedTalisman: Talisman | null;
}

export interface SaveData {
  stats: PlayerStats;
  equipment: EquipmentState;
  inventory: Item[];
  talismans: Talisman[];
  quests: Quest[];
  clearedStoryIds: string[];
  savedAt: string;
}

export interface DungeonModifier {
  name: string;
  desc: string;
  enemyAtkMult: number;
  enemyHpMult: number;
  lootRarityBonus: number;
}

export interface Title {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
  atkBuff: number;
  critBuff: number;
}
