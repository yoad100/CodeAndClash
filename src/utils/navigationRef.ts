import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

// A global navigation ref to allow navigation from outside React components (e.g., MobX stores)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
