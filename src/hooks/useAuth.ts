import { useStores } from '../contexts/StoreContext';

export const useAuth = () => {
  const { authStore } = useStores();

  return {
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.login.bind(authStore),
    register: authStore.register.bind(authStore),
    logout: authStore.logout.bind(authStore),
    oauthLogin: authStore.oauthLogin.bind(authStore),
  };
};
