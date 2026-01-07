/**
 * Modal para compartilhar caixinha
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { UserPlus, Eye, Edit, Trash2, Mail, X } from 'lucide-react-native';
import { Modal } from '@/components/common';
import { Input } from '@/components/common';
import { Button } from '@/components/common';
import { useBoxShare } from '@/hooks/useBoxShare';
import { colors, typography, spacing, elevation } from '@/theme';

interface BoxShareModalProps {
  visible: boolean;
  onClose: () => void;
  boxId: string;
  boxName: string;
}

export const BoxShareModal: React.FC<BoxShareModalProps> = ({
  visible,
  onClose,
  boxId,
  boxName,
}) => {
  const { shares, loading, loadShares, share, updatePermission, remove } =
    useBoxShare();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (visible && boxId) {
      loadShares(boxId);
    }
  }, [visible, boxId, loadShares]);

  const handleShare = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório.');
      return;
    }

    setIsAdding(true);
    try {
      await share({
        boxId,
        email: email.trim(),
        permission,
      });
      setEmail('');
      setPermission('read');
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdatePermission = async (
    shareId: string,
    newPermission: 'read' | 'write'
  ) => {
    try {
      await updatePermission(boxId, shareId, newPermission);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    Alert.alert(
      'Remover compartilhamento?',
      'Esta pessoa perderá o acesso a esta caixinha.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(boxId, shareId);
            } catch (error) {
              // Erro já tratado no hook
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={styles.title}>Compartilhar caixinha</Text>

      {/* Formulário para adicionar */}
      <View style={styles.addSection}>
        <View style={styles.addHeader}>
          <UserPlus size={16} color={colors.text.primary} />
          <Text style={styles.addHeaderText}>Adicionar pessoa</Text>
        </View>
        <Input
          placeholder="email@exemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.permissionButtons}>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              permission === 'read' && styles.permissionButtonActive,
            ]}
            onPress={() => setPermission('read')}
          >
            <Eye size={16} color={permission === 'read' ? colors.primary.default : colors.text.secondary} />
            <Text
              style={[
                styles.permissionButtonText,
                permission === 'read' && styles.permissionButtonTextActive,
              ]}
            >
              Leitura
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              permission === 'write' && styles.permissionButtonActive,
            ]}
            onPress={() => setPermission('write')}
          >
            <Edit size={16} color={permission === 'write' ? colors.primary.default : colors.text.secondary} />
            <Text
              style={[
                styles.permissionButtonText,
                permission === 'write' && styles.permissionButtonTextActive,
              ]}
            >
              Leitura e Escrita
            </Text>
          </TouchableOpacity>
        </View>
        <Button
          title={isAdding ? 'Compartilhando...' : 'Compartilhar'}
          onPress={handleShare}
          disabled={!email.trim() || isAdding}
        />
      </View>

      {/* Lista de compartilhamentos */}
      <View style={styles.sharesSection}>
        <Text style={styles.sharesTitle}>Pessoas com acesso</Text>
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : shares.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma pessoa compartilhada ainda.</Text>
        ) : (
          <ScrollView style={styles.sharesList}>
            {shares.map((shareItem) => (
              <View key={shareItem.id} style={styles.shareItem}>
                <View style={styles.shareContent}>
                  <View style={styles.shareIcon}>
                    <Mail size={20} color={colors.primary.default} />
                  </View>
                  <View style={styles.shareInfo}>
                    <Text style={styles.shareEmail}>
                      {shareItem.shared_with_email}
                    </Text>
                    <Text style={styles.shareStatus}>
                      {shareItem.status === 'pending'
                        ? 'Convite pendente'
                        : 'Acesso ativo'}
                    </Text>
                  </View>
                </View>
                <View style={styles.shareActions}>
                  <TouchableOpacity
                    style={[
                      styles.permissionButton,
                      shareItem.permission === 'read' &&
                        styles.permissionButtonActive,
                    ]}
                    onPress={() =>
                      handleUpdatePermission(
                        shareItem.id,
                        shareItem.permission === 'read' ? 'write' : 'read'
                      )
                    }
                  >
                    {shareItem.permission === 'read' ? (
                      <Eye size={14} color={colors.primary.default} />
                    ) : (
                      <Edit size={14} color={colors.primary.default} />
                    )}
                    <Text
                      style={[
                        styles.permissionButtonText,
                        shareItem.permission === 'read' &&
                          styles.permissionButtonTextActive,
                      ]}
                    >
                      {shareItem.permission === 'read' ? 'Leitura' : 'Escrita'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveShare(shareItem.id)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} color={colors.semantic.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.title2,
    color: colors.text.primary,
    marginBottom: spacing[6],
  },
  addSection: {
    backgroundColor: `${colors.primary.default}10`,
    borderRadius: 8,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  addHeaderText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  permissionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionButtonActive: {
    borderColor: colors.primary.default,
    backgroundColor: `${colors.primary.default}20`,
  },
  permissionButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  permissionButtonTextActive: {
    color: colors.primary.default,
    fontWeight: '600',
  },
  sharesSection: {
    marginTop: spacing[4],
  },
  sharesTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing[4],
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing[6],
  },
  sharesList: {
    maxHeight: 300,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    ...elevation[1],
  },
  shareContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareInfo: {
    flex: 1,
  },
  shareEmail: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.text.primary,
  },
  shareStatus: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  shareActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  removeButton: {
    padding: spacing[1],
  },
});

