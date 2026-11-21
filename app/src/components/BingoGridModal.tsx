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
import * as Location from 'expo-location';
import { Game, GameItem, GamePhing, GameTeam } from '../api';
import { QueuedPhing } from '../offlineQueue';
import { getDistanceMeters } from '../location';
import i18n from '../i18n';

interface BingoGridModalProps {
  visible: boolean;
  game: Game | null;
  teams?: GameTeam[];
  items: GameItem[];
  allPhings?: GamePhing[];
  queuedPhings?: QueuedPhing[];
  currentUserId: number;
  userLocation?: Location.LocationObject | null;
  onClose: () => void;
  onSubmitTile: (tileIndex: number, photoThumb: string, photoData: string) => Promise<void>;
  onViewPhing?: (phing: GamePhing) => void;
  onCancelGame?: () => void;
  onStartGame?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 12;
const TILE_GAP = 8;
// Exakt 3 kolumner: 1:1 kvadratiska rutor med tajt mellanrum och rundade hörn
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - TILE_GAP * 2) / 3);

export default function BingoGridModal({
  visible,
  game,
  teams,
  items,
  allPhings = [],
  queuedPhings = [],
  currentUserId,
  userLocation,
  onClose,
  onSubmitTile,
  onViewPhing,
  onCancelGame,
  onStartGame,
}: BingoGridModalProps) {
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; label: string; owner?: string } | null>(null);
  const lastLaunchRef = useRef(0);

  if (!game) return null;

  const isHost = game.host_id === currentUserId;

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
        Alert.alert('Utmaningen har inte startat', 'Tävlingen och timern startar så fort din inbjudna motståndare antar utmaningen!');
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
    const hint = item?.hint;
    const isLocation = item?.latitude != null && item?.longitude != null;
    const userCoords = userLocation?.coords;
    const distMeters = isLocation && userCoords
      ? Math.round(getDistanceMeters(userCoords.latitude, userCoords.longitude, item.latitude!, item.longitude!))
      : null;
    const reqRadius = item?.radius_meters || 50;

    // Om det är ett platsmål: kräv att spelaren fysiskt står inom radien!
    if (isLocation && distMeters !== null && distMeters > reqRadius) {
      const distStr = distMeters < 1000 ? `${distMeters} m` : `${(distMeters / 1000).toFixed(1)} km`;
      Alert.alert(
        `📍 ${label}`,
        `Inte i zonen (${distStr}).\n\nDu måste gå inom ${reqRadius} meter från platsen för att kunna ta bilden och erövra rutan!`,
        [{ text: 'OK' }]
      );
      return;
    }

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
        label,
        hint,
        [
          { text: 'Avbryt', style: 'cancel' },
          { text: 'Ta foto', onPress: startCamera },
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onCancelGame && (
              <TouchableOpacity
                style={styles.headerCancelBtn}
                onPress={onCancelGame}
                activeOpacity={0.8}
              >
                <FontAwesome6 name="xmark" size={13} color="#EF4444" />
                <Text style={styles.headerCancelBtnText}>{isHost ? 'Avbryt' : 'Lämna'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.mapToggleBtn} onPress={onClose} activeOpacity={0.8}>
              <FontAwesome6 name="map-location-dot" size={15} color="#0F4C5C" />
              <Text style={styles.mapToggleBtnText}>Karta</Text>
            </TouchableOpacity>
          </View>
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

        {/* Lobby Banner om spelet väntar på motståndare */}
        {game.status === 'lobby' && (
          <View style={styles.lobbyNoticeBox}>
            <FontAwesome6 name="hourglass-half" size={15} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.lobbyNoticeTitle}>Väntar på motståndare</Text>
              <Text style={styles.lobbyNoticeSub}>
                Startskottet och timern startar så fort någon antar utmaningen.
              </Text>
            </View>
            {isHost && onStartGame && (
              <TouchableOpacity style={styles.startNowBtn} onPress={onStartGame} activeOpacity={0.85}>
                <FontAwesome6 name="play" size={11} color="#FFFFFF" />
                <Text style={styles.startNowBtnText}>Starta nu</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
                    activeOpacity={0.85}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: myClaimedPhing.photo_thumb }} style={styles.tileImage} />
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
                    activeOpacity={0.85}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: opponentClaimedPhing.photo_thumb }} style={[styles.tileImage, { opacity: 0.6 }]} />
                    <View style={[styles.tileOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
                      <Text style={styles.tileBlockedLabel} numberOfLines={1}>
                        {ownerName}
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
                    activeOpacity={0.85}
                    onPress={() => handleTilePress(index)}
                  >
                    <Image source={{ uri: queuedPhing.photoThumb }} style={[styles.tileImage, { opacity: 0.7 }]} />
                    <View style={[styles.tileOverlay, { backgroundColor: 'rgba(217, 119, 6, 0.9)' }]}>
                      <Text style={styles.tileQueuedLabel} numberOfLines={1}>
                        Sparad offline
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              const isLocation = item?.latitude != null && item?.longitude != null;
              const userCoords = userLocation?.coords;
              const distMeters = isLocation && userCoords
                ? Math.round(getDistanceMeters(userCoords.latitude, userCoords.longitude, item.latitude!, item.longitude!))
                : null;
              const reqRadius = item?.radius_meters || 50;
              const isWithinRange = distMeters !== null && distMeters <= reqRadius;
              const distanceText = distMeters !== null
                ? (distMeters < 1000 ? `${distMeters} m` : `${(distMeters / 1000).toFixed(1)} km`)
                : null;

              return (
                <TouchableOpacity
                  key={`tile-${index}`}
                  style={[styles.tile, styles.tileEmpty, isWithinRange && styles.tileNear]}
                  activeOpacity={0.75}
                  onPress={() => handleTilePress(index)}
                  disabled={capturing}
                >
                  <View style={styles.tileInner}>
                    {isProcessingThis ? (
                      <ActivityIndicator size="small" color="#18181B" />
                    ) : (
                      <>
                        <Text
                          style={styles.tileLabel}
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {label}
                        </Text>
                        {distanceText && (
                          <View style={[styles.distancePill, isWithinRange && styles.distancePillNear]}>
                            <Text style={[styles.distanceText, isWithinRange && styles.distanceTextNear]}>
                              {isWithinRange ? '🟢 I zonen' : `📍 ${distanceText}`}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {onCancelGame && (
            <TouchableOpacity
              style={styles.cancelGameBtn}
              onPress={onCancelGame}
              activeOpacity={0.8}
            >
              <FontAwesome6 name="circle-xmark" size={15} color="#DC2626" />
              <Text style={styles.cancelGameBtnText}>
                {isHost ? 'Avbryt tävlingen (skapare)' : 'Lämna tävlingen'}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* AI analys-indikator */}
        {capturing && (
          <View style={styles.aiLoadingOverlay}>
            <View style={styles.aiLoadingCard}>
              <ActivityIndicator size="large" color="#0F4C5C" />
              <Text style={styles.aiLoadingTitle}>🤖 AI analyserar fotot...</Text>
              <Text style={styles.aiLoadingSubtitle}>Kräver minst 75% match för att godkännas</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C', // Djup mörk bakgrund
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1E',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  cancelGameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelGameBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapToggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
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
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomSwitchBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  gridBadge: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#131316',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F24',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  progressBold: {
    fontWeight: '700',
    color: '#10B981',
  },
  statusText: {
    fontSize: 13,
    color: '#10B981',
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
  lobbyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  lobbyNoticeTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  lobbyNoticeSub: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 1,
  },
  startNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F4C5C',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  startNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#27272A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  scrollContent: {
    padding: GRID_PADDING,
    paddingBottom: 70,
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
    borderRadius: 20, // Rundade hörn
    overflow: 'hidden',
    position: 'relative',
  },
  tileEmpty: {
    backgroundColor: '#EDEDED', // Offwhite i rutan
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileNear: {
    borderWidth: 2.5,
    borderColor: '#10B981', // Grön markering när man är inom 50m!
    backgroundColor: '#F0FDF4',
  },
  distancePill: {
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E4E4E7',
  },
  distancePillNear: {
    backgroundColor: '#DCFCE7',
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525B',
  },
  distanceTextNear: {
    color: '#15803D',
  },
  tileCompleted: {
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tileBlocked: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tileQueued: {
    backgroundColor: '#27272A',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D97706',
    overflow: 'hidden',
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    width: '100%',
  },
  tileLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#18181B', // Tydlig mörk text mot offwhite
    textAlign: 'center',
    lineHeight: 16,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tileCompletedLabel: {
    color: '#F4F4F6', // Offwhite/vit text
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tileBlockedLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
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
    backgroundColor: '#18181B',
  },
  myTeamBadge: {
    backgroundColor: '#27272A',
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 12,
    color: '#E4E4E7',
    fontWeight: '600',
  },
  teamScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: '#451A03',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modeBadgeText: {
    fontSize: 11,
    color: '#FDE68A',
    fontWeight: '700',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 350,
    borderRadius: 16,
  },
  previewLabel: {
    color: '#F4F4F6',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  previewCloseBtn: {
    marginTop: 16,
    backgroundColor: '#27272A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  previewCloseText: {
    color: '#F4F4F6',
    fontWeight: '700',
    fontSize: 14,
  },
  aiLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  aiLoadingCard: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  aiLoadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4F4F6',
    marginTop: 14,
  },
  aiLoadingSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 6,
    fontWeight: '500',
  },
});
