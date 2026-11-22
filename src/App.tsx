import { useState, useEffect, useMemo } from "react";
import type {
  Item,
  Enemy,
  PlayerStats,
  EquipmentState,
  EquipSlot,
  SaveData,
  DungeonModifier,
  ItemAffix,
  Quest,
  StoryScene,
  GameDifficulty,
} from "./types/game";
import {
  generateProceduralItem,
  RARITY_CONFIG,
  SLOT_LABELS,
} from "./data/items";
import {
  generateEnemy,
  DUNGEON_MODIFIERS,
  STORY_SCENES,
  DIFFICULTY_PRESETS,
} from "./data/enemies";
import { INITIAL_QUESTS } from "./data/guild";
import { saveGameLocal, loadGameLocal, syncToSupabase } from "./utils/storage";
import { useAudio } from "./hooks/useAudio";
import { ThreeDungeonScene } from "./components/ThreeDungeonScene";
import { EquipmentSlots } from "./components/EquipmentSlots";
import { StoryModal } from "./components/StoryModal";
import { ShrineModal } from "./components/ShrineModal";
import { FloorSelectModal } from "./components/FloorSelectModal";
import { GuildModal } from "./components/GuildModal";
import { SyncDrawer } from "./components/SyncDrawer";

export function App() {
  const { playHitSound, playCritSound, playLootSound } = useAudio();

  const [player, setPlayer] = useState<PlayerStats>({
    hp: 120,
    maxHp: 120,
    atk: 14,
    def: 5,
    critRate: 0.05,
    critDmg: 1.5,
    lifeSteal: 0,
    gold: 100,
    floor: 1,
    maxFloorReached: 1,
    level: 1,
    difficulty: "幽世 (普通)",
    equippedTalisman: null,
  });

  const [equipment, setEquipment] = useState<EquipmentState>({
    head: null,
    chest: null,
    mainHand: null,
    offHand: null,
    legs: null,
    ring: null,
  });

  const [inventory, setInventory] = useState<Item[]>([]);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [clearedStories, setClearedStories] = useState<string[]>([]);
  const [activeStory, setActiveStory] = useState<StoryScene | null>(null);

  // 選択中インベントリアイテム（比較用）
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);

  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [isFighting, setIsFighting] = useState(false);

  // モーダル制御
  const [showShrine, setShowShrine] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showFloorSelect, setShowFloorSelect] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [lootReward, setLootReward] = useState<Item[] | null>(null);

  const [currentMod, setCurrentMod] = useState<DungeonModifier>(
    DUNGEON_MODIFIERS[0],
  );

  // 初期ロード & 序章ストーリー判定
  useEffect(() => {
    loadGameLocal().then((saved) => {
      if (saved) {
        setPlayer(saved.stats);
        setEquipment(saved.equipment);
        setInventory(saved.inventory || []);
        if (saved.quests) setQuests(saved.quests);
        if (saved.clearedStoryIds) setClearedStories(saved.clearedStoryIds);
      } else {
        const initBlade = generateProceduralItem(1, false, "mainHand");
        setEquipment((prev) => ({ ...prev, mainHand: initBlade }));
        // 序章再生
        const intro = STORY_SCENES.find((s) => s.id === "intro");
        if (intro) setActiveStory(intro);
      }
    });
  }, []);

  // 装備・ステータス導出（同期）
  const derivedStats = useMemo(() => {
    const level = Number(player.level) || 1;
    let atk = 14 + (level - 1) * 3;
    let def = 5 + (level - 1) * 2;
    let maxHp = 120 + (level - 1) * 25;
    let critRate = 0.05;
    let critDmg = 1.5;
    let lifeSteal = 0.0;

    Object.values(equipment || {}).forEach((item) => {
      if (!item) return;
      const durability = item.durability ?? 100;
      const brokenMult = durability <= 0 ? 0.5 : 1.0;
      const upgradeMult = 1 + (item.upgradeLevel || 0) * 0.15;

      atk += Math.round((Number(item.baseAtk) || 0) * brokenMult * upgradeMult);
      def += Math.round((Number(item.baseDef) || 0) * brokenMult * upgradeMult);
      maxHp += Math.round(
        (Number(item.baseHp) || 0) * brokenMult * upgradeMult,
      );

      (item.affixes || []).forEach((aff: ItemAffix) => {
        const val = Number(aff.value) || 0;
        if (aff.type === "atk") atk += val;
        if (aff.type === "def") def += val;
        if (aff.type === "hp") maxHp += val;
        if (aff.type === "critRate") critRate += val / 100;
        if (aff.type === "critDmg") critDmg += val / 100;
        if (aff.type === "lifeSteal") lifeSteal += val / 100;
      });
    });

    if (player.equippedTalisman) {
      atk += Number(player.equippedTalisman.atkBonus) || 0;
      critRate += Number(player.equippedTalisman.critBonus) || 0;
    }

    return {
      atk: Math.max(1, atk),
      def: Math.max(0, def),
      maxHp: Math.max(10, maxHp),
      critRate: Math.max(0, critRate),
      critDmg: Math.max(1.0, critDmg),
      lifeSteal: Math.max(0, lifeSteal),
    };
  }, [equipment, player.level, player.equippedTalisman]);

  const effectivePlayer: PlayerStats = useMemo(() => {
    const rawHp = Number(player.hp);
    const validHp = isNaN(rawHp) || rawHp <= 0 ? derivedStats.maxHp : rawHp;
    return {
      ...player,
      ...derivedStats,
      hp: Math.min(validHp, derivedStats.maxHp),
    };
  }, [player, derivedStats]);

  // オートセーブ
  useEffect(() => {
    const timeout = setTimeout(() => {
      const saveData: SaveData = {
        stats: effectivePlayer,
        equipment,
        inventory,
        talismans: [],
        quests,
        clearedStoryIds: clearedStories,
        savedAt: new Date().toISOString(),
      };
      saveGameLocal(saveData);
      const storedUserId =
        localStorage.getItem("abyss_user_id") || "default_user";
      syncToSupabase(storedUserId, saveData);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [effectivePlayer, equipment, inventory, quests, clearedStories]);

  // 戦闘開始
  const handleStartCombat = (overrideFloor?: number) => {
    if (isFighting) return;
    const targetFloor = overrideFloor || player.floor;

    // 5階層ごとに環境特性をランダム切り替え（ボス階層以外）
    if (targetFloor % 5 === 1 && targetFloor % 10 !== 0) {
      setCurrentMod(
        DUNGEON_MODIFIERS[Math.floor(Math.random() * DUNGEON_MODIFIERS.length)],
      );
    }

    // ストーリートリガー判定
    const nextStory = STORY_SCENES.find(
      (s) => s.floorTrigger === targetFloor && !clearedStories.includes(s.id),
    );
    if (nextStory) {
      setActiveStory(nextStory);
      setClearedStories((prev) => [...prev, nextStory.id]);
    }

    setEnemy(generateEnemy(targetFloor, currentMod, player.difficulty));
    setIsFighting(true);
  };

  // オート戦闘ループ
  useEffect(() => {
    if (!isFighting || !enemy) return;

    const timer = setInterval(() => {
      // プレイヤーの攻撃
      const isCrit = Math.random() < effectivePlayer.critRate;
      const rawDmg = isCrit
        ? effectivePlayer.atk * effectivePlayer.critDmg
        : effectivePlayer.atk;
      const dealt = Math.max(1, Math.round(rawDmg - enemy.def));
      const nextEnemyHp = Math.max(0, enemy.hp - dealt);

      if (isCrit) playCritSound();
      else playHitSound();

      if (effectivePlayer.lifeSteal > 0) {
        const heal = Math.round(dealt * effectivePlayer.lifeSteal);
        setPlayer((p) => ({
          ...p,
          hp: Math.min(effectivePlayer.maxHp, p.hp + heal),
        }));
      }

      // 耐久度消費
      setEquipment((prev) => {
        const updated = { ...prev };
        (Object.keys(updated) as EquipSlot[]).forEach((slot) => {
          if (updated[slot] && Math.random() < 0.2) {
            updated[slot] = {
              ...updated[slot]!,
              durability: Math.max(0, updated[slot]!.durability - 1),
            };
          }
        });
        return updated;
      });

      // 敵討伐
      if (nextEnemyHp <= 0) {
        clearInterval(timer);
        setIsFighting(false);
        setEnemy(null);
        playLootSound();

        const diffBonus = DIFFICULTY_PRESETS[player.difficulty].lootBonus;
        const rewards = [
          generateProceduralItem(
            effectivePlayer.floor,
            enemy.isBoss,
            undefined,
            diffBonus,
          ),
          generateProceduralItem(
            effectivePlayer.floor,
            enemy.isBoss,
            undefined,
            diffBonus,
          ),
          generateProceduralItem(
            effectivePlayer.floor,
            enemy.isBoss,
            undefined,
            diffBonus,
          ),
        ];
        setLootReward(rewards);

        const nextFloor = effectivePlayer.floor + 1;
        setPlayer((p) => ({
          ...p,
          floor: nextFloor,
          maxFloorReached: Math.max(p.maxFloorReached, nextFloor),
          gold: p.gold + (enemy.isBoss ? 200 : 35) + nextFloor * 3,
          hp: effectivePlayer.maxHp,
        }));
        return;
      }

      // 敵の反撃
      const enemyDmg = Math.max(1, enemy.atk - effectivePlayer.def);
      setPlayer((p) => {
        const nextHp = Math.max(0, p.hp - enemyDmg);
        if (nextHp <= 0) {
          clearInterval(timer);
          setIsFighting(false);
          setEnemy(null);
          return {
            ...p,
            floor: Math.max(1, p.floor - 1),
            hp: effectivePlayer.maxHp,
          };
        }
        return { ...p, hp: nextHp };
      });

      setEnemy((e) => (e ? { ...e, hp: nextEnemyHp } : null));
    }, 650);

    return () => clearInterval(timer);
  }, [
    isFighting,
    enemy,
    effectivePlayer,
    player.difficulty,
    playCritSound,
    playHitSound,
    playLootSound,
  ]);

  // 売却処理（神話級装備は確認ダイアログ）
  const handleSellItem = (item: Item) => {
    if (item.rarity === "神話") {
      const ok = window.confirm(
        `【警告】最高レアリティ武具『${item.name}』を本当に売却しますか？`,
      );
      if (!ok) return;
    }
    setPlayer((p) => ({ ...p, gold: p.gold + item.sellPrice }));
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    if (selectedInventoryItem?.id === item.id) setSelectedInventoryItem(null);
  };

  // レアリティ連動の修理コスト計算
  const totalRepairCost = useMemo(() => {
    let cost = 0;
    Object.values(equipment || {}).forEach((item) => {
      if (item && item.durability < item.maxDurability) {
        const loss = item.maxDurability - item.durability;
        // ↓ ここを型安全に修正
        const rKey = (item.rarity || '一般') as keyof typeof RARITY_CONFIG;
        const cfg = RARITY_CONFIG[rKey] || RARITY_CONFIG['一般'];
        const rate = cfg.repairMult;
        cost += loss * rate * 3;
      }
    });
    return cost;
  }, [equipment]);

  const handleRepairAll = () => {
    if (player.gold < totalRepairCost) return;
    setPlayer((p) => ({ ...p, gold: p.gold - totalRepairCost }));
    setEquipment((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as EquipSlot[]).forEach((slot) => {
        if (updated[slot]) {
          updated[slot] = {
            ...updated[slot]!,
            durability: updated[slot]!.maxDurability,
          };
        }
      });
      return updated;
    });
  };

  // ログインボーナス判定（同日チェック）
  const todayStr = new Date().toISOString().split("T")[0];
  const canClaimShrine = player.lastLoginDate !== todayStr;

  return (
    <div className="w-full min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-between p-3 select-none font-serif">
      <div className="w-full max-w-md flex flex-col h-full flex-1">
        {/* 和風ヘッダー */}
        <header className="flex justify-between items-center py-2 px-1 mb-2 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-widest text-stone-100 text-sm">
              常夜ノ淵
            </span>
            <span className="text-[10px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-amber-300 font-mono">
              💰 {player.gold} 両
            </span>
          </div>

          <div className="flex space-x-1.5 font-sans">
            <button
              onClick={() => setShowShrine(true)}
              className="text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 rounded text-stone-300 relative"
            >
              ⛩️ 参拝
              {canClaimShrine && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={() => setShowGuild(true)}
              className="text-[10px] bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 px-2 py-1 rounded text-amber-300 font-bold"
            >
              鍛冶・依頼
            </button>
            <button
              onClick={() => setShowFloorSelect(true)}
              className="text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 rounded text-stone-300 font-mono"
            >
              階層選択
            </button>
            <button
              onClick={() => setShowSync(true)}
              className="text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 rounded text-stone-400"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* 難易度セレクターバー */}
        <div className="flex justify-between items-center px-1 mb-2 text-[10px] font-sans">
          <span className="text-stone-500">難易度設定:</span>
          <div className="flex space-x-1">
            {(
              [
                "幽世 (普通)",
                "修羅 (高難度)",
                "常夜 (狂乱)",
              ] as GameDifficulty[]
            ).map((d) => (
              <button
                key={d}
                onClick={() => setPlayer((p) => ({ ...p, difficulty: d }))}
                className={`px-2 py-0.5 rounded border transition-all ${
                  player.difficulty === d
                    ? "border-amber-500 bg-amber-950/50 text-amber-300 font-bold"
                    : "border-stone-800 bg-stone-900 text-stone-500"
                }`}
              >
                {d.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 3D 荒野シネマティック戦闘ビュー */}
        <div className="w-full relative rounded-2xl overflow-hidden border border-stone-800 mb-3 shadow-2xl">
          <ThreeDungeonScene
            floor={player.floor}
            isFighting={isFighting}
            enemy={enemy}
            equipment={equipment}
          />

          {player.floor % 10 === 0 && (
            <div className="absolute top-0 inset-x-0 bg-rose-950/90 border-b border-rose-600 text-rose-300 text-[10px] font-bold text-center py-1 tracking-widest uppercase animate-pulse">
              ⚠️ 逢魔の結界：境界守護者を討ち滅ぼせ ⚠️
            </div>
          )}

          {/* HUD オーバーレイ */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-end z-10 font-mono">
            <div className="w-5/12 bg-stone-950/85 p-2 rounded-lg border border-stone-800">
              <div className="flex justify-between text-[10px] text-stone-300 font-bold mb-1">
                <span>流浪人</span>
                <span>
                  {effectivePlayer.hp}/{effectivePlayer.maxHp}
                </span>
              </div>
              <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-200"
                  style={{
                    width: `${Math.max(0, (effectivePlayer.hp / effectivePlayer.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="text-center pb-1">
              <span className="text-[11px] font-bold text-stone-200 block font-serif">
                第 {player.floor} 階層
              </span>
              <span className="text-[8px] text-stone-400">
                {currentMod.name}
              </span>
            </div>

            <div className="w-5/12 bg-stone-950/85 p-2 rounded-lg border border-stone-800">
              <div className="flex justify-between text-[10px] text-rose-300 font-bold mb-1">
                <span className="truncate">
                  {enemy ? enemy.name : "気配なし"}
                </span>
                <span>{enemy ? `${enemy.hp}/${enemy.maxHp}` : "-"}</span>
              </div>
              <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-200"
                  style={{
                    width: `${enemy ? Math.max(0, (enemy.hp / enemy.maxHp) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ステータスバッジ */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 text-center text-xs font-mono">
          <div className="bg-stone-950/80 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">攻撃力</span>
            <span className="text-stone-200 font-bold">
              {effectivePlayer.atk}
            </span>
          </div>
          <div className="bg-stone-950/80 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">防御力</span>
            <span className="text-stone-200 font-bold">
              {effectivePlayer.def}
            </span>
          </div>
          <div className="bg-stone-950/80 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">会心率</span>
            <span className="text-amber-400 font-bold">
              {Math.round(effectivePlayer.critRate * 100)}%
            </span>
          </div>
          <div className="bg-stone-950/80 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">与ダメ吸血</span>
            <span className="text-rose-400 font-bold">
              {Math.round(effectivePlayer.lifeSteal * 100)}%
            </span>
          </div>
        </div>

        {/* 装備部位スロット */}
        <div className="mb-2">
          <div className="text-[10px] font-mono text-stone-500 mb-1 px-1">
            身に纏いし武具
          </div>
          <EquipmentSlots
            equipment={equipment}
            onSlotClick={(slot) => setSelectedSlot(slot)}
            selectedSlot={selectedSlot}
          />
        </div>

        {/* インベントリ武具の比較 (Diff) 表示パネル */}
        {selectedInventoryItem && (
          <div className="bg-stone-950 border border-amber-600/70 rounded-xl p-3 mb-2 text-xs">
            {(() => {
              const current = equipment[selectedInventoryItem.slot];
              const atkDiff =
                selectedInventoryItem.baseAtk - (current?.baseAtk || 0);
              const defDiff =
                selectedInventoryItem.baseDef - (current?.baseDef || 0);
              const hpDiff =
                selectedInventoryItem.baseHp - (current?.baseHp || 0);
              const rarityConfig =
                RARITY_CONFIG[
                  selectedInventoryItem.rarity as keyof typeof RARITY_CONFIG
                ] || RARITY_CONFIG["一般"];

              return (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold ${rarityConfig.color}`}>
                      {selectedInventoryItem.name} (
                      {selectedInventoryItem.rarity})
                    </span>
                    <button
                      onClick={() => handleSellItem(selectedInventoryItem)}
                      className="text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 px-2 py-0.5 rounded"
                    >
                      売却 ({selectedInventoryItem.sellPrice} 両)
                    </button>
                  </div>

                  {/* 差分比較 */}
                  <div className="grid grid-cols-3 gap-1 bg-stone-900/60 p-2 rounded text-[10px] font-mono text-center mb-2">
                    <div>
                      <span className="text-stone-500 block">攻撃比較</span>
                      <span
                        className={
                          atkDiff > 0
                            ? "text-emerald-400"
                            : atkDiff < 0
                              ? "text-rose-400"
                              : "text-stone-400"
                        }
                      >
                        {atkDiff > 0
                          ? `+${atkDiff} ▲`
                          : atkDiff < 0
                            ? `${atkDiff} ▼`
                            : "±0"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">防御比較</span>
                      <span
                        className={
                          defDiff > 0
                            ? "text-emerald-400"
                            : defDiff < 0
                              ? "text-rose-400"
                              : "text-stone-400"
                        }
                      >
                        {defDiff > 0
                          ? `+${defDiff} ▲`
                          : defDiff < 0
                            ? `${defDiff} ▼`
                            : "±0"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">体力比較</span>
                      <span
                        className={
                          hpDiff > 0
                            ? "text-emerald-400"
                            : hpDiff < 0
                              ? "text-rose-400"
                              : "text-stone-400"
                        }
                      >
                        {hpDiff > 0
                          ? `+${hpDiff} ▲`
                          : hpDiff < 0
                            ? `${hpDiff} ▼`
                            : "±0"}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const target = selectedInventoryItem;
                        const cur = equipment[target.slot];
                        setEquipment((prev) => ({
                          ...prev,
                          [target.slot]: target,
                        }));
                        setInventory((prev) => {
                          const f = prev.filter((i) => i.id !== target.id);
                          return cur ? [...f, cur] : f;
                        });
                        setSelectedInventoryItem(null);
                      }}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded"
                    >
                      この武具を身に纏う
                    </button>
                    <button
                      onClick={() => setSelectedInventoryItem(null)}
                      className="px-3 py-1.5 bg-stone-800 text-stone-400 rounded"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 荷物袋（インベントリ） */}
        {inventory.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-mono text-stone-500 mb-1 px-1 flex justify-between">
              <span>荷物袋 ({inventory.length}/24)</span>
              <span>選択して性能比較</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto p-1 bg-stone-950/60 rounded-xl border border-stone-800">
              {inventory.map((item) => {
                const cfg =
                  RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG] ||
                  RARITY_CONFIG["一般"];
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedInventoryItem(item)}
                    className={`p-1.5 rounded border text-center transition-all ${cfg.border} ${cfg.bg} ${
                      selectedInventoryItem?.id === item.id
                        ? "ring-2 ring-amber-400"
                        : ""
                    }`}
                  >
                    <div className="text-base">{item.icon}</div>
                    <div
                      className={`text-[8px] font-bold truncate ${cfg.color}`}
                    >
                      {item.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 画面下部アクションバー */}
      <div className="w-full max-w-md pt-2 border-t border-stone-900">
        <button
          onClick={() => handleStartCombat()}
          disabled={isFighting}
          className={`w-full py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all shadow-xl text-sm ${
            isFighting
              ? "bg-rose-950/80 border border-rose-800 text-rose-300 animate-pulse"
              : "bg-stone-100 hover:bg-white text-stone-950 active:scale-98"
          }`}
        >
          {isFighting
            ? "⚔️ 刃を交え戦闘中……"
            : `⚔️ 第 ${player.floor} 階層へ踏み込む`}
        </button>
      </div>

      {/* 戦利品獲得モーダル */}
      {lootReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-4 shadow-2xl font-serif">
            <h3 className="text-center font-black text-amber-400 text-sm tracking-widest mb-1">
              ─ 討ち取った戦利品 ─
            </h3>
            <p className="text-center text-stone-400 text-xs mb-3">
              一品を選び持ち帰る
            </p>

            <div className="space-y-2 mb-3">
              {lootReward.map((item) => {
                const cfg =
                  RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG] ||
                  RARITY_CONFIG["一般"];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!equipment[item.slot]) {
                        setEquipment((prev) => ({
                          ...prev,
                          [item.slot]: item,
                        }));
                      } else {
                        setInventory((prev) => [item, ...prev]);
                      }
                      setLootReward(null);
                    }}
                    className={`p-2.5 rounded-xl border bg-stone-950 cursor-pointer hover:scale-[1.01] transition-all ${cfg.border}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs">
                        {item.icon} {item.name}
                      </span>
                      <span className={`text-[9px] font-bold ${cfg.color}`}>
                        [{SLOT_LABELS[item.slot].label}] {item.rarity}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 space-x-2 font-mono">
                      {item.baseAtk > 0 && <span>攻撃 +{item.baseAtk}</span>}
                      {item.baseDef > 0 && <span>防御 +{item.baseDef}</span>}
                      {item.baseHp > 0 && <span>体力 +{item.baseHp}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setPlayer((p) => ({ ...p, gold: p.gold + 50 }));
                setLootReward(null);
              }}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold"
            >
              すべて打ち捨て換金する (+50 両)
            </button>
          </div>
        </div>
      )}

      {/* ストーリー幕間モーダル */}
      {activeStory && (
        <StoryModal
          scene={activeStory}
          onComplete={() => setActiveStory(null)}
        />
      )}

      {/* 神社・参拝モーダル */}
      {showShrine && (
        <ShrineModal
          canClaim={canClaimShrine}
          onClaimReward={(gold) => {
            setPlayer((p) => ({
              ...p,
              gold: p.gold + gold,
              lastLoginDate: todayStr,
            }));
          }}
          onClose={() => setShowShrine(false)}
        />
      )}

      {/* 鍛冶屋・宿場モーダル */}
      {showGuild && (
        <GuildModal
          gold={player.gold}
          quests={quests}
          titles={[]}
          activeTitleId={null}
          equipment={equipment}
          equippedTalisman={player.equippedTalisman}
          onClaimQuest={(id) => {
            const q = quests.find((item) => item.id === id);
            if (!q || !q.isCompleted || q.isClaimed) return;
            setPlayer((p) => ({ ...p, gold: p.gold + q.rewardGold }));
            setQuests((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, isClaimed: true } : item,
              ),
            );
          }}
          onSelectTitle={() => {}}
          onRepairAll={handleRepairAll}
          onUpgradeItem={(slot, cost) => {
            if (player.gold < cost || !equipment[slot]) return;
            setPlayer((p) => ({ ...p, gold: p.gold - cost }));
            setEquipment((prev) => ({
              ...prev,
              [slot]: {
                ...prev[slot]!,
                upgradeLevel: prev[slot]!.upgradeLevel + 1,
              },
            }));
          }}
          onDrawTalisman={(tal, cost) => {
            setPlayer((p) => ({
              ...p,
              gold: p.gold - cost,
              equippedTalisman: tal,
            }));
          }}
          onEquipTalisman={(tal) =>
            setPlayer((p) => ({ ...p, equippedTalisman: tal }))
          }
          onClose={() => setShowGuild(false)}
        />
      )}

      {/* 階層移動 */}
      {showFloorSelect && (
        <FloorSelectModal
          currentFloor={player.floor}
          maxFloorReached={player.maxFloorReached}
          onSelectFloor={(floor) => {
            setPlayer((p) => ({ ...p, floor }));
            setShowFloorSelect(false);
          }}
          onChallengeBossSkip={(bossFloor) => {
            setShowFloorSelect(false);
            setPlayer((p) => ({ ...p, floor: bossFloor }));
            handleStartCombat(bossFloor);
          }}
          onClose={() => setShowFloorSelect(false)}
        />
      )}

      {/* クラウドセーブ */}
      {showSync && (
        <SyncDrawer
          currentData={{
            stats: effectivePlayer,
            equipment,
            inventory,
            talismans: [],
            quests,
            clearedStoryIds: clearedStories,
            savedAt: new Date().toISOString(),
          }}
          onDataLoaded={(data) => {
            setPlayer(data.stats);
            setEquipment(data.equipment);
            setInventory(data.inventory);
            if (data.clearedStoryIds) setClearedStories(data.clearedStoryIds);
            setShowSync(false);
          }}
          onResetData={() => {
            const initBlade = generateProceduralItem(1, false, "mainHand");
            setPlayer({
              hp: 120,
              maxHp: 120,
              atk: 14,
              def: 5,
              critRate: 0.05,
              critDmg: 1.5,
              lifeSteal: 0,
              gold: 100,
              floor: 1,
              maxFloorReached: 1,
              level: 1,
              difficulty: "幽世 (普通)",
              equippedTalisman: null,
            });
            setEquipment({
              head: null,
              chest: null,
              mainHand: initBlade,
              offHand: null,
              legs: null,
              ring: null,
            });
            setInventory([]);
            setClearedStories([]);
            setShowSync(false);
          }}
          onClose={() => setShowSync(false)}
        />
      )}
    </div>
  );
}

export default App;
