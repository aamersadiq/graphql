import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import { resolvers } from './resolvers';
import { prisma } from '@e-commerce/database';

// Read the schema file
const typeDefs = gql(
  readFileSync('../schema.graphql', { encoding: 'utf-8' })
);

// Create Apollo Server
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

// Start the server
const startServer = async () => {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4002 },
      context: async ({ req }) => {
        // Get the user token from the headers
        const token = req.headers.authorization || '';
        
        // Add the repositories and user to the context
        return {
          prisma,
          token,
        };
      },
    });
    
    console.log(`🚀 Service subgraph ready at ${url}`);
    console.log(`🔍 Serving products and categories`);
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