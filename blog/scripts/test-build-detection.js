#!/usr/bin/env node

/**
 * Test script to verify build-time detection logic
 * This helps ensure that the database connection is properly skipped during builds
 */

console.log('Testing build-time detection logic...\n');

// Simulate different environment scenarios
const scenarios = [
  {
    name: 'Vercel Build Environment',
    env: {
      VERCEL: '1',
      VERCEL_ENV: 'production',
      NODE_ENV: 'production',
      // MONGODB_URI intentionally missing to simulate build-time
    }
  },
  {
    name: 'CI Build Environment',
    env: {
      CI: 'true',
      NODE_ENV: 'production',
      // MONGODB_URI intentionally missing
    }
  },
  {
    name: 'Next.js Production Build',
    env: {
      NEXT_PHASE: 'phase-production-build',
      NODE_ENV: 'production',
      // MONGODB_URI intentionally missing
    }
  },
  {
    name: 'Local Production Build without DB',
    env: {
      NODE_ENV: 'production',
      // MONGODB_URI intentionally missing
    }
  },
  {
    name: 'Development Environment (should NOT be build time)',
    env: {
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost:27017/test'
    }
  },
  {
    name: 'Production Runtime with DB (should NOT be build time)',
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/test'
    }
  }
];

function testBuildTimeDetection(envVars) {
  // Temporarily set environment variables
  const originalEnv = { ...process.env };
  
  // Clear relevant env vars and set test ones
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.CI;
  delete process.env.NEXT_PHASE;
  delete process.env.MONGODB_URI;
  delete process.env.NODE_ENV;
  
  Object.assign(process.env, envVars);
  
  // Test the build-time detection logic (same as in mongodb.ts)
  const isBuildTime = typeof window === 'undefined' && (
    // During Vercel build process
    process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'development' ||
    // During CI builds
    process.env.CI === 'true' ||
    // During npm run build without database
    (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) ||
    // Explicit build flag
    process.env.NEXT_PHASE === 'phase-production-build'
  );
  
  // Restore original environment
  process.env = originalEnv;
  
  return isBuildTime;
}

// Run tests
scenarios.forEach((scenario, index) => {
  const result = testBuildTimeDetection(scenario.env);
  const expected = index < 4; // First 4 scenarios should be detected as build time
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${status} ${scenario.name}`);
  console.log(`   Expected: ${expected}, Got: ${result}`);
  console.log(`   Env: ${JSON.stringify(scenario.env)}\n`);
});

console.log('Build-time detection test completed!');
