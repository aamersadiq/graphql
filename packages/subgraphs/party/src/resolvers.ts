import { userRepository } from '@e-commerce/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@e-commerce/database';

// Define context type
interface Context {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

// Helper function to generate JWT token
const generateToken = (user: User, roles: string[]): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles,
    },
    secret,
    { expiresIn }
  );
};

export const resolvers = {
  User: {
    // Reference resolver for federated entities
    __resolveReference: async (reference: { id: string }) => {
      return userRepository.findById(reference.id);
    },

    // Computed field
    fullName: (parent: User) => {
      if (parent.firstName && parent.lastName) {
        return `${parent.firstName} ${parent.lastName}`;
      }
      return parent.firstName || parent.lastName || '';
    },

    // Relationship resolvers
    addresses: async (parent: User) => {
      const user = await userRepository.findById(parent.id);
      return user?.addresses || [];
    },

    roles: async (parent: User) => {
      const userWithRoles = await userRepository.findWithRoles(parent.id);
      return userWithRoles.roles.map((roleName) => ({
        id: roleName,
        name: roleName,
        permissions: [],
      }));
    },
  },

  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        return null;
      }
      return userRepository.findById(context.user.id);
    },

    user: async (_: any, { id }: { id: string }) => {
      return userRepository.findById(id);
    },

    users: async () => {
      return userRepository.findAll();
    },
  },

  Mutation: {
    register: async (
      _: any,
      { input }: { input: { email: string; password: string; firstName: string; lastName: string } }
    ) => {
      const { email, password, firstName, lastName } = input;

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with CUSTOMER role
      const user = await userRepository.createWithRole(
        {
          email,
          passwordHash,
          firstName,
          lastName,
          isActive: true,
          emailVerified: false,
        },
        'CUSTOMER'
      );

      // Generate token
      const token = generateToken(user, ['CUSTOMER']);

      return {
        token,
        user,
      };
    },

    login: async (_: any, { input }: { input: { email: string; password: string } }) => {
      const { email, password } = input;

      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new Error('Invalid email or password');
      }

      // Get user roles
      const userWithRoles = await userRepository.findWithRoles(user.id);
      const roles = userWithRoles.roles;

      // Generate token
      const token = generateToken(user, roles);

      return {
        token,
        user,
      };
    },

    updateUser: async (
      _: any,
      { input }: { input: { firstName?: string; lastName?: string; email?: string } },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await userRepository.update(context.user.id, input);
      return user;
    },

    addAddress: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // This would be implemented in a real address repository
      throw new Error('Not implemented');
    },

    updateAddress: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // This would be implemented in a real address repository
      throw new Error('Not implemented');
    },

    deleteAddress: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // This would be implemented in a real address repository
      throw new Error('Not implemented');
    },
  },
};