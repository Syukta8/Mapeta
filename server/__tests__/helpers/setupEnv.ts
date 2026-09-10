/**
 * Test Environment Setup
 * Evaluates before any database module import to ensure MAPETA_DB_PATH defaults to :memory:.
 */
process.env.MAPETA_DB_PATH = process.env.MAPETA_DB_PATH || ':memory:';
process.env.NODE_ENV = 'test';
