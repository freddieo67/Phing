import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { api, Game, GameItem, GamePhing } from '../api';
import i18n from '../i18n';

interface GameReviewModalProps {
  visible: boolean;
  game: Game | null;
  items: GameItem[];
  phings: GamePhing[];
  currentUserId: number;
  onClose: () => void;
  onVoteSuccess?: () => void;
}

export default function GameReviewModal({
  visible,
  game,
  items,
  phings,
  currentUserId,
  onClose,
  onVoteSuccess,
}: GameReviewModalProps) {
  const [votingPhingId, setVotingPhingId] = useState<number | null>(null);

  if (!game) return null;

  const handleVote = async (phingId: number, vote: 'approve' | 'reject') => {
    setVotingPhingId(phingId);
    try {
      await api.voteGamePhing(game.id, phingId, currentUserId, vote);
      if (onVoteSuccess) onVoteSuccess();
    } catch (e) {
      console.warn('Kunde inte rösta:', e);
      Alert.alert(i18n.t('error'), 'Kunde inte registrera din röst.');
    } finally {
      setVotingPhingId(null);
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
          <Text style={styles.headerTitle}>Deltagarnas foton ({phings.length})</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {phings.length === 0 ? (
            <View style={styles.emptyBox}>
              <FontAwesome6 name="images" size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Inga foton tagna än</Text>
              <Text style={styles.emptySub}>När någon fotograferar ett föremål dyker bilden upp här för granskning!</Text>
            </View>
          ) : (
            phings.map(phing => {
              const item = items.find(it => it.tile_index === phing.tile_index);
              const label = item?.label || `Mål ${phing.tile_index + 1}`;
              const isMine = phing.user_id === currentUserId;
              const isVoting = votingPhingId === phing.id;

              return (
                <View key={`phing-${phing.id}`} style={styles.card}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.authorRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(phing.user_name || 'Spelare').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.authorName}>{phing.user_name || 'Spelare'} {isMine && '(Du)'}</Text>
                        <Text style={styles.tileTarget}>Mål: {label}</Text>
                      </View>
                    </View>
                    {phing.status === 'rejected' && (
                      <View style={styles.rejectedBadge}>
                        <Text style={styles.rejectedBadgeText}>Underkänd</Text>
                      </View>
                    )}
                  </View>

                  {/* Photo */}
                  <Image source={{ uri: phing.photo_thumb }} style={styles.photo} />

                  {/* Actions / Votes */}
                  <View style={styles.actionsRow}>
                    <View style={styles.voteSummary}>
                      <Text style={styles.voteText}>👍 {phing.approved_count}</Text>
                      <Text style={styles.voteText}>🚩 {phing.rejected_count}</Text>
                    </View>

                    {!isMine && (
                      <View style={styles.buttonsRow}>
                        <TouchableOpacity
                          style={[styles.voteBtn, styles.approveBtn]}
                          onPress={() => handleVote(phing.id, 'approve')}
                          disabled={isVoting}
                        >
                          <Text style={styles.approveBtnText}>👍 Godkänd</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.voteBtn, styles.rejectBtn]}
                          onPress={() => handleVote(phing.id, 'reject')}
                          disabled={isVoting}
                        >
                          <Text style={styles.rejectBtnText}>🚩 Protest</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  tileTarget: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rejectedBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  photo: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  voteSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approveBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
