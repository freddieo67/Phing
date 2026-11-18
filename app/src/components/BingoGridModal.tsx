import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Game, GameItem, GamePhing } from '../api';
import i18n from '../i18n';

interface BingoGridModalProps {
  visible: boolean;
  game: Game | null;
  items: GameItem[];
  myPhings: Record<number, GamePhing>;
  onClose: () => void;
  onSubmitTile: (tileIndex: number, photoThumb: string, photoData: string) => Promise<void>;
  onViewPhing?: (phing: GamePhing) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const TILE_GAP = 10;
// Exakt 3 kolumner: (bredd - marginaler - gap) / 3
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - TILE_GAP * 2) / 3);

export default function BingoGridModal({
  visible,
  game,
  items,
  myPhings,
  onClose,
  onSubmitTile,
  onViewPhing,
}: BingoGridModalProps) {
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; label: string } | null>(null);
  const lastLaunchRef = useRef(0);

  if (!game) return null;

  const totalTiles = (game.rows || 3) * (game.cols || 3);
  const completedCount = Object.keys(myPhings).length;
  const isAllCompleted = completedCount >= totalTiles;

  const canLaunch = () => {
    const now = Date.now();
    if (now - lastLaunchRef.current < 1500) return false;
    lastLaunchRef.current = now;
    return true;
  };

  const processAndSubmit = async (tileIndex: number, uri: string) => {
    setCapturing(true);
    try {
      const thumbRes = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 240 } }],
        { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const fullRes = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 900 } }],
        { compress: 0.68, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!thumbRes.base64) {
        throw new Error('Kunde inte generera tumnagel');
      }

      const thumbData = `data:image/jpeg;base64,${thumbRes.base64}`;
      const fullData = fullRes.base64 ? `data:image/jpeg;base64,${fullRes.base64}` : thumbData;

      await onSubmitTile(tileIndex, thumbData, fullData);
    } catch (e) {
      console.warn('Fel vid hantering av bild för ruta:', e);
      Alert.alert(i18n.t('error'), 'Kunde inte ladda upp bilden.');
    } finally {
      setCapturing(false);
      setActiveTileIndex(null);
    }
  };

  const handleTilePress = async (index: number) => {
    if (game.status !== 'active') {
      if (game.status === 'lobby') {
        Alert.alert('Spelet har inte startat', 'Tävlingen startar inom kort!');
      } else {
        Alert.alert('Spelet är avslutat', 'Tävlingstiden har gått ut.');
      }
      return;
    }

    const existing = myPhings[index];
    if (existing) {
      if (onViewPhing) {
        onViewPhing(existing);
      } else {
        const item = items.find(it => it.tile_index === index);
        setPreviewPhoto({
          uri: existing.photo_thumb,
          label: item?.label || `Mål ${index + 1}`,
        });
      }
      return;
    }

    if (!canLaunch()) return;
    setActiveTileIndex(index);

    // Öppna direkt kameran
    try {
      let perm = await ImagePicker.getCameraPermissionsAsync();
      if (!perm.granted) {
        perm = await ImagePicker.requestCameraPermissionsAsync();
      }
      if (!perm.granted) {
        Alert.alert(i18n.t('permission_missing_title'), i18n.t('camera_permission_needed'));
        setActiveTileIndex(null);
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        await processAndSubmit(index, res.assets[0].uri);
      } else {
        setActiveTileIndex(null);
      }
    } catch (e) {
      console.warn('Kamerafel vid bingoruta:', e);
      Alert.alert(i18n.t('error'), i18n.t('camera_error'));
      setActiveTileIndex(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
            <Text style={styles.gridBadge}>
              {game.grid_size} ({game.rows} rader × 3 per rad)
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress & Info */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Hittade: <Text style={styles.progressBold}>{completedCount} / {totalTiles}</Text>
            </Text>
            {isAllCompleted ? (
              <View style={styles.bingoBadge}>
                <Text style={styles.bingoBadgeText}>🏆 BINGO!</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>
                {game.status === 'active' ? '🟢 Tävling pågår' : (game.status === 'lobby' ? '⏳ Väntar på start' : 'Avslutad')}
              </Text>
            )}
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, (completedCount / totalTiles) * 100)}%` }]} />
          </View>
        </View>

        {/* Bingobricka (Rutmönster: 3 per rad) */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {Array.from({ length: totalTiles }).map((_, index) => {
              const phing = myPhings[index];
              const item = items.find(it => it.tile_index === index);
              const label = item?.label || `Mål ${index + 1}`;
              const isProcessingThis = capturing && activeTileIndex === index;

              return (
                <TouchableOpacity
                  key={`tile-${index}`}
                  style={[
                    styles.tile,
                    phing ? styles.tileCompleted : styles.tileEmpty,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleTilePress(index)}
                  disabled={capturing}
                >
                  {phing ? (
                    <>
                      <Image source={{ uri: phing.photo_thumb }} style={styles.tileImage} />
                      <View style={styles.tileCheckmarkBadge}>
                        <FontAwesome6 name="check" size={14} color="#FFFFFF" />
                      </View>
                      <View style={styles.tileOverlay}>
                        <Text style={styles.tileCompletedLabel} numberOfLines={1}>
                          {label}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.tileInner}>
                      <View style={styles.tileNumberBadge}>
                        <Text style={styles.tileNumberText}>{index + 1}</Text>
                      </View>
                      {isProcessingThis ? (
                        <ActivityIndicator size="small" color="#0F4C5C" />
                      ) : (
                        <FontAwesome6 name="camera" size={24} color="#0F4C5C" style={{ opacity: 0.6 }} />
                      )}
                      <Text style={styles.tileLabel} numberOfLines={2}>
                        {label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Förhandsvisning av bild */}
        {previewPhoto && (
          <Modal transparent visible animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
            <View style={styles.previewBackdrop}>
              <View style={styles.previewCard}>
                <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} resizeMode="contain" />
                <Text style={styles.previewLabel}>{previewPhoto.label}</Text>
                <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewPhoto(null)}>
                  <Text style={styles.previewCloseText}>Stäng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  gridBadge: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
  },
  progressBold: {
    fontWeight: '700',
    color: '#0F4C5C',
  },
  statusText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  bingoBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bingoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F4C5C',
    borderRadius: 3,
  },
  scrollContent: {
    padding: GRID_PADDING,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    justifyContent: 'flex-start',
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  tileEmpty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  tileCompleted: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tileNumberBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#F3F4F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 6,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tileCheckmarkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#10B981',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tileCompletedLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
  },
  previewLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  previewCloseBtn: {
    marginTop: 16,
    backgroundColor: '#0F4C5C',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  previewCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
