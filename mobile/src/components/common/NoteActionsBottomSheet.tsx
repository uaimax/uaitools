/**
 * NoteActionsBottomSheet - Bottom sheet com ações para nota
 * Aparece no long press de um NoteCard
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, FolderInput, Share2, Archive, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, elevation } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NoteActionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMove: () => void;
  onShare: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export const NoteActionsBottomSheet: React.FC<NoteActionsBottomSheetProps> = ({
  visible,
  onClose,
  onEdit,
  onMove,
  onShare,
  onArchive,
  onDelete,
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
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
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay escuro */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.overlayContent,
              {
                opacity: opacityAnim,
              },
            ]}
          />
        </TouchableOpacity>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Ações */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onEdit)}
                activeOpacity={0.7}
              >
                <Pencil size={24} color={colors.text.primary} />
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onMove)}
                activeOpacity={0.7}
              >
                <FolderInput size={24} color={colors.text.primary} />
                <Text style={styles.actionText}>Mover para caixinha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onShare)}
                activeOpacity={0.7}
              >
                <Share2 size={24} color={colors.text.primary} />
                <Text style={styles.actionText}>Compartilhar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onArchive)}
                activeOpacity={0.7}
              >
                <Archive size={24} color={colors.text.primary} />
                <Text style={styles.actionText}>Arquivar</Text>
              </TouchableOpacity>

              {/* Divisor */}
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onDelete)}
                activeOpacity={0.7}
              >
                <Trash2 size={24} color={colors.semantic.error} />
                <Text style={[styles.actionText, styles.actionTextDanger]}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...elevation[3],
  },
  safeArea: {
    paddingBottom: spacing[4],
  },
  handleBar: {
    width: 32,
    height: 4,
    backgroundColor: colors.text.tertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
    opacity: 0.4,
  },
  actions: {
    paddingHorizontal: spacing[4],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    minHeight: 56,
  },
  actionText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  actionTextDanger: {
    color: colors.semantic.error,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: spacing[2],
  },
});

