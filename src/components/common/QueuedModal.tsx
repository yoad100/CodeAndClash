import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert } from 'react-native';
import { COLORS } from '../../constants/colors';
import { socketService } from '../../services/socket.service';
import { rootStore } from '../../stores/RootStore';

export const QueuedModal: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const { uiStore } = rootStore;

  const refresh = async () => {
    const q = await socketService.getQueuedItems();
    setItems(q);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (index: number) => {
    const q = await socketService.getQueuedItems();
    const item = q[index];
    if (!item) return;
    await socketService.removeQueuedItem(index);
    // show undo via app toast
    uiStore.showToast('Removed queued answer', 'info', 5000, 'Undo', async () => {
      await socketService.insertQueuedItem(item, index);
      await refresh();
    });
    await refresh();
  };

  const clear = async () => {
    Alert.alert('Clear queued answers', 'Clear all queued answers? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await socketService.clearQueue(); await refresh(); } },
    ]);
  };

  return (
    <Modal visible={uiStore.queuedModalVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Queued Answers</Text>
          <FlatList
            data={items}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>Q#{item.questionIndex + 1} — Choice {item.answerIndex + 1}</Text>
                <TouchableOpacity onPress={() => remove(index)} style={styles.removeBtn} accessibilityRole="button" accessibilityLabel={`Remove queued answer ${index + 1}`}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Undo is handled via app-level toast action */}

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => uiStore.hideQueuedModal()} style={styles.btn}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clear} style={[styles.btn, styles.danger]}>
              <Text style={[styles.btnText]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', maxHeight: '80%', backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemText: { color: COLORS.text },
  removeBtn: { padding: 8 },
  removeText: { color: COLORS.error },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btn: { padding: 10, borderRadius: 8, backgroundColor: COLORS.primary },
  danger: { backgroundColor: COLORS.error },
  btnText: { color: COLORS.white, fontWeight: '700' },
  // undo handled via app-level toast
});
