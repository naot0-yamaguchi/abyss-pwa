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
  compareItemStrength,
  rollLootDropCount,
} from "./data/items";
import {
  generateEnemy,
  DUNGEON_MODIFIERS,
  STORY_SCENES,
  DIFFICULTY_PRESETS,
} from "./data/enemies";
import { INITIAL_QUESTS, INITIAL_TITLES } from "./data/guild";
import { saveGameLocal, loadGameLocal, syncToSupabase } from "./utils/storage";
import { useAudio } from "./hooks/useAudio";
import { BattleStage } from "./components/BattleStage";
import { EquipmentSlots } from "./components/EquipmentSlots";
import { JapaneseEquipIcon } from "./components/JapaneseEquipIcon";
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
    critRate: 0.08,
    critDmg: 1.6,
    lifeSteal: 0.04,
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

  // 戦闘・演出ステート
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [isFighting, setIsFighting] = useState(false);
  const [isMarching, setIsMarching] = useState(false);
  const [specialGauge, setSpecialGauge] = useState(0);

  // エフェクトトリガー
  const [bloodEffect, setBloodEffect] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);
  const [critFlash, setCritFlash] = useState(false);
  const [leechSoul, setLeechSoul] = useState(false);

  // モーダル
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);
  const [lootReward, setLootReward] = useState<Item[] | null>(null);
  const [showShrine, setShowShrine] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showFloorSelect, setShowFloorSelect] = useState(false);
  const [showSync, setShowSync] = useState(false);

  const [currentMod, setCurrentMod] = useState<DungeonModifier>(
    DUNGEON_MODIFIERS[0],
  );

  // 初期ロード
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
        const intro = STORY_SCENES.find((s) => s.id === "intro");
        if (intro) setActiveStory(intro);
      }
    });
  }, []);

  // ステータス合算
  const derivedStats = useMemo(() => {
    const level = Number(player.level) || 1;
    let atk = 14 + (level - 1) * 3;
    let def = 5 + (level - 1) * 2;
    let maxHp = 120 + (level - 1) * 25;
    let critRate = 0.08;
    let critDmg = 1.6;
    let lifeSteal = 0.04;

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

  // 進軍（ざっ、ざっ…）演出から戦闘突入
  const handleStartCombat = (overrideFloor?: number) => {
    if (isFighting || isMarching) return;
    const targetFloor = overrideFloor || player.floor;

    setIsMarching(true);
    setTimeout(() => {
      setIsMarching(false);

      if (targetFloor % 5 === 1 && targetFloor % 10 !== 0) {
        setCurrentMod(
          DUNGEON_MODIFIERS[
            Math.floor(Math.random() * DUNGEON_MODIFIERS.length)
          ],
        );
      }

      const nextStory = STORY_SCENES.find(
        (s) => s.floorTrigger === targetFloor && !clearedStories.includes(s.id),
      );
      if (nextStory) {
        setActiveStory(nextStory);
        setClearedStories((prev) => [...prev, nextStory.id]);
      }

      setEnemy(generateEnemy(targetFloor, currentMod, player.difficulty));
      setIsFighting(true);
    }, 700);
  };

  // 必殺技（気合奥義）
  const handleUseSpecial = () => {
    if (!isFighting || !enemy || specialGauge < 100) return;
    setSpecialGauge(0);
    setCritFlash(true);
    setTimeout(() => setCritFlash(false), 200);
    playCritSound();

    const specialDmg = Math.round(effectivePlayer.atk * 3.2);
    const nextEnemyHp = Math.max(0, enemy.hp - specialDmg);

    setBloodEffect({ x: 60, y: 35, id: Date.now() });
    setTimeout(() => setBloodEffect(null), 400);

    setEnemy((e) => (e ? { ...e, hp: nextEnemyHp } : null));
  };

  // オート戦闘ループ
  useEffect(() => {
    if (!isFighting || !enemy) return;

    const timer = setInterval(() => {
      // プレイヤーの攻撃判定
      const isCrit = Math.random() < effectivePlayer.critRate;
      const rawDmg = isCrit
        ? effectivePlayer.atk * effectivePlayer.critDmg
        : effectivePlayer.atk;
      const dealt = Math.max(1, Math.round(rawDmg - enemy.def));
      const nextEnemyHp = Math.max(0, enemy.hp - dealt);

      // 気合ゲージ蓄積
      setSpecialGauge((prev) => Math.min(100, prev + 15));

      // 会心演出
      if (isCrit) {
        setCritFlash(true);
        setTimeout(() => setCritFlash(false), 160);
        playCritSound();
      } else {
        playHitSound();
      }

      // 出血エフェクト（敵側）
      setBloodEffect({
        x: 60 + (Math.random() - 0.5) * 10,
        y: 30 + (Math.random() - 0.5) * 10,
        id: Date.now(),
      });
      setTimeout(() => setBloodEffect(null), 300);

      // 吸血エフェクト
      if (effectivePlayer.lifeSteal > 0) {
        const heal = Math.round(dealt * effectivePlayer.lifeSteal);
        if (heal > 0) {
          setLeechSoul(true);
          setTimeout(() => setLeechSoul(false), 350);
          setPlayer((p) => ({
            ...p,
            hp: Math.min(effectivePlayer.maxHp, p.hp + heal),
          }));
        }
      }

      // 敵討伐時
      if (nextEnemyHp <= 0) {
        clearInterval(timer);
        setIsFighting(false);
        setEnemy(null);
        playLootSound();

        // ドロップ数の抽選（0〜3個）
        const dropCount = rollLootDropCount(enemy.isBoss);
        if (dropCount > 0) {
          const diffBonus = DIFFICULTY_PRESETS[player.difficulty].lootBonus;
          const drops: Item[] = [];
          for (let i = 0; i < dropCount; i++) {
            drops.push(
              generateProceduralItem(
                effectivePlayer.floor,
                enemy.isBoss,
                undefined,
                diffBonus,
              ),
            );
          }
          setLootReward(drops);
        }

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

  // 売却処理（神話級武具保護ダイアログ）
  const handleSellItem = (item: Item) => {
    if (item.rarity === "神話") {
      const ok = window.confirm(
        `【警告】最高位の神話武具『${item.name}』を本当に手放しますか？`,
      );
      if (!ok) return;
    }
    setPlayer((p) => ({ ...p, gold: p.gold + item.sellPrice }));
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    if (selectedInventoryItem?.id === item.id) setSelectedInventoryItem(null);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const canClaimShrine = player.lastLoginDate !== todayStr;

  return (
    <div className="w-full min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-between p-3 select-none font-serif">
      <div className="w-full max-w-md flex flex-col h-full flex-1">
        {/* 和風ヘッダー */}
        <header className="flex justify-between items-center py-2 px-1 mb-2 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-widest text-amber-300 text-sm">
              常夜ノ淵
            </span>
            <span className="text-[10px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-amber-400 font-mono">
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
              宿場町
            </button>
            <button
              onClick={() => setShowFloorSelect(true)}
              className="text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 rounded text-stone-300 font-mono"
            >
              階層
            </button>
            <button
              onClick={() => setShowSync(true)}
              className="text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 rounded text-stone-400"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* 難易度セレクター */}
        <div className="flex justify-between items-center px-1 mb-2 text-[10px] font-sans">
          <span className="text-stone-400">道中難易度:</span>
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
                    ? "border-amber-500 bg-amber-950/60 text-amber-300 font-bold shadow-sm"
                    : "border-stone-800 bg-stone-900 text-stone-500"
                }`}
              >
                {d.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* スタイリッシュ2.5D戦闘ステージ */}
        <div className="mb-3">
          <BattleStage
            player={effectivePlayer}
            enemy={enemy}
            isFighting={isFighting}
            isMarching={isMarching}
            bloodEffect={bloodEffect}
            critFlash={critFlash}
            leechSoul={leechSoul}
            specialGauge={specialGauge}
            onUseSpecial={handleUseSpecial}
          />
        </div>

        {/* ステータスバッジ */}
        <div className="grid grid-cols-4 gap-1.5 mb-2.5 text-center text-xs font-mono">
          <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">攻撃力</span>
            <span className="text-stone-200 font-bold">
              {effectivePlayer.atk}
            </span>
          </div>
          <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">防御力</span>
            <span className="text-stone-200 font-bold">
              {effectivePlayer.def}
            </span>
          </div>
          <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">会心率</span>
            <span className="text-amber-400 font-bold">
              {Math.round(effectivePlayer.critRate * 100)}%
            </span>
          </div>
          <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500 text-[9px] block">吸血回復</span>
            <span className="text-rose-400 font-bold">
              {Math.round(effectivePlayer.lifeSteal * 100)}%
            </span>
          </div>
        </div>

        {/* 装備部位スロット */}
        <div className="mb-2">
          <div className="text-[10px] font-mono text-stone-400 mb-1 px-1">
            身に纏いし武具
          </div>
          <EquipmentSlots
            equipment={equipment}
            onSlotClick={(slot) => setSelectedSlot(slot)}
            selectedSlot={selectedSlot}
          />
        </div>

        {/* 選択した荷物の詳細 & 身に纏う / 売却 */}
        {selectedInventoryItem && (
          <div className="bg-stone-900 border border-amber-600/70 rounded-xl p-2.5 mb-2 text-xs font-serif">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-stone-200">
                {selectedInventoryItem.name}
              </span>
              <button
                onClick={() => handleSellItem(selectedInventoryItem)}
                className="text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 px-2 py-0.5 rounded"
              >
                売却 ({selectedInventoryItem.sellPrice} 両)
              </button>
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => {
                  const target = selectedInventoryItem;
                  const cur = equipment[target.slot];
                  setEquipment((prev) => ({ ...prev, [target.slot]: target }));
                  setInventory((prev) => {
                    const f = prev.filter((i) => i.id !== target.id);
                    return cur ? [...f, cur] : f;
                  });
                  setSelectedInventoryItem(null);
                }}
                className="flex-1 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded text-[11px]"
              >
                身に纏う
              </button>
              <button
                onClick={() => setSelectedInventoryItem(null)}
                className="px-2.5 py-1 bg-stone-800 text-stone-400 rounded text-[11px]"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 画面下部アクションバー */}
      <div className="w-full max-w-md pt-2 border-t border-stone-900">
        <button
          onClick={() => handleStartCombat()}
          disabled={isFighting || isMarching}
          className={`w-full py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all shadow-xl text-sm ${
            isFighting
              ? "bg-rose-950/80 border border-rose-800 text-rose-300 animate-pulse"
              : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 active:scale-98"
          }`}
        >
          {isMarching
            ? "ざっ、ざっ… 進軍中…"
            : isFighting
              ? "⚔️ 刃を交え戦闘中……"
              : `⚔️ 第 ${player.floor} 階層へ進む`}
        </button>
      </div>

      {/* ドロップ報酬画面（強弱の即時判定バッジ付き） */}
      {lootReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-stone-900 border-2 border-stone-700 rounded-2xl p-4 shadow-2xl font-serif">
            <h3 className="text-center font-black text-amber-400 text-sm tracking-widest mb-1">
              ─ 討伐戦利品 ─
            </h3>
            <p className="text-center text-stone-400 text-xs mb-3">
              一品を選び懐に収める
            </p>

            <div className="space-y-2 mb-3">
              {lootReward.map((item) => {
                const cfg =
                  RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG] ||
                  RARITY_CONFIG["一般"];
                const comp = compareItemStrength(item, equipment[item.slot]);

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
                    className={`p-2.5 rounded-xl border bg-stone-950 cursor-pointer hover:border-amber-400 transition-all relative ${cfg.border}`}
                  >
                    {/* 強弱即時バッジ */}
                    <div className="absolute top-2 right-2">
                      {comp === "better" && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 text-[9px] font-bold">
                          ▲ 優良
                        </span>
                      )}
                      {comp === "worse" && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 text-[9px] font-bold">
                          ▼ 劣悪
                        </span>
                      )}
                      {comp === "equal" && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 text-[9px] font-bold">
                          ＝ 同等
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mb-1">
                      <JapaneseEquipIcon
                        slot={item.slot}
                        rarity={item.rarity}
                        size="sm"
                      />
                      <div>
                        <div className="font-bold text-xs text-stone-200">
                          {item.name}
                        </div>
                        <div className={`text-[9px] font-bold ${cfg.color}`}>
                          [{SLOT_LABELS[item.slot].label}] {item.rarity}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-400 space-x-2 font-mono mt-1">
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
                setPlayer((p) => ({ ...p, gold: p.gold + 40 }));
                setLootReward(null);
              }}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold"
            >
              すべて打ち捨て換金 (+40 両)
            </button>
          </div>
        </div>
      )}

      {/* ストーリー幕間 */}
      {activeStory && (
        <StoryModal
          scene={activeStory}
          onComplete={() => setActiveStory(null)}
        />
      )}

      {/* 神社参拝 */}
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

      {/* 宿場町・鍛冶場 */}
      {showGuild && (
        <GuildModal
          gold={player.gold}
          quests={quests}
          titles={INITIAL_TITLES}
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
          onRepairAll={(cost) => {
            if (player.gold < cost) return;
            setPlayer((p) => ({ ...p, gold: p.gold - cost }));
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
          }}
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

      {/* 階層選択 */}
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

      {/* システム設定 */}
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
              critRate: 0.08,
              critDmg: 1.6,
              lifeSteal: 0.04,
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
