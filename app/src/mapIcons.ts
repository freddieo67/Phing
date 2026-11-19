import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

export interface MapIconItem {
  id: string;
  emoji: string;
  readonly label: string;
}

function mapIcon(id: string, emoji: string, fallbackLabel?: string): MapIconItem {
  return {
    id,
    emoji,
    get label() {
      const key = `icon_${id}`;
      return i18n.t(key) !== key ? i18n.t(key) : (fallbackLabel || id);
    },
  };
}

export const MAP_ICONS: MapIconItem[] = [
  // Djur & Varelser
  mapIcon('fox', '🦊', 'Räv'),
  mapIcon('tiger', '🐯', 'Tiger'),
  mapIcon('lion', '🦁', 'Lejon'),
  mapIcon('wolf', '🐺', 'Varg'),
  mapIcon('bear', '🐻', 'Björn'),
  mapIcon('panda', '🐼', 'Panda'),
  mapIcon('eagle', '🦅', 'Örn'),
  mapIcon('owl', '🦉', 'Uggla'),
  mapIcon('frog', '🐸', 'Groda'),
  mapIcon('monkey', '🐵', 'Apa'),
  mapIcon('octopus', '🐙', 'Bläckfisk'),
  mapIcon('pig', '🐷', 'Gris'),
  mapIcon('unicorn', '🦄', 'Enhörning'),
  mapIcon('shark', '🦈', 'Haj'),
  mapIcon('bee', '🐝', 'Bi'),

  // Fordon & Fart
  mapIcon('rocket', '🚀', 'Raket'),
  mapIcon('racecar', '🏎️', 'Racerbil'),
  mapIcon('lightning', '⚡', 'Blixt'),
  mapIcon('motorcycle', '🏍️', 'Motorcykel'),
  mapIcon('bicycle', '🚲', 'Cykel'),
  mapIcon('helicopter', '🚁', 'Helikopter'),
  mapIcon('ufo', '🛸', 'UFO'),

  // Symboler & Figurer
  mapIcon('target', '🎯', 'Måltavla'),
  mapIcon('fire', '🔥', 'Eld'),
  mapIcon('diamond', '💎', 'Diamant'),
  mapIcon('crown', '👑', 'Krona'),
  mapIcon('ghost', '👻', 'Spöke'),
  mapIcon('alien', '👽', 'Rymdvarelse'),
  mapIcon('clown', '🤡', 'Clown'),
  mapIcon('robot', '🤖', 'Robot'),
  mapIcon('ninja', '🥷', 'Ninja'),
  mapIcon('cowboy', '🤠', 'Cowboy'),
  mapIcon('beer', '🍺', 'Öl'),
  mapIcon('pizza', '🍕', 'Pizza'),
];

export type MapIconEmoji = string;
export const DEFAULT_MAP_ICON: MapIconEmoji = '🦊';

const MAP_ICON_KEY = 'phing.user_map_icon';

export async function getSavedMapIcon(): Promise<MapIconEmoji | null> {
  try {
    const raw = await AsyncStorage.getItem(MAP_ICON_KEY);
    if (raw && raw.trim().length > 0) {
      return raw as MapIconEmoji;
    }
  } catch (e) {
    console.warn('Kunde inte läsa sparad kartikon:', e);
  }
  return null;
}

export async function saveMapIcon(emoji: MapIconEmoji): Promise<void> {
  try {
    await AsyncStorage.setItem(MAP_ICON_KEY, emoji);
  } catch (e) {
    console.warn('Kunde inte spara kartikon:', e);
  }
}

const DEFAULT_POOL = ['🦊', '🐯', '🦁', '🐺', '🐻', '🐼', '🐨', '🦅', '🦉', '🐸', '🐵', '🐙', '🚀', '🏎️', '⚡', '🎯'];

export function getDefaultIconForUserId(userId?: number | null): string {
  if (!userId) return '🦊';
  return DEFAULT_POOL[Math.abs(userId) % DEFAULT_POOL.length];
}
