export type RootStackParamList = {
  Auth: undefined;
  EmailVerification: { email: string; fromRegistration?: boolean };
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Main: undefined;
  MatchLobby: undefined;
  Match: undefined;
  Results: undefined;
  PremiumUpgrade: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Premium: undefined;
  Ranking: undefined;
};
