import type { Enemy, DungeonModifier, StoryScene, GameDifficulty } from '../types/game';

export const STORY_SCENES: StoryScene[] = [
  {
    id: 'intro',
    floorTrigger: 1,
    title: '序章: 黄泉津比良坂の黄昏',
    speaker: '社守の巫女・静音',
    text: [
      '……目を覚まされましたか、名無しの流浪人様。',
      'ここは常夜の穢れに沈みゆく日ノ本の果て、黄泉津坂でございます。',
      'この先に連なる禍々しき十の境界を祓い、元凶たる「夜叉王」の首を討ち取らねば、現世に朝が訪れることはありませぬ……。どうか刀を握り、闇を裂いてください。'
    ]
  },
  {
    id: 'floor5',
    floorTrigger: 5,
    title: '幕間: 逢魔の霧',
    speaker: '社守の巫女・静音',
    text: [
      'よくぞここまで辿り着かれました。しかし空気の匂いが変わってきております。',
      'この先、第十層には最初の結界を守護する大百足の化生が巣食っております。生半可な太刀筋では甲殻すら断てませぬ。装備を整えてお進みください。'
    ]
  },
  {
    id: 'floor10',
    floorTrigger: 10,
    title: '激突: 逢魔が辻の門番',
    speaker: '赤眼の百足大将',
    text: [
      'ギギ……人の身でここまで登ってきたか。',
      '我が千足の毒針と鉄兜の前に、貴様の骸を常夜の肥やしとしてくれるわ！'
    ]
  }
];

export const DIFFICULTY_PRESETS: Record<GameDifficulty, { atkMult: number; hpMult: number; lootBonus: number; label: string }> = {
  '幽世 (普通)': { atkMult: 1.0, hpMult: 1.0, lootBonus: 0, label: '適度な緊張感で物語を楽しむ' },
  '修羅 (高難度)': { atkMult: 1.5, hpMult: 1.6, lootBonus: 15, label: '敵の攻撃が激化、希少・名品ドロップ率UP' },
  '常夜 (狂乱)': { atkMult: 2.3, hpMult: 2.8, lootBonus: 35, label: '一撃死の恐怖。神話級装備の出現率最大' }
};

export const DUNGEON_MODIFIERS: DungeonModifier[] = [
  { name: '静寂の夜霧', desc: '通常の霧が漂う', enemyAtkMult: 1.0, enemyHpMult: 1.0, lootRarityBonus: 0 },
  { name: '血風の兆し', desc: '敵攻撃力+30% / 希少装備出現率上昇', enemyAtkMult: 1.3, enemyHpMult: 1.0, lootRarityBonus: 10 },
  { name: '鉄甲の呪詛', desc: '敵体力+40% / 獲得両目(金)+50%', enemyAtkMult: 1.0, enemyHpMult: 1.4, lootRarityBonus: 5 },
  { name: '逢魔時大侵魂', desc: '修羅の領域: 敵大幅強化 / 最高品質の武具', enemyAtkMult: 1.4, enemyHpMult: 1.4, lootRarityBonus: 20 }
];

export const generateEnemy = (floor: number, modifier: DungeonModifier, difficulty: GameDifficulty): Enemy => {
  const isBoss = floor % 10 === 0;
  const diff = DIFFICULTY_PRESETS[difficulty];

  const totalAtkMult = modifier.enemyAtkMult * diff.atkMult;
  const totalHpMult = modifier.enemyHpMult * diff.hpMult;

  if (isBoss) {
    const bossNames = [
      '百足大将・禍津日',
      '怨嗟の般若・鬼童丸',
      '羅刹の剣聖・不知火',
      '黄泉の九尾・玉藻',
      '深淵の夜叉王・マガツヒ'
    ];
    const bossIdx = Math.min(Math.floor(floor / 10) - 1, bossNames.length - 1);
    const maxHp = Math.round((180 + floor * 75) * totalHpMult);
    const atk = Math.round((18 + floor * 5.2) * totalAtkMult);
    const def = 6 + Math.floor(floor * 2.2);

    return {
      id: `boss_${floor}_${Date.now()}`,
      name: `👹 ${bossNames[bossIdx]}`,
      hp: maxHp,
      maxHp,
      atk,
      def,
      level: floor,
      isBoss: true,
      avatarType: 'boss_oni'
    };
  }

  const mobs = [
    { name: '野晒しの骸骨兵', avatar: 'skeleton' },
    { name: '血塗れの餓鬼', avatar: 'gaki' },
    { name: '逢魔の鴉天狗', avatar: 'tengu' },
    { name: '妖異・大蜘蛛', avatar: 'spider' },
    { name: '怨嗟の落ち武者', avatar: 'samurai' }
  ];
  const mob = mobs[Math.floor(Math.random() * mobs.length)];
  const maxHp = Math.round((35 + floor * 20) * totalHpMult);
  const atk = Math.round((8 + floor * 3.0) * totalAtkMult);
  const def = 2 + Math.floor(floor * 1.3);

  return {
    id: `enemy_${floor}_${Date.now()}`,
    name: `${mob.name} Lv.${floor}`,
    hp: maxHp,
    maxHp,
    atk,
    def,
    level: floor,
    isBoss: false,
    avatarType: mob.avatar
  };
};
