import mongoose from 'mongoose';
import logger from '../logger';

export async function createIndexes() {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ rating: -1 }); // For leaderboard
    await mongoose.connection.collection('users').createIndex({ isPremium: 1 });
    
    // Match indexes
    await mongoose.connection.collection('matches').createIndex({ 'players.userId': 1 });
    await mongoose.connection.collection('matches').createIndex({ status: 1 });
    await mongoose.connection.collection('matches').createIndex({ startedAt: -1 });
    await mongoose.connection.collection('matches').createIndex({ subject: 1 });
    
    // Question indexes
    await mongoose.connection.collection('questions').createIndex({ subject: 1 });
    await mongoose.connection.collection('questions').createIndex({ difficulty: 1 });
    
    // RefreshToken indexes
    await mongoose.connection.collection('refreshtokens').createIndex({ userId: 1 });
    await mongoose.connection.collection('refreshtokens').createIndex({ token: 1 }, { unique: true });
    await mongoose.connection.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create database indexes: %o', error);
    throw error;
  }
}

// Optimized leaderboard query with pagination
export async function getLeaderboardOptimized(page = 0, limit = 100) {
  const User = mongoose.model('User');
  
  return await User.aggregate([
    { $match: { rating: { $exists: true } } },
    { $sort: { rating: -1 } },
    { $skip: page * limit },
    { $limit: limit },
    {
      $project: {
        username: 1,
        rating: 1,
        wins: 1,
        losses: 1,
        avatar: 1,
        rank: { $add: [{ $multiply: [page, limit] }, { $indexOfArray: [[], null] }] }
      }
    }
  ]);
}