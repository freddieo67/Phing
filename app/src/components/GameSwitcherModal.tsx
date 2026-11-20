import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Game } from '../api';

function formatTimeLeft(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Avslutad';
  const mins = Math.ceil(diffMs / 60_000);
  if (mins >= 10080) return `${Math.round(mins / 10080)} vecka kvar`;
  if (mins >= 1440) return `${Math.round(mins / 1440)} ${Math.round(mins / 1440) === 1 ? 'dag' : 'dagar'} kvar`;
  if (mins >= 60) return `${Math.round(mins / 60)} tim kvar`;
  return `${mins} min kvar`;
}

interface GameSwitcherModalProps {
  visible: boolean;
  games: Game[];
  activeGameId: number | null;
  currentUserId: number;
  onSelectGame: (gameId: number) => void;
  onCreateNewGame: () => void;
  onClose: () => void;
}

export default function GameSwitcherModal({
  visible,
  games,
  activeGameId,
  currentUserId,
  onSelectGame,
  onCreateNewGame,
  onClose,
}: GameSwitcherModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mina utmaningar</Text>
              <Text style={styles.subtitle}>
                {games.length === 1 ? '1 aktivt spel' : `${games.length} aktiva spel`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome6 name="xmark" size={16} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Spellista */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {games.map(game => {
              const isSelected = game.id === activeGameId;
              const isHost = game.host_id === currentUserId;
              const totalTiles = (game.rows || 3) * (game.cols || 3);
              const isBlock = game.game_mode === 'block';

              return (
                <TouchableOpacity
                  key={`game-item-${game.id}`}
                  style={[styles.gameCard, isSelected && styles.gameCardSelected]}
                  onPress={() => {
                    onSelectGame(game.id);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {game.title}
                      </Text>
                      {isSelected && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Aktiv nu</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardHost}>
                      {isHost ? '👑 Du är spelledare' : `Spelledare: ${game.host_name || 'Vän'}`}
                    </Text>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.pill}>
                      <FontAwesome6 name="table-cells" size={11} color="#A1A1AA" />
                      <Text style={styles.pillText}>{game.grid_size} ({totalTiles} rutor)</Text>
                    </View>

                    <View style={styles.pill}>
                      <FontAwesome6 name="clock" size={11} color="#A1A1AA" />
                      <Text style={styles.pillText}>{formatTimeLeft(game.expires_at)}</Text>
                    </View>

                    {isBlock && (
                      <View style={[styles.pill, styles.blockPill]}>
                        <FontAwesome6 name="shield-halved" size={11} color="#EF4444" />
                        <Text style={[styles.pillText, { color: '#EF4444' }]}>Dominans</Text>
                      </View>
                    )}

                    {game.is_team_game && (
                      <View style={[styles.pill, styles.teamPill]}>
                        <FontAwesome6 name="people-group" size={11} color="#3B82F6" />
                        <Text style={[styles.pillText, { color: '#3B82F6' }]}>Lagspel</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer: Skapa nytt spel */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.newGameBtn}
              onPress={() => {
                onClose();
                onCreateNewGame();
              }}
              activeOpacity={0.85}
            >
              <FontAwesome6 name="plus" size={15} color="#FFFFFF" />
              <Text style={styles.newGameBtnText}>Starta ytterligare ett spel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#27272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    maxHeight: 380,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#27272A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#3F3F46',
  },
  gameCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#1C2E2A',
  },
  cardTop: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardHost: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#18181B',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  blockPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  teamPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  pillText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  newGameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F4C5C',
    borderRadius: 14,
    paddingVertical: 14,
  },
  newGameBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
