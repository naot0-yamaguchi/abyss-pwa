import React from "react";
import type { EquipmentState, EquipSlot, Rarity } from "../types/game";
import { RARITY_CONFIG, SLOT_LABELS } from "../data/items";
import { JapaneseEquipIcon } from "./JapaneseEquipIcon";

interface Props {
  equipment: EquipmentState;
  onSlotClick: (slot: EquipSlot) => void;
  selectedSlot: EquipSlot | null;
}

const ORDERED_SLOTS: EquipSlot[] = [
  "head",
  "chest",
  "mainHand",
  "offHand",
  "legs",
  "ring",
];

export const EquipmentSlots: React.FC<Props> = ({
  equipment,
  onSlotClick,
  selectedSlot,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 w-full font-serif">
      {ORDERED_SLOTS.map((slot) => {
        const item = equipment ? equipment[slot] : null;
        const isSelected = selectedSlot === slot;
        const rarityKey = (item?.rarity || "一般") as Rarity;
        const rarityCfg = item
          ? RARITY_CONFIG[rarityKey] || RARITY_CONFIG["一般"]
          : null;
        const slotInfo = SLOT_LABELS[slot];

        return (
          <button
            key={slot}
            onClick={() => onSlotClick(slot)}
            className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-left transition-all min-h-[82px] ${
              item
                ? `${rarityCfg?.border} bg-stone-900/90 shadow-sm`
                : "border-stone-800 bg-stone-950/70"
            } ${isSelected ? "ring-2 ring-amber-400 scale-[1.02]" : "hover:border-stone-600"}`}
          >
            {/* 上部部位ラベル */}
            <div className="w-full flex justify-between items-center text-[9px] font-mono">
              <span className="text-amber-400 font-bold tracking-wider">
                [{slotInfo.label}]
              </span>
              {item && (
                <span className={`text-[8px] font-bold ${rarityCfg?.color}`}>
                  {item.rarity}
                </span>
              )}
            </div>

            {/* 高級和風アイコン */}
            <JapaneseEquipIcon slot={slot} rarity={rarityKey} size="md" />

            {/* 武具銘 & 耐久度 */}
            <div className="w-full text-center">
              <div
                className={`text-[10px] font-bold truncate ${item ? rarityCfg?.color : "text-stone-500"}`}
              >
                {item
                  ? `${item.upgradeLevel > 0 ? `+${item.upgradeLevel} ` : ""}${item.name}`
                  : "未装備"}
              </div>
              {item && (
                <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full ${item.durability < 30 ? "bg-rose-500" : "bg-amber-600"}`}
                    style={{
                      width: `${(item.durability / item.maxDurability) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
