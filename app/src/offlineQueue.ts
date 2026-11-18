import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedPhing {
  id: string;
  gameId: number;
  userId: number;
  tileIndex: number;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  photoThumb: string;
  photoData?: string;
  createdAt: string;
  retries: number;
}

const QUEUE_STORAGE_KEY = '@phing_offline_queue_v1';

export async function getQueuedPhings(gameId?: number): Promise<QueuedPhing[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const list: QueuedPhing[] = JSON.parse(raw);
    if (gameId != null) {
      return list.filter(item => item.gameId === gameId);
    }
    return list;
  } catch (err) {
    console.warn('Kunde inte läsa offline-kö:', err);
    return [];
  }
}

export async function enqueuePhing(
  item: Omit<QueuedPhing, 'id' | 'createdAt' | 'retries'>
): Promise<QueuedPhing> {
  const queuedItem: QueuedPhing = {
    ...item,
    id: `queued_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  try {
    const current = await getQueuedPhings();
    // Ersätt eventuellt befintlig köad phing för samma spel och ruta
    const filtered = current.filter(
      p => !(p.gameId === item.gameId && p.tileIndex === item.tileIndex)
    );
    filtered.push(queuedItem);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Kunde inte spara till offline-kö:', err);
  }

  return queuedItem;
}

export async function removeQueuedPhing(id: string): Promise<void> {
  try {
    const current = await getQueuedPhings();
    const updated = current.filter(p => p.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Kunde inte ta bort från offline-kö:', err);
  }
}

export async function clearQueuedPhingsForGame(gameId: number): Promise<void> {
  try {
    const current = await getQueuedPhings();
    const updated = current.filter(p => p.gameId !== gameId);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Kunde inte rensa offline-kö:', err);
  }
}

let isFlushing = false;

export async function flushOfflineQueue(
  sendPhingFn: (item: QueuedPhing) => Promise<any>,
  onSuccess?: (item: QueuedPhing, result: any) => void
): Promise<number> {
  if (isFlushing) return 0;
  isFlushing = true;

  let sentCount = 0;
  try {
    const queue = await getQueuedPhings();
    if (queue.length === 0) return 0;

    for (const item of queue) {
      try {
        const res = await sendPhingFn(item);
        await removeQueuedPhing(item.id);
        sentCount++;
        if (onSuccess) {
          onSuccess(item, res);
        }
      } catch (err) {
        // Om ett nätverksfel uppstår avbryter vi och provar igen senare
        console.log(`Kunde inte ladda upp köad phing (${item.tileIndex}), nätverk ej redo ännu.`);
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  return sentCount;
}
