export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'Password is too long' };
    }
    return { valid: true };
  },

  username: (username: string): { valid: boolean; message?: string } => {
    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { valid: false, message: 'Username is too long' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        valid: false,
        message: 'Username can only contain letters, numbers, and underscores',
      };
    }
    return { valid: true };
  },
};
