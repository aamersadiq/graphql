import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import jwt from 'jsonwebtoken';

// Define context type
interface Context {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

async function startServer() {
  // Create schema
  const schema = buildSubgraphSchema({ typeDefs, resolvers });

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    schema,
  });

  // Start server
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PARTY_SUBGRAPH_PORT || '4001') },
    context: async ({ req }) => {
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return {};
      }

      try {
        // Verify token
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, secret) as {
          id: string;
          email: string;
          roles: string[];
        };

        // Return user in context
        return {
          user: {
            id: decoded.id,
            email: decoded.email,
            roles: decoded.roles,
          },
        };
      } catch (error) {
        return {};
      }
    },
  });

  console.log(`🚀 Party subgraph ready at ${url}`);
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});