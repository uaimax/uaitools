/**
 * Componente de ações rápidas para caixinhas
 * Menu contextual com editar, compartilhar, excluir
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Edit, Share2, Trash2, X } from 'lucide-react-native';
import { useBoxes } from '@/hooks/useBoxes';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing, elevation } from '@/theme';

interface BoxQuickActionsProps {
  visible: boolean;
  boxId: string;
  boxName: string;
  onClose: () => void;
  onShare: () => void;
  onEdit: () => void;
}

export const BoxQuickActions: React.FC<BoxQuickActionsProps> = ({
  visible,
  boxId,
  boxName,
  onClose,
  onShare,
  onEdit,
}) => {
  const { remove } = useBoxes();
  const { showToast } = useToast();

  const handleDelete = () => {
    Alert.alert(
      `Excluir "${boxName}"?`,
      'Esta ação não pode ser desfeita. As notas serão movidas para Inbox.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(boxId);
              showToast('Caixinha excluída', 'success');
              onClose();
            } catch (error: any) {
              showToast('Erro ao excluir caixinha', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.content}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{boxName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  onEdit();
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.primary.default}20` }]}>
                  <Edit size={20} color={colors.primary.default} />
                </View>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  onShare();
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.primary.default}20` }]}>
                  <Share2 size={20} color={colors.primary.default} />
                </View>
                <Text style={styles.actionText}>Compartilhar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleDelete}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.semantic.error}20` }]}>
                  <Trash2 size={20} color={colors.semantic.error} />
                </View>
                <Text style={[styles.actionText, styles.actionTextDanger]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 320,
  },
  content: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: spacing[4],
    ...elevation[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.title3,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing[1],
  },
  actions: {
    gap: spacing[2],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  actionTextDanger: {
    color: colors.semantic.error,
  },
});

