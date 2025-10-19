import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import { resolvers } from './resolvers';
import { prisma } from '@e-commerce/database';
import jwt from 'jsonwebtoken';

// Read the schema file
const typeDefs = gql(
  readFileSync('../schema.graphql', { encoding: 'utf-8' })
);

// Create Apollo Server
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Start the server
const startServer = async () => {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4003 },
      context: async ({ req }) => {
        // Get the user token from the headers
        const token = req.headers.authorization?.split(' ')[1] || '';
        
        // If token exists, verify it and get user info
        let userId = null;
        let isAdmin = false;
        
        if (token) {
          try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            userId = decoded.userId;
            isAdmin = decoded.roles?.includes('ADMIN') || false;
          } catch (error) {
            console.error('Invalid token:', error);
          }
        }
        
        // Add the repositories, user info, and token to the context
        return {
          prisma,
          token,
          userId,
          isAdmin,
        };
      },
    });
    
    console.log(`🚀 Transaction subgraph ready at ${url}`);
    console.log(`🔍 Serving orders and cart functionality`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  await server.stop();
  await prisma.$disconnect();
  process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();