import React, { useState } from 'react';
import type { SaveData } from '../types/game';
import { syncToSupabase, fetchFromSupabase, clearGameLocal } from '../utils/storage';

interface Props {
  currentData: SaveData;
  onDataLoaded: (data: SaveData) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SyncDrawer: React.FC<Props> = ({ currentData, onDataLoaded, onResetData, onClose }) => {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleCloudSave = async () => {
    if (!userId.trim()) {
      setStatus('User ID is required');
      return;
    }
    setStatus('Saving...');
    const ok = await syncToSupabase(userId, currentData);
    setStatus(ok ? 'Saved to Cloud successfully!' : 'Save failed. Check Supabase config.');
  };

  const handleCloudLoad = async () => {
    if (!userId.trim()) {
      setStatus('User ID is required');
      return;
    }
    setStatus('Loading...');
    const data = await fetchFromSupabase(userId);
    if (data) {
      onDataLoaded(data);
      setStatus('Loaded from Cloud!');
    } else {
      setStatus('Data not found or load failed.');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber_abyss_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // セーブデータ初期化処理
  const handleReset = async () => {
    const ok = window.confirm('【警告】セーブデータを完全に初期化しますか？この操作は取り消せません。');
    if (!ok) return;

    await clearGameLocal();
    onResetData();
    setStatus('Data reset completed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs h-full bg-stone-900 border-l border-stone-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-stone-200">System & Cloud Sync</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-white text-sm">✕</button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-stone-400 mb-1">User Identifier</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="e.g. user_999"
                className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-stone-200 outline-none focus:border-stone-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCloudSave}
                className="py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded font-bold"
              >
                Cloud Save
              </button>
              <button
                onClick={handleCloudLoad}
                className="py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-bold"
              >
                Cloud Load
              </button>
            </div>

            {status && <div className="text-[11px] text-amber-300 mt-2">{status}</div>}

            <div className="border-t border-stone-800 pt-3 mt-4 space-y-2">
              <button
                onClick={handleExportJson}
                className="w-full py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-bold"
              >
                Export JSON
              </button>

              {/* 初期化ボタン */}
              <button
                onClick={handleReset}
                className="w-full py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 text-rose-300 rounded font-bold transition-colors"
              >
                🗑️ Reset Save Data
              </button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-stone-500 text-center">
          PWA Local Storage • Cyber Abyss
        </div>
      </div>
    </div>
  );
};
