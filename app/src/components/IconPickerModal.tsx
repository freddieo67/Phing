import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MAP_ICONS, MapIconItem } from '../mapIcons';

interface IconPickerModalProps {
  visible: boolean;
  selectedIcon: string;
  onSelectIcon: (emoji: string) => void;
  onClose: () => void;
}

export default function IconPickerModal({
  visible,
  selectedIcon,
  onSelectIcon,
  onClose,
}: IconPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Välj din spelar-ikon</Text>
              <Text style={styles.headerSubtitle}>
                Denna ikon visas på kartan och för dina medspelare
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Nuvarande ikon */}
          <View style={styles.currentSection}>
            <View style={styles.currentIconCircle}>
              <Text style={styles.currentIconEmoji}>{selectedIcon}</Text>
            </View>
            <Text style={styles.currentText}>Din aktiva ikon</Text>
          </View>

          {/* Rutnät med ikoner */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {MAP_ICONS.map((item: MapIconItem) => {
                const isSelected = selectedIcon === item.emoji;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.iconCard, isSelected && styles.iconCardActive]}
                    onPress={() => {
                      onSelectIcon(item.emoji);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.iconEmoji}>{item.emoji}</Text>
                    <Text style={[styles.iconLabel, isSelected && styles.iconLabelActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <FontAwesome6 name="check" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  currentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    gap: 12,
  },
  currentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F4C5C',
  },
  currentIconEmoji: {
    fontSize: 26,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4C5C',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  iconCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  iconCardActive: {
    borderColor: '#0F4C5C',
    backgroundColor: '#E6FFFA',
  },
  iconEmoji: {
    fontSize: 28,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  iconLabelActive: {
    color: '#0F4C5C',
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
