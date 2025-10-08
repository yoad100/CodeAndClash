import { Socket } from 'socket.io';
import logger from '../logger';
import Sentry from '../telemetry/sentry';

export enum SocketErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR', 
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

export class SocketError extends Error {
  constructor(
    public type: SocketErrorType,
    message: string,
    public details?: any,
    public shouldReport = true
  ) {
    super(message);
    this.name = 'SocketError';
  }
}

export function handleSocketError(socket: Socket, error: unknown, eventName: string, userId?: string) {
  if (error instanceof SocketError) {
    logger.warn('Socket error in %s: %s', eventName, error.message, {
      type: error.type,
      userId,
      socketId: socket.id,
      details: error.details
    });
    
    socket.emit('error', {
      type: error.type,
      message: error.message,
      details: error.details
    });
    
    if (error.shouldReport && error.type === SocketErrorType.INTERNAL_ERROR) {
      Sentry.captureException(error);
    }
  } else {
    // Unexpected error
    logger.error('Unexpected socket error in %s: %o', eventName, error, {
      userId,
      socketId: socket.id
    });
    
    socket.emit('error', {
      type: SocketErrorType.INTERNAL_ERROR,
      message: 'An unexpected error occurred'
    });
    
    Sentry.captureException(error);
  }
}

export function socketEventHandler(eventName: string, handler: Function) {
  return async (socket: Socket, ...args: any[]) => {
    try {
      await handler(socket, ...args);
    } catch (error) {
      const userId = (socket as any).userId;
      handleSocketError(socket, error, eventName, userId);
    }
  };
}