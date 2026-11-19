import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Game, GameItem, GamePhing } from '../api';

interface GameReviewModalProps {
  visible: boolean;
  game: Game | null;
  items: GameItem[];
  phings: GamePhing[];
  currentUserId: number;
  onClose: () => void;
}

export default function GameReviewModal({
  visible,
  game,
  items,
  phings,
  currentUserId,
  onClose,
}: GameReviewModalProps) {
  if (!game) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tävlingens foton ({phings.length})</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {phings.length === 0 ? (
            <View style={styles.emptyBox}>
              <FontAwesome6 name="images" size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Inga foton tagna än</Text>
              <Text style={styles.emptySub}>När någon erövrar en ruta med kameran dyker fotot upp här!</Text>
            </View>
          ) : (
            phings.map(phing => {
              const item = items.find(it => it.tile_index === phing.tile_index);
              const label = item?.label || `Mål ${phing.tile_index + 1}`;
              const emoji = item?.emoji || '🎯';
              const isMine = phing.user_id === currentUserId;

              return (
                <View key={`phing-${phing.id}`} style={styles.card}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.authorRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(phing.user_name || 'Spelare').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.authorName}>
                          {phing.user_name || 'Spelare'} {isMine && '(Du)'}
                          {phing.team_name ? ` • ${phing.team_name}` : ''}
                        </Text>
                        <Text style={styles.tileTarget}>{label}</Text>
                      </View>
                    </View>
                    <View style={styles.approvedBadge}>
                      <Text style={styles.approvedBadgeText}>✓ Godkänd</Text>
                    </View>
                  </View>

                  {/* Photo */}
                  <Image source={{ uri: phing.photo_thumb }} style={styles.photo} />

                  {/* AI Bedömning (Ingen röstning behövs) */}
                  <View style={styles.aiBadgeRow}>
                    <View style={styles.aiScoreBadge}>
                      <FontAwesome6 name="robot" size={12} color="#0F4C5C" />
                      <Text style={styles.aiScoreBadgeText}>
                        {phing.ai_score !== undefined && phing.ai_score !== null
                          ? `${phing.ai_score}% match`
                          : 'AI Godkänd'}
                      </Text>
                    </View>
                    {Boolean(phing.ai_reason) && (
                      <Text style={styles.aiReasonText}>
                        "{phing.ai_reason}"
                      </Text>
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
    color: '#374151',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 13,
    color: '#0F4C5C',
    fontWeight: '600',
    marginTop: 1,
  },
  approvedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approvedBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  photo: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  aiBadgeRow: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  aiScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiScoreBadgeText: {
    color: '#0369A1',
    fontWeight: '700',
    fontSize: 12,
  },
  aiReasonText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
