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
import { Game, GameItem, GamePhing, GameTeam } from '../api';
import { QueuedPhing } from '../offlineQueue';
import i18n from '../i18n';

interface BingoGridModalProps {
  visible: boolean;
  game: Game | null;
  teams?: GameTeam[];
  items: GameItem[];
  allPhings?: GamePhing[];
  queuedPhings?: QueuedPhing[];
  currentUserId: number;
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
  teams,
  items,
  allPhings = [],
  queuedPhings = [],
  currentUserId,
  onClose,
  onSubmitTile,
  onViewPhing,
}: BingoGridModalProps) {
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; label: string; owner?: string } | null>(null);
  const lastLaunchRef = useRef(0);

  if (!game) return null;

  const totalTiles = (game.rows || 3) * (game.cols || 3);
  const isBlockMode = game.game_mode === 'block';
  const isTeamGame = Boolean(game.is_team_game);

  // Hitta phings tagna av mitt lag / mig
  const myTeamPhings = allPhings.filter(p =>
    p.status === 'approved' &&
    (isTeamGame ? (p.team_id && p.team_id === game.team_id) : p.user_id === currentUserId)
  );
  const completedCount = myTeamPhings.length;
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

    // Kolla om mitt lag eller jag redan tagit rutan
    const myClaimedPhing = allPhings.find(p =>
      p.tile_index === index && p.status === 'approved' &&
      (isTeamGame ? (p.team_id && p.team_id === game.team_id) : p.user_id === currentUserId)
    );
    if (myClaimedPhing) {
      if (onViewPhing) {
        onViewPhing(myClaimedPhing);
      } else {
        const item = items.find(it => it.tile_index === index);
        setPreviewPhoto({
          uri: myClaimedPhing.photo_thumb,
          label: item?.label || `Mål ${index + 1}`,
          owner: myClaimedPhing.user_name,
        });
      }
      return;
    }

    // I BLOCK-LÄGE: Kolla om motståndaren har tagit rutan
    if (isBlockMode) {
      const opponentClaimedPhing = allPhings.find(p =>
        p.tile_index === index && p.status === 'approved' &&
        (isTeamGame ? (p.team_id && p.team_id !== game.team_id) : p.user_id !== currentUserId)
      );
      if (opponentClaimedPhing) {
        const owner = opponentClaimedPhing.team_name || opponentClaimedPhing.user_name;
        Alert.alert(
          '🔒 Rutan är blockerad!',
          `Denna ruta har redan erövrats av ${owner}. I detta läge vinner det lag som tar flest rutor (the winner takes it all)!`,
          [
            {
              text: 'Visa bild',
              onPress: () => {
                const item = items.find(it => it.tile_index === index);
                setPreviewPhoto({
                  uri: opponentClaimedPhing.photo_thumb,
                  label: `Erövrad av ${owner}: ${item?.label || `Mål ${index + 1}`}`,
                  owner,
                });
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }
    }

    const item = items.find(it => it.tile_index === index);
    const label = item?.label || `Mål ${index + 1}`;
    const emoji = item?.emoji || '🎯';
    const hint = item?.hint;

    const startCamera = async () => {
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

    if (hint) {
      Alert.alert(
        `${emoji} ${label}`,
        hint,
        [
          { text: 'Avbryt', style: 'cancel' },
          { text: '📸 Ta foto', onPress: startCamera },
        ]
      );
    } else {
      startCamera();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
            <Text style={styles.gridBadge}>
              {game.grid_size} ({game.rows} rader × 3 per rad)
            </Text>
          </View>
          <TouchableOpacity style={styles.mapToggleBtn} onPress={onClose} activeOpacity={0.8}>
            <FontAwesome6 name="map-location-dot" size={15} color="#0F4C5C" />
            <Text style={styles.mapToggleBtnText}>Visa Karta</Text>
          </TouchableOpacity>
        </View>

        {/* Progress & Info */}
        <View style={styles.progressContainer}>
          {isTeamGame && teams && teams.length > 0 ? (
            <View style={styles.teamScoreboard}>
              {teams.map(t => {
                const isMyTeam = t.id === game.team_id;
                return (
                  <View key={t.id} style={[styles.teamBadge, { borderColor: t.color }, isMyTeam && styles.myTeamBadge]}>
                    <View style={[styles.teamDot, { backgroundColor: t.color }]} />
                    <Text style={[styles.teamName, isMyTeam && { fontWeight: '700' }]}>
                      {t.name}{isMyTeam ? ' (Du)' : ''}:
                    </Text>
                    <Text style={[styles.teamScore, { color: t.color }]}>{t.score}</Text>
                  </View>
                );
              })}
              {isBlockMode && (
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>
                    {Math.max(0, totalTiles - allPhings.filter(p => p.status === 'approved').length)} kvar
                  </Text>
                </View>
              )}
            </View>
          ) : (
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
          )}

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, (completedCount / totalTiles) * 100)}%` }]} />
          </View>
        </View>

        {/* Bingobricka (Rutmönster: 3 per rad) */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {Array.from({ length: totalTiles }).map((_, index) => {
              const myClaimedPhing = allPhings.find(p =>
                p.tile_index === index && p.status === 'approved' &&
                (isTeamGame ? (p.team_id && p.team_id === game.team_id) : p.user_id === currentUserId)
              );
              const opponentClaimedPhing = isBlockMode
                ? allPhings.find(p =>
                    p.tile_index === index && p.status === 'approved' &&
                    (isTeamGame ? (p.team_id && p.team_id !== game.team_id) : p.user_id !== currentUserId)
                  )
                : null;

              const item = items.find(it => it.tile_index === index);
              const label = item?.label || `Mål ${index + 1}`;
              const isProcessingThis = capturing && activeTileIndex === index;

              if (myClaimedPhing) {
                return (
                  <TouchableOpacity
                    key={`tile-${index}`}
                    style={[styles.tile, styles.tileCompleted]}
                    activeOpacity={0.8}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: myClaimedPhing.photo_thumb }} style={styles.tileImage} />
                    <View style={styles.tileCheckmarkBadge}>
                      <FontAwesome6 name="check" size={14} color="#FFFFFF" />
                    </View>
                    <View style={styles.tileOverlay}>
                      <Text style={styles.tileCompletedLabel} numberOfLines={1}>{label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              if (opponentClaimedPhing) {
                const ownerColor = opponentClaimedPhing.team_color || '#EF4444';
                const ownerName = opponentClaimedPhing.team_name || opponentClaimedPhing.user_name;
                return (
                  <TouchableOpacity
                    key={`tile-${index}`}
                    style={[styles.tile, styles.tileBlocked, { borderColor: ownerColor }]}
                    activeOpacity={0.8}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: opponentClaimedPhing.photo_thumb }} style={[styles.tileImage, { opacity: 0.65 }]} />
                    <View style={[styles.tileLockBadge, { backgroundColor: ownerColor }]}>
                      <FontAwesome6 name="lock" size={12} color="#FFFFFF" />
                    </View>
                    <View style={[styles.tileOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
                      <Text style={styles.tileBlockedLabel} numberOfLines={1}>
                        🔒 {ownerName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              const queuedPhing = queuedPhings.find(q => q.tileIndex === index);
              if (queuedPhing) {
                return (
                  <TouchableOpacity
                    key={`tile-${index}`}
                    style={[styles.tile, styles.tileQueued]}
                    activeOpacity={0.8}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: queuedPhing.photoThumb }} style={[styles.tileImage, { opacity: 0.85 }]} />
                    <View style={styles.tileQueuedBadge}>
                      <FontAwesome6 name="tower-broadcast" size={11} color="#FFFFFF" />
                    </View>
                    <View style={[styles.tileOverlay, { backgroundColor: 'rgba(217, 119, 6, 0.92)' }]}>
                      <Text style={styles.tileQueuedLabel} numberOfLines={1}>
                        📡 Sparad offline
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={`tile-${index}`}
                  style={[styles.tile, styles.tileEmpty]}
                  activeOpacity={0.8}
                  onPress={() => handleTilePress(index)}
                  disabled={capturing}
                >
                  <View style={styles.tileInner}>
                    <View style={styles.tileNumberBadge}>
                      <Text style={styles.tileNumberText}>{index + 1}</Text>
                    </View>
                    {isProcessingThis ? (
                      <ActivityIndicator size="small" color="#0F4C5C" />
                    ) : item?.emoji ? (
                      <Text style={styles.tileEmoji}>{item.emoji}</Text>
                    ) : (
                      <FontAwesome6 name="camera" size={24} color="#0F4C5C" style={{ opacity: 0.6 }} />
                    )}
                    <Text style={styles.tileLabel} numberOfLines={2}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Flytande snabbknapp till kartan */}
        <View style={styles.floatingFooter} pointerEvents="box-none">
          <TouchableOpacity style={styles.bottomSwitchBtn} onPress={onClose} activeOpacity={0.85}>
            <FontAwesome6 name="map" size={16} color="#FFFFFF" />
            <Text style={styles.bottomSwitchBtnText}>Växla till kartan</Text>
          </TouchableOpacity>
        </View>

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
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F4F6',
    borderWidth: 1,
    borderColor: '#BEE3E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapToggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4C5C',
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  bottomSwitchBtn: {
    backgroundColor: '#0F4C5C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomSwitchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  tileBlocked: {
    backgroundColor: '#1F2937',
    borderWidth: 2,
  },
  tileQueued: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  tileQueuedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tileQueuedLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamScoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  myTeamBadge: {
    backgroundColor: '#F3F4F6',
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  teamScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modeBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  tileLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tileBlockedLabel: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
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
  tileEmoji: {
    fontSize: 24,
    marginBottom: 2,
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
