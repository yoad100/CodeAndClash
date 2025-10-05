export interface ApiError extends Error {
  message: string;
  code?: string;
  statusCode?: number;
}
