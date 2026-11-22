import { get, set, del } from 'idb-keyval';
import type { SaveData } from '../types/game';
import { supabase } from '../config/supabase';

const SAVE_KEY = 'cyber_abyss_save_v1';

export const saveGameLocal = async (data: SaveData): Promise<void> => {
  await set(SAVE_KEY, data);
};

export const loadGameLocal = async (): Promise<SaveData | undefined> => {
  return await get<SaveData>(SAVE_KEY);
};

export const syncToSupabase = async (userId: string, data: SaveData): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('user_saves').upsert({
    user_id: userId,
    save_data: data,
    floor: data.stats.floor,
    gold: data.stats.gold,
    updated_at: new Date().toISOString()
  });
  return !error;
};

export const fetchFromSupabase = async (userId: string): Promise<SaveData | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_saves')
    .select('save_data')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.save_data as SaveData;
};

export const clearGameLocal = async (): Promise<void> => {
  await del(SAVE_KEY);
};
