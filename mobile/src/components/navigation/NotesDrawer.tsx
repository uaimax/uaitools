/**
 * Sidebar (Navigation Drawer) para interface de notas
 * Estilo Google Keep com navegação e filtros
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  X,
  FileText,
  Folder,
  Archive,
  Trash2,
  Settings,
  Plus,
  MoreVertical,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBoxes } from '@/hooks/useBoxes';
import { useAuth } from '@/context/AuthContext';
import { BoxBadge } from '@/components/notes/BoxBadge';
import { BoxShareModal } from '@/components/boxes/BoxShareModal';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import { BoxQuickActions } from '@/components/boxes/BoxQuickActions';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

export type DrawerFilterType = 'all' | 'audio' | 'text' | 'checklist' | 'reminders' | 'archived' | 'trash' | 'box';

interface NotesDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: DrawerFilterType;
  activeBoxId?: string | null;
  onFilterChange: (filter: DrawerFilterType, boxId?: string | null) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  visible,
  onClose,
  activeFilter,
  activeBoxId,
  onFilterChange,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { boxes, create } = useBoxes();
  const { user } = useAuth();
  const [selectedBoxForActions, setSelectedBoxForActions] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  // Animação: drawer entra da direita (como Google Keep)
  const slideAnim = React.useRef(new Animated.Value(DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleFilterSelect = (filter: DrawerFilterType, boxId?: string | null) => {
    onFilterChange(filter, boxId);
    onClose();
  };

  const handleBoxSelect = (boxId: string) => {
    handleFilterSelect('box', boxId);
  };

  const handleBoxActions = (boxId: string) => {
    setSelectedBoxForActions(boxId);
    setShowQuickActions(true);
  };

  const handleCreateBox = async () => {
    // TODO: Abrir modal de criação de caixinha
    // Por enquanto, apenas navega para gerenciamento
    navigation.navigate('BoxesManagement');
    onClose();
  };

  const selectedBox = boxes.find((b) => b.id === selectedBoxForActions);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Overlay escuro - ocupa toda a tela */}
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Drawer - posicionado à direita */}
          <Animated.View
            style={[
              styles.drawer,
              styles.drawerRight,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <SafeAreaView style={styles.drawerContent} edges={['top', 'right', 'bottom']}>
              {/* Header do Drawer */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerHeaderContent}>
                  <Text style={styles.drawerTitle}>SupBrainNote</Text>
                  {user?.email && (
                    <Text style={styles.drawerSubtitle}>{user.email}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                {/* Item: Todas as notas */}
                <DrawerItem
                  icon={FileText}
                  label="Todas as notas"
                  active={activeFilter === 'all'}
                  onPress={() => handleFilterSelect('all')}
                />

                {/* Divisor */}
                <View style={styles.divider} />

                {/* Caixinhas */}
                <Text style={styles.sectionTitle}>CAIXINHAS</Text>
                {boxes.map((box) => (
                  <BoxDrawerItem
                    key={box.id}
                    box={box}
                    active={activeFilter === 'box' && activeBoxId === box.id}
                    onPress={() => handleBoxSelect(box.id)}
                    onActions={() => handleBoxActions(box.id)}
                  />
                ))}
                <TouchableOpacity
                  style={styles.createBoxButton}
                  onPress={handleCreateBox}
                >
                  <Plus size={16} color={colors.primary.default} />
                  <Text style={styles.createBoxText}>Criar caixinha</Text>
                </TouchableOpacity>

                {/* Divisor */}
                <View style={styles.divider} />

                {/* Item: Arquivados */}
                <DrawerItem
                  icon={Archive}
                  label="Arquivados"
                  active={activeFilter === 'archived'}
                  onPress={() => handleFilterSelect('archived')}
                />

                {/* Item: Lixeira */}
                <DrawerItem
                  icon={Trash2}
                  label="Lixeira"
                  active={activeFilter === 'trash'}
                  onPress={() => handleFilterSelect('trash')}
                />

                {/* Divisor */}
                <View style={styles.divider} />

                {/* Item: Configurações */}
                <DrawerItem
                  icon={Settings}
                  label="Configurações"
                  active={false}
                  onPress={() => {
                    navigation.navigate('Settings');
                    onClose();
                  }}
                />
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal de Compartilhamento */}
      {selectedBox && (
        <BoxShareModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedBoxForActions(null);
          }}
          boxId={selectedBox.id}
          boxName={selectedBox.name}
        />
      )}

      {/* Quick Actions */}
      {selectedBoxForActions && (
        <BoxQuickActions
          visible={showQuickActions}
          boxId={selectedBoxForActions}
          boxName={selectedBox?.name || ''}
          onClose={() => {
            setShowQuickActions(false);
            setSelectedBoxForActions(null);
          }}
          onShare={() => {
            setShowQuickActions(false);
            setShowShareModal(true);
          }}
          onEdit={() => {
            setShowQuickActions(false);
            navigation.navigate('BoxesManagement');
            setSelectedBoxForActions(null);
            onClose();
          }}
        />
      )}
    </>
  );
};

// Componente auxiliar para itens do drawer
interface DrawerItemProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  active: boolean;
  onPress: () => void;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon: Icon, label, active, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.drawerItem, active && styles.drawerItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        size={20}
        color={active ? colors.primary.default : colors.text.secondary}
      />
      <Text
        style={[
          styles.drawerItemText,
          active && styles.drawerItemTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Componente para item de caixinha no drawer
interface BoxDrawerItemProps {
  box: { id: string; name: string; color: string | null; note_count: number };
  active: boolean;
  onPress: () => void;
  onActions: () => void;
}

const BoxDrawerItem: React.FC<BoxDrawerItemProps> = ({
  box,
  active,
  onPress,
  onActions,
}) => {
  return (
    <TouchableOpacity
      style={[styles.boxDrawerItem, active && styles.boxDrawerItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <BoxBadge name={box.name} color={box.color} />
      <View style={styles.boxDrawerItemContent}>
        <Text
          style={[
            styles.boxDrawerItemText,
            active && styles.boxDrawerItemTextActive,
          ]}
        >
          {box.name}
        </Text>
        <Text style={styles.boxDrawerItemCount}>
          {box.note_count} {box.note_count === 1 ? 'nota' : 'notas'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onActions();
        }}
        style={styles.boxDrawerItemActions}
      >
        <MoreVertical size={16} color={colors.text.tertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.bg.elevated,
    ...elevation[3],
  },
  drawerRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 120,
  },
  drawerHeaderContent: {
    flex: 1,
  },
  drawerTitle: {
    ...typography.headline6,
    color: colors.text.primary,
    fontWeight: '600',
  },
  drawerSubtitle: {
    ...typography.bodySmall,
    color: `${colors.text.secondary}99`,
    marginTop: spacing[1],
  },
  closeButton: {
    padding: spacing[1],
  },
  drawerScroll: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  drawerItemActive: {
    backgroundColor: `${colors.primary.default}15`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
  },
  drawerItemText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  drawerItemTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: spacing[2],
    marginHorizontal: spacing[4],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    fontWeight: '600',
  },
  boxDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  boxDrawerItemActive: {
    backgroundColor: `${colors.primary.default}15`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
  },
  boxDrawerItemContent: {
    flex: 1,
  },
  boxDrawerItemText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  boxDrawerItemTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  boxDrawerItemCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  boxDrawerItemActions: {
    padding: spacing[1],
  },
  createBoxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  createBoxText: {
    ...typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '500',
  },
});

