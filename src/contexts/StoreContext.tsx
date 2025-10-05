import React, { createContext, useContext, ReactNode } from 'react';
import { rootStore, RootStore } from '../stores/RootStore';

const StoreContext = createContext<RootStore>(rootStore);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
};

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within StoreProvider');
  }
  return context;
};
