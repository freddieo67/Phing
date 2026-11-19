import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { api, Game, GridSize, GameMode } from '../api';
import { AppContact } from './ContactsModal';
import { THEME_CATEGORIES, drawRandomTiles } from '../themes';
import i18n from '../i18n';

interface GameLobbyModalProps {
  visible: boolean;
  currentUserId: number;
  userIcon?: string;
  onOpenIconPicker?: () => void;
  invitedContacts: AppContact[];
  onClose: () => void;
  onOpenContacts: () => void;
  onRemoveContact: (userId: number) => void;
  onGameCreated: (game: Game) => void;
}

const GRID_OPTIONS: { id: GridSize; label: string; rows: number; total: number; desc: string }[] = [
  { id: '3x3', label: '3 × 3', rows: 3, total: 9, desc: 'Snabbmatch (9 rutor)' },
  { id: '3x5', label: '3 × 5', rows: 5, total: 15, desc: 'Mellanmatch (15 rutor)' },
  { id: '3x7', label: '3 × 7', rows: 7, total: 21, desc: 'Stortema / Fåglar (21 rutor)' },
];

const DURATION_OPTIONS = [30, 60, 180, 360, 1440];

export default function GameLobbyModal({
  visible,
  currentUserId,
  userIcon = '🦊',
  onOpenIconPicker,
  invitedContacts,
  onClose,
  onOpenContacts,
  onRemoveContact,
  onGameCreated,
}: GameLobbyModalProps) {
  const [title, setTitle] = useState('Phing Fotojakt');
  const [selectedCategory, setSelectedCategory] = useState<string>('city');
  const [selectedGrid, setSelectedGrid] = useState<GridSize>('3x3');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isTeamGame, setIsTeamGame] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('block');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Namn saknas', 'Ange ett namn för utmaningen.');
      return;
    }

    setCreating(true);
    try {
      const selectedOption = GRID_OPTIONS.find(o => o.id === selectedGrid) || GRID_OPTIONS[0];
      const drawnTiles = drawRandomTiles(selectedCategory, selectedOption.total);
      const items = drawnTiles.map(t => ({
        label: t.title,
        emoji: t.icon,
        hint: t.hint,
      }));

      const game = await api.createGame({
        host_id: currentUserId,
        title: title.trim(),
        grid_size: selectedGrid,
        duration_minutes: selectedDuration,
        is_team_game: isTeamGame,
        game_mode: gameMode,
        items,
        participant_ids: invitedContacts.map(c => c.userId),
      });

      onGameCreated(game);
    } catch (e) {
      console.warn('Kunde inte skapa spel:', e);
      Alert.alert(i18n.t('error'), 'Kunde inte starta spelet. Försök igen.');
    } finally {
      setCreating(false);
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
          <Text style={styles.headerTitle}>Skapa fotoutmaning</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Namn på tävling */}
          <Text style={styles.sectionLabel}>Tävlingens namn</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="T.ex. AW-jakten eller Stadssafari"
            maxLength={40}
          />

          {/* Din Spelar-ikon */}
          {onOpenIconPicker && (
            <>
              <Text style={styles.sectionLabel}>Din spelar-ikon</Text>
              <TouchableOpacity
                style={styles.playerIconCard}
                onPress={onOpenIconPicker}
                activeOpacity={0.8}
              >
                <View style={styles.playerIconCircle}>
                  <Text style={styles.playerIconEmoji}>{userIcon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerIconTitle}>Syns på kartan för alla i spelet</Text>
                  <Text style={styles.playerIconSubtitle}>Tryck här för att byta djur, fordon eller symbol</Text>
                </View>
                <Text style={styles.playerIconChangeText}>Ändra ›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Välj Tema / Kategori */}
          <Text style={styles.sectionLabel}>Välj Tema</Text>
          <View style={styles.categoriesContainer}>
            {THEME_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <View style={styles.categoryTextCol}>
                    <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}>
                      {cat.name}
                    </Text>
                    <Text style={styles.categoryDesc} numberOfLines={1}>
                      {cat.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.categoryCheckBadge}>
                      <FontAwesome6 name="check" size={11} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Speltyp: Solo vs Lagspel */}
          <Text style={styles.sectionLabel}>Speltyp</Text>
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, !isTeamGame && styles.segmentBtnActive]}
              onPress={() => setIsTeamGame(false)}
            >
              <FontAwesome6 name="user" size={14} color={!isTeamGame ? '#FFFFFF' : '#374151'} />
              <Text style={[styles.segmentBtnText, !isTeamGame && styles.segmentBtnTextActive]}>
                Solo (Alla mot alla)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, isTeamGame && styles.segmentBtnActive]}
              onPress={() => setIsTeamGame(true)}
            >
              <FontAwesome6 name="users" size={14} color={isTeamGame ? '#FFFFFF' : '#374151'} />
              <Text style={[styles.segmentBtnText, isTeamGame && styles.segmentBtnTextActive]}>
                Lagspel (Röd vs Blå)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Regler / Spelläge */}
          <Text style={styles.sectionLabel}>Regler för brickan</Text>
          <View style={styles.rulesContainer}>
            <TouchableOpacity
              style={[styles.ruleCard, gameMode === 'classic' && styles.ruleCardActive]}
              onPress={() => setGameMode('classic')}
            >
              <View style={styles.ruleCardHeader}>
                <FontAwesome6 name="table-cells" size={15} color={gameMode === 'classic' ? '#0F4C5C' : '#6B7280'} />
                <Text style={[styles.ruleCardTitle, gameMode === 'classic' && styles.ruleCardTitleActive]}>
                  Klassisk
                </Text>
              </View>
              <Text style={styles.ruleCardDesc}>
                Alla lag/spelare har sin egen bricka och försöker få full bricka först.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ruleCard, gameMode === 'block' && styles.ruleCardActive]}
              onPress={() => setGameMode('block')}
            >
              <View style={styles.ruleCardHeader}>
                <FontAwesome6 name="lock" size={15} color={gameMode === 'block' ? '#0F4C5C' : '#6B7280'} />
                <Text style={[styles.ruleCardTitle, gameMode === 'block' && styles.ruleCardTitleActive]}>
                  Revirkamp (Blockering) 🔥
                </Text>
              </View>
              <Text style={styles.ruleCardDesc}>
                När ett lag tar en ruta blockeras den för alla andra! "Winner takes it all" när omöjligt att komma ikapp!
              </Text>
            </TouchableOpacity>
          </View>

          {/* Format (3 per rad) */}
          <Text style={styles.sectionLabel}>Välj bingobricka (3 per rad)</Text>
          <View style={styles.gridOptionsContainer}>
            {GRID_OPTIONS.map(opt => {
              const isSelected = selectedGrid === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.gridOptionCard, isSelected && styles.gridOptionCardSelected]}
                  onPress={() => setSelectedGrid(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.gridOptionTitle, isSelected && styles.gridOptionTitleSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.gridOptionSub, isSelected && styles.gridOptionSubSelected]}>
                    {opt.total} rutor
                  </Text>
                  <Text style={[styles.gridOptionDesc, isSelected && styles.gridOptionDescSelected]}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spellängd */}
          <Text style={styles.sectionLabel}>Tidsgräns</Text>
          <View style={styles.durationsRow}>
            {DURATION_OPTIONS.map(dur => {
              const isSelected = selectedDuration === dur;
              const durText = dur >= 1440 ? `${dur / 1440} dygn` : dur >= 60 ? `${dur / 60} tim` : `${dur} min`;
              return (
                <TouchableOpacity
                  key={dur}
                  style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                  onPress={() => setSelectedDuration(dur)}
                >
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {durText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bjud in vänner */}
          <View style={styles.friendsHeader}>
            <Text style={styles.sectionLabel}>Bjud in vänner ({invitedContacts.length})</Text>
            <TouchableOpacity style={styles.addFriendsBtn} onPress={onOpenContacts}>
              <FontAwesome6 name="user-plus" size={13} color="#0F4C5C" />
              <Text style={styles.addFriendsText}>Välj vänner</Text>
            </TouchableOpacity>
          </View>

          {invitedContacts.length === 0 ? (
            <TouchableOpacity style={styles.emptyFriendsBox} onPress={onOpenContacts} activeOpacity={0.8}>
              <FontAwesome6 name="users" size={24} color="#9CA3AF" />
              <Text style={styles.emptyFriendsText}>Klicka här för att välja vänner ur din kontaktlista</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.invitedList}>
              {invitedContacts.map(c => (
                <View key={c.userId} style={styles.contactChip}>
                  <Text style={styles.contactChipName} numberOfLines={1}>{c.name}</Text>
                  <TouchableOpacity onPress={() => onRemoveContact(c.userId)} style={styles.removeContactBtn}>
                    <Text style={styles.removeContactText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Skapa-knapp */}
          <TouchableOpacity
            style={[styles.startBtn, creating && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={creating}
            activeOpacity={0.85}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startBtnText}>Starta utmaningen 🚀</Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  playerIconCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerIconEmoji: {
    fontSize: 24,
  },
  playerIconTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  playerIconSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  playerIconChangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4C5C',
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  categoryCardSelected: {
    borderColor: '#0F4C5C',
    backgroundColor: '#F0FDFA',
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  categoryTitleSelected: {
    color: '#0F4C5C',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  diffDescriptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#0F4C5C',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rulesContainer: {
    gap: 8,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  ruleCardActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#E8F4F6',
  },
  ruleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ruleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  ruleCardTitleActive: {
    color: '#0F4C5C',
  },
  ruleCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  gridOptionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  gridOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  gridOptionCardSelected: {
    borderColor: '#0F4C5C',
    backgroundColor: '#E8F4F6',
  },
  gridOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  gridOptionTitleSelected: {
    color: '#0F4C5C',
  },
  gridOptionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  gridOptionSubSelected: {
    color: '#0F4C5C',
  },
  gridOptionDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  gridOptionDescSelected: {
    color: '#0F4C5C',
  },
  durationsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: '#0F4C5C',
    borderColor: '#0F4C5C',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  addFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addFriendsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F4C5C',
  },
  emptyFriendsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFriendsText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  invitedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  contactChipName: {
    fontSize: 13,
    color: '#374151',
    maxWidth: 120,
  },
  removeContactBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeContactText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  startBtn: {
    backgroundColor: '#0F4C5C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
