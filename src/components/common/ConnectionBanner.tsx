import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { socketService } from '../../services/socket.service';

const ConnectionBannerInner: React.FC = () => {
  const [queued, setQueued] = useState(0);
  const [message, setMessage] = useState('');
  const { uiStore } = rootStore;

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const count = await socketService.getQueuedCount();
      if (mounted) setQueued(count);
    };

    refresh();
    const iv = setInterval(refresh, 1000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    setMessage(uiStore.connectionStatus === 'reconnecting' ? 'Reconnecting…' : 'Offline — answers will be queued');
  }, [uiStore.connectionStatus]);


  if (uiStore.connectionStatus === 'connected') return null;
  

  const nextIn = socketService.getNextReconnectInMs ? socketService.getNextReconnectInMs() : null;
  return (
    <TouchableOpacity style={styles.container} onPress={() => rootStore.uiStore.showQueuedModal()}>
      <Text style={styles.text}>{message}</Text>
      {nextIn !== null && nextIn > 0 && (
        <Text style={styles.queue}>Retry in {Math.ceil(nextIn / 1000)}s</Text>
      )}
      {queued > 0 && <Text style={styles.queue}>Queued: {queued}</Text>}
    </TouchableOpacity>
  );
};

export const ConnectionBanner = observer(ConnectionBannerInner);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: { color: COLORS.white, fontWeight: '600' },
  queue: { color: COLORS.white, marginLeft: 12 },
});
