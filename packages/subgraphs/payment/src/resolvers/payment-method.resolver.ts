import { paymentMethodRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';
import { stripeService } from '../services/stripe.service';

export const paymentMethodResolvers = {
  Query: {
    paymentMethod: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const paymentMethod = await paymentMethodRepository.findById(id);
        
        if (!paymentMethod) {
          throw new GraphQLError(`Payment method with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if user has access to this payment method
        if (paymentMethod.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to access this payment method', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        return paymentMethod;
      } catch (error) {
        console.error('Error fetching payment method:', error);
        throw new GraphQLError('Failed to fetch payment method', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    paymentMethods: async (_: any, __: any, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const userId = context.userId;
        
        // Get user's payment methods
        const paymentMethods = await paymentMethodRepository.findByUserId(userId);
        
        return paymentMethods;
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw new GraphQLError('Failed to fetch payment methods', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    createPaymentMethod: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const userId = context.userId;
        const { type, provider, token, isDefault, billingAddressId, billingAddress } = input;
        
        // Create billing details object
        const billingDetails = billingAddress || {};
        
        if (billingAddressId) {
          // Get billing address from database
          const address = await context.prisma.address.findUnique({
            where: { id: billingAddressId },
          });
          
          if (!address) {
            throw new GraphQLError(`Billing address with ID ${billingAddressId} not found`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          Object.assign(billingDetails, address);
        }
        
        // Create payment method with Stripe
        const paymentMethod = await stripeService.createPaymentMethod(
          userId,
          type,
          token,
          billingDetails,
          isDefault,
        );
        
        return {
          code: '200',
          success: true,
          message: 'Payment method created successfully',
          paymentMethod,
        };
      } catch (error) {
        console.error('Error creating payment method:', error);
        throw new GraphQLError('Failed to create payment method', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    updatePaymentMethod: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Check if payment method exists and belongs to user
        const existingPaymentMethod = await paymentMethodRepository.findById(id);
        
        if (!existingPaymentMethod) {
          throw new GraphQLError(`Payment method with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        if (existingPaymentMethod.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to update this payment method', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Update payment method
        const paymentMethod = await paymentMethodRepository.update(id, input);
        
        return {
          code: '200',
          success: true,
          message: 'Payment method updated successfully',
          paymentMethod,
        };
      } catch (error) {
        console.error('Error updating payment method:', error);
        throw new GraphQLError('Failed to update payment method', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    deletePaymentMethod: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Check if payment method exists and belongs to user
        const existingPaymentMethod = await paymentMethodRepository.findById(id);
        
        if (!existingPaymentMethod) {
          throw new GraphQLError(`Payment method with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        if (existingPaymentMethod.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to delete this payment method', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Delete payment method
        await paymentMethodRepository.delete(id);
        
        return {
          code: '200',
          success: true,
          message: 'Payment method deleted successfully',
          id,
        };
      } catch (error) {
        console.error('Error deleting payment method:', error);
        throw new GraphQLError('Failed to delete payment method', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  PaymentMethod: {
    __resolveReference: async (reference: { id: string }) => {
      return paymentMethodRepository.findById(reference.id);
    },
    
    user: (parent: any) => {
      return { __typename: 'User', id: parent.userId };
    },
    
    billingAddress: (parent: any) => {
      return parent.billingAddressId ? { __typename: 'Address', id: parent.billingAddressId } : null;
    },
  },
};