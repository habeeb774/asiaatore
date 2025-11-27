import type { PrismaConfig } from '@prisma/client'
import { config as dotenvConfig } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
dotenvConfig()

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prismaConfig: PrismaConfig = {
  // Enhanced Prisma configuration for development and production
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/my_store'
    }
  },
  
  // Generator configuration
  generator: {
    client: {
      provider: 'prisma-client-js',
      output: join(__dirname, '../node_modules/.prisma/client'),
      engineType: 'library',
      previewFeatures: [
        'multiSchema',
        'driverAdapters',
        'interactiveTransactions',
        'typedJson',
        'jsonProtocol',
        'connectOrCreate'
      ]
    }
  },

  // Binary configuration for better performance
  binaryTargets: [
    'native',
    'linux-musl',
    'linux-glibc',
    'darwin',
    'windows'
  ],

  // Schema configuration
  schemaPath: join(__dirname, 'prisma/schema.prisma'),

  // Environment-specific configurations
  env: {
    // Development overrides
    ...(process.env.NODE_ENV === 'development' && {
      PRISMA_DISABLE_WARNINGS: 'false',
      PRISMA_GENERATE_DATAPROXY: 'false',
      PRISMA_CLIENT_ENGINE_TYPE: 'library'
    }),
    
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      PRISMA_DISABLE_WARNINGS: 'true',
      PRISMA_GENERATE_DATAPROXY: 'false',
      PRISMA_CLIENT_ENGINE_TYPE: 'library'
    })
  },

  // Logging configuration
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'event',
      level: 'info'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ],

  // Error formatting
  errorFormat: 'pretty',

  // Migration configuration
  migrations: {
    // Custom migration directory
    migrationsDirectory: join(__dirname, 'prisma/migrations'),
    
    // Migration prefix format
    migrationIdFormat: 'timestamp'
  },

  // Seed configuration
  seed: {
    // Path to seed file
    filePath: join(__dirname, 'prisma/seed.ts')
  },

  // Development tools
  ...(process.env.NODE_ENV === 'development' && {
    // Enable query debugging in development
    debug: true,
    
    // Enable introspection for schema changes
    introspection: true
  }),

  // Performance optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable introspection in production
    introspection: false,
    
    // Optimize for production
    optimize: true
  })
}

export default prismaConfig
