/**
 * Tela Gerenciar Caixinhas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, Trash2, Pencil, Share2 } from 'lucide-react-native';
import { BoxShareModal } from '@/components/boxes/BoxShareModal';
import { useNavigation } from '@react-navigation/native';
import { useBoxes } from '@/hooks/useBoxes';
import { useToast } from '@/context/ToastContext';
import { Button, Modal, Input } from '@/components/common';
import { colors, typography, spacing, elevation } from '@/theme';
import { BoxBadge } from '@/components/notes/BoxBadge';

export const BoxesManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { boxes, loading, create, update, remove } = useBoxes();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [selectedBoxName, setSelectedBoxName] = useState('');
  const [newBoxName, setNewBoxName] = useState('');
  const [renameBoxName, setRenameBoxName] = useState('');

  const handleCreateBox = async () => {
    if (!newBoxName.trim()) {
      showToast('Nome da caixinha é obrigatório', 'warning');
      return;
    }

    try {
      await create({ name: newBoxName.trim() });
      setNewBoxName('');
      setShowCreateModal(false);
      showToast('Caixinha criada!', 'success');
    } catch (error: any) {
      showToast('Erro ao criar caixinha', 'error');
    }
  };

  const handleRenameBox = async () => {
    if (!selectedBox || !renameBoxName.trim()) {
      return;
    }

    try {
      await update(selectedBox, { name: renameBoxName.trim() });
      setRenameBoxName('');
      setSelectedBox(null);
      setShowRenameModal(false);
      showToast('Caixinha renomeada!', 'success');
    } catch (error: any) {
      showToast('Erro ao renomear caixinha', 'error');
    }
  };

  const handleDeleteBox = (box: { id: string; name: string; note_count: number }) => {
    if (box.note_count > 0) {
      Alert.alert(
        `Excluir "${box.name}"?`,
        `Esta caixinha tem ${box.note_count} notas. O que fazer com elas?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Mover para Inbox',
            onPress: async () => {
              try {
                await remove(box.id);
                showToast('Caixinha excluída', 'success');
              } catch (error: any) {
                showToast('Erro ao excluir caixinha', 'error');
              }
            },
          },
          {
            text: 'Excluir tudo',
            style: 'destructive',
            onPress: async () => {
              try {
                await remove(box.id);
                showToast('Caixinha e notas excluídas', 'success');
              } catch (error: any) {
                showToast('Erro ao excluir', 'error');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(`Excluir "${box.name}"?`, 'Esta ação não pode ser desfeita.', [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(box.id);
              showToast('Caixinha excluída', 'success');
            } catch (error: any) {
              showToast('Erro ao excluir caixinha', 'error');
            }
          },
        },
      ]);
    }
  };

  const openRenameModal = (box: { id: string; name: string }) => {
    setSelectedBox(box.id);
    setRenameBoxName(box.name);
    setShowRenameModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caixinhas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {boxes.map((box) => (
          <View key={box.id} style={[styles.boxCard, elevation[1]]}>
            <View style={styles.boxContent}>
              <BoxBadge name={box.name} color={box.color} />
              <Text style={styles.boxName}>{box.name}</Text>
              <Text style={styles.boxCount}>{box.note_count} notas</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                // TODO: Abrir menu de ações
                Alert.alert(
                  box.name,
                  'Escolha uma ação',
                  [
                    {
                      text: 'Compartilhar',
                      onPress: () => {
                        setSelectedBox(box.id);
                        setSelectedBoxName(box.name);
                        setShowShareModal(true);
                      },
                    },
                    {
                      text: 'Renomear',
                      onPress: () => openRenameModal(box),
                    },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: () => handleDeleteBox(box),
                    },
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                  ]
                );
              }}
            >
              <MoreVertical size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}

        <Button
          title="+ Criar nova caixinha"
          onPress={() => setShowCreateModal(true)}
          variant="secondary"
          style={styles.createButton}
        />
      </ScrollView>

      {/* Modal Criar Caixinha */}
      <Modal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewBoxName('');
        }}
      >
        <Text style={styles.modalTitle}>Nova caixinha</Text>
        <Input
          placeholder="Nome da caixinha"
          value={newBoxName}
          onChangeText={setNewBoxName}
          autoFocus
        />
        <View style={styles.modalActions}>
          <Button
            title="Cancelar"
            onPress={() => {
              setShowCreateModal(false);
              setNewBoxName('');
            }}
            variant="secondary"
            style={styles.modalButton}
          />
          <Button
            title="Criar"
            onPress={handleCreateBox}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Modal Renomear Caixinha */}
      <Modal
        visible={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameBoxName('');
          setSelectedBox(null);
        }}
      >
        <Text style={styles.modalTitle}>Renomear caixinha</Text>
        <Input
          placeholder="Nome da caixinha"
          value={renameBoxName}
          onChangeText={setRenameBoxName}
          autoFocus
        />
        <View style={styles.modalActions}>
          <Button
            title="Cancelar"
            onPress={() => {
              setShowRenameModal(false);
              setRenameBoxName('');
              setSelectedBox(null);
            }}
            variant="secondary"
            style={styles.modalButton}
          />
          <Button
            title="Salvar"
            onPress={handleRenameBox}
            style={styles.modalButton}
          />
        </View>
          </Modal>

      {/* Modal Compartilhar Caixinha */}
      {selectedBox && (
        <BoxShareModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedBox(null);
            setSelectedBoxName('');
          }}
          boxId={selectedBox}
          boxName={selectedBoxName}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  headerTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  boxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  boxContent: {
    flex: 1,
  },
  boxName: {
    ...typography.title3,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  boxCount: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  menuButton: {
    padding: spacing[2],
  },
  createButton: {
    marginTop: spacing[6],
  },
  modalTitle: {
    ...typography.title2,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  modalButton: {
    flex: 1,
  },
});


