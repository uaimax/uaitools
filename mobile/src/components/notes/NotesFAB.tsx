/**
 * FAB (Floating Action Button) para criação manual de notas
 * Aparece apenas na interface de notas, não na Home
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Plus, Type, CheckSquare, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface NotesFABProps {
  boxId?: string | null;
}

export const NotesFAB: React.FC<NotesFABProps> = ({ boxId }) => {
  const navigation = useNavigation<NavigationProp>();
  const [showOptions, setShowOptions] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showOptions) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showOptions, scaleAnim, opacityAnim]);

  const handleCreateText = () => {
    setShowOptions(false);
    // TODO: Navegar para criação de nota de texto
    // Por enquanto, apenas fecha o menu
    // navigation.navigate('NoteEdit', { noteId: 'new', type: 'text' });
  };

  const handleCreateChecklist = () => {
    setShowOptions(false);
    // TODO: Navegar para criação de checklist
    // Por enquanto, apenas fecha o menu
    // navigation.navigate('NoteEdit', { noteId: 'new', type: 'checklist' });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, elevation[3]]}
        onPress={() => setShowOptions(true)}
        activeOpacity={0.9}
      >
        <Plus size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="none"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <Animated.View
            style={[
              styles.optionsContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleCreateText}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${colors.primary.default}20` }]}>
                <Type size={20} color={colors.primary.default} />
              </View>
              <Text style={styles.optionText}>Texto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleCreateChecklist}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${colors.primary.default}20` }]}>
                <CheckSquare size={20} color={colors.primary.default} />
              </View>
              <Text style={styles.optionText}>Checklist</Text>
            </TouchableOpacity>

            {/* Placeholder para futuras opções */}
            {/* <TouchableOpacity style={styles.optionItem} disabled>
              <View style={[styles.optionIcon, styles.optionIconDisabled]}>
                <Image size={20} color={colors.text.tertiary} />
              </View>
              <Text style={[styles.optionText, styles.optionTextDisabled]}>Imagem</Text>
            </TouchableOpacity> */}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  optionsContainer: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[4],
    paddingBottom: spacing[6],
    ...elevation[3],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    borderRadius: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDisabled: {
    backgroundColor: colors.bg.base,
    opacity: 0.5,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  optionTextDisabled: {
    color: colors.text.tertiary,
  },
});

