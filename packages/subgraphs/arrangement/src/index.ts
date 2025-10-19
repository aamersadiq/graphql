import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import { resolvers } from './resolvers';
import { prisma } from '@e-commerce/database';
import jwt from 'jsonwebtoken';
import path from 'path';

// Read the schema file
const typeDefs = gql(
  readFileSync(path.join(__dirname, 'schema.graphql'), {
    encoding: 'utf-8',
  })
);

// JWT secret for token verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function startServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  try {
    // Start the server
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        // Get the user token from the headers
        const token = req.headers.authorization || '';

        // Try to retrieve a user with the token
        if (token) {
          try {
            // Verify the token and get user data
            const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
            
            // Add the user to the context
            return {
              prisma,
              user: decoded,
            };
          } catch (error) {
            console.error('Invalid token:', error);
          }
        }

        // Return the prisma client in the context
        return { prisma };
      },
      listen: { port: 4004 }, // Arrangement subgraph on port 4004
    });

    console.log(`🚀 Arrangement subgraph ready at ${url}`);
    console.log(`🏷️ Serving promotions and discounts functionality`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
function shutdown() {
  console.log('Shutting down server...');
  
  // Close Prisma connection
  prisma.$disconnect();
  process.exit(0);
}

// Listen for termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);