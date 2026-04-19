/**
 * ML Services unit tests.
 * Tests price prediction and recommendation engine logic.
 */

jest.mock('../models', () => {
  const mockFindAll = jest.fn().mockResolvedValue([]);
  const mockFindByPk = jest.fn().mockResolvedValue(null);
  const mockFindOne = jest.fn().mockResolvedValue(null);
  const mockCount = jest.fn().mockResolvedValue(0);
  return {
    MachineryListing: {
      findAll: mockFindAll,
      findByPk: mockFindByPk,
      findOne: mockFindOne,
      count: mockCount,
    },
    User: {},
    ActivityLog: {
      findAll: jest.fn().mockResolvedValue([]),
    },
    FraudReport: { count: jest.fn().mockResolvedValue(0) },
  };
});
jest.mock('../config/database', () => ({
  sequelize: {
    getDialect: () => 'postgres',
    getQueryInterface: () => ({}),
  },
}));
jest.mock('../config/dbHelpers', () => ({
  iLikeFilter: (val) => val,
}));

describe('Price Prediction Service', () => {
  let pricePrediction;

  beforeAll(() => {
    pricePrediction = require('../services/pricePrediction');
  });

  test('predictPrice returns a result with predicted field', () => {
    const result = pricePrediction.predictPrice({
      category: 'construction',
      make: 'Tata',
      model: 'Hitachi EX200',
      year: 2020,
      hoursUsed: 5000,
      condition: 'good',
      city: 'Mumbai',
    });

    expect(result).toBeDefined();
    expect(typeof result.predicted).toBe('number');
    expect(result.predicted).toBeGreaterThan(0);
    expect(result.confidence).toBeDefined();
    expect(result.method).toBeDefined();
  });

  test('predictPrice returns predicted >= 10000 (minimum floor)', () => {
    const result = pricePrediction.predictPrice({
      category: 'construction',
      make: 'Komatsu',
      model: 'PC200',
      year: 2018,
      hoursUsed: 8000,
      condition: 'fair',
    });

    expect(result.predicted).toBeGreaterThanOrEqual(10000);
  });

  test('predictPrice handles missing optional fields', () => {
    const result = pricePrediction.predictPrice({
      category: 'construction',
    });

    expect(result).toBeDefined();
    expect(typeof result.predicted).toBe('number');
    expect(result.predicted).toBeGreaterThanOrEqual(10000);
  });

  test('predictPrice includes confidence level', () => {
    const result = pricePrediction.predictPrice({
      category: 'mining',
      make: 'CAT',
      year: 2019,
    });

    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  test('trainModel exports are functions', () => {
    expect(typeof pricePrediction.trainModel).toBe('function');
    expect(typeof pricePrediction.predictPrice).toBe('function');
    expect(typeof pricePrediction.analyzeListingPrice).toBe('function');
  });
});

describe('Recommendation Engine', () => {
  let recommendationEngine;

  beforeAll(() => {
    recommendationEngine = require('../services/recommendationEngine');
  });

  test('getSimilarListings returns empty array for non-existent listing', async () => {
    const result = await recommendationEngine.getSimilarListings('non-existent-id');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('getTrendingListings returns an array', async () => {
    const result = await recommendationEngine.getTrendingListings({
      city: 'Mumbai',
      limit: 5,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  test('getCollaborativeRecommendations returns empty for unknown user', async () => {
    const result = await recommendationEngine.getCollaborativeRecommendations('unknown-user');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('getPersonalizedRecommendations returns structured result', async () => {
    const result = await recommendationEngine.getPersonalizedRecommendations('user-1', {
      city: 'Delhi',
    });
    expect(result).toHaveProperty('forYou');
    expect(result).toHaveProperty('trending');
    expect(Array.isArray(result.forYou)).toBe(true);
    expect(Array.isArray(result.trending)).toBe(true);
  });
});
