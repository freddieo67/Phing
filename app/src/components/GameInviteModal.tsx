import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Game } from '../api';

interface GameInviteModalProps {
  game: Game | null;
  loading?: boolean;
  onAccept: (game: Game) => void;
  onDecline: (game: Game) => void;
}

export default function GameInviteModal({
  game,
  loading = false,
  onAccept,
  onDecline,
}: GameInviteModalProps) {
  if (!game) return null;

  const totalTiles = (game.rows || 3) * (game.cols || 3);
  const isBlockMode = game.game_mode === 'block';
  const isTeamGame = Boolean(game.is_team_game);

  return (
    <Modal visible={Boolean(game)} transparent animationType="fade" onRequestClose={() => onDecline(game)}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Badge icon */}
          <View style={styles.iconCircle}>
            <FontAwesome6 name="bullseye" size={26} color="#10B981" />
          </View>

          {/* Heading */}
          <Text style={styles.invitationTag}>FOTOUTMANING</Text>
          <Text style={styles.hostSubtitle}>
            <Text style={styles.hostName}>{game.host_name || 'En vän'}</Text> bjuder in dig till en match:
          </Text>
          <Text style={styles.gameTitle} numberOfLines={2}>
            {game.title}
          </Text>

          {/* Details Chips */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format:</Text>
              <Text style={styles.detailValue}>{game.grid_size} ({totalTiles} rutor)</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Spelläge:</Text>
              <Text style={styles.detailValue}>
                {isBlockMode ? 'Revirkamp (Blockering)' : 'Klassisk'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tidsgräns:</Text>
              <Text style={styles.detailValue}>{game.duration_minutes} minuter</Text>
            </View>

            {isTeamGame && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ditt lag:</Text>
                <View style={styles.teamTag}>
                  {game.team_color && (
                    <View style={[styles.teamDot, { backgroundColor: game.team_color }]} />
                  )}
                  <Text style={[styles.detailValue, game.team_color ? { color: game.team_color, fontWeight: '700' } : null]}>
                    {game.team_name || 'Tilldelat lag'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => onDecline(game)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.declineBtnText}>Avböj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(game)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptBtnText}>Gå med i matchen</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#16161A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26262B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  invitationTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  hostSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 6,
  },
  hostName: {
    fontWeight: '700',
    color: '#F4F4F6',
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 28,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#1C1C22',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#F4F4F6',
    fontWeight: '600',
  },
  teamTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
