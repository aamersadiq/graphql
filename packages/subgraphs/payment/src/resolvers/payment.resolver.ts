import { paymentRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';
import { stripeService } from '../services/stripe.service';

export const paymentResolvers = {
  Query: {
    payment: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const payment = await paymentRepository.findById(id);
        
        if (!payment) {
          throw new GraphQLError(`Payment with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if user has access to this payment
        if (payment.order.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to access this payment', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        return payment;
      } catch (error) {
        console.error('Error fetching payment:', error);
        throw new GraphQLError('Failed to fetch payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    payments: async (_: any, args: any, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const { filter, sort, pagination } = args;
        
        // If not admin, restrict to user's own payments
        if (!context.isAdmin) {
          filter.userId = context.userId;
        }
        
        const paginationOptions = pagination
          ? {
              skip: pagination.first && pagination.after
                ? parseInt(Buffer.from(pagination.after, 'base64').toString('ascii'))
                : undefined,
              take: pagination.first || pagination.last,
              cursor: pagination.after
                ? { id: Buffer.from(pagination.after, 'base64').toString('ascii') }
                : pagination.before
                ? { id: Buffer.from(pagination.before, 'base64').toString('ascii') }
                : undefined,
            }
          : undefined;
        
        const { items, totalCount } = await paymentRepository.findMany(
          filter,
          sort,
          paginationOptions,
        );
        
        const edges = items.map(item => ({
          node: item,
          cursor: Buffer.from(item.id).toString('base64'),
        }));
        
        const startCursor = edges.length > 0 ? edges[0].cursor : null;
        const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
        
        const hasNextPage = pagination?.first
          ? items.length === pagination.first
          : false;
        
        const hasPreviousPage = pagination?.last
          ? items.length === pagination.last
          : false;
        
        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw new GraphQLError('Failed to fetch payments', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    createPaymentIntent: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const { orderId, amount, currency, paymentMethodId, metadata } = input;
        
        // Create payment intent with Stripe
        const paymentIntent = await stripeService.createPaymentIntent(
          orderId,
          amount,
          currency,
          paymentMethodId,
          metadata,
        );
        
        return {
          code: '200',
          success: true,
          message: 'Payment intent created successfully',
          paymentIntent,
        };
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw new GraphQLError('Failed to create payment intent', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    confirmPaymentIntent: async (_: any, { id, paymentMethodId }: { id: string; paymentMethodId: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Confirm payment intent with Stripe
        const paymentIntent = await stripeService.confirmPaymentIntent(id, paymentMethodId);
        
        return {
          code: '200',
          success: true,
          message: 'Payment intent confirmed successfully',
          paymentIntent,
        };
      } catch (error) {
        console.error('Error confirming payment intent:', error);
        throw new GraphQLError('Failed to confirm payment intent', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    refundPayment: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Check if user is authenticated and is admin
        if (!context.token || !context.isAdmin) {
          throw new GraphQLError('Not authorized to process refunds', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        const { paymentId, amount, reason, metadata } = input;
        
        // Process refund with Stripe
        const refund = await stripeService.processRefund(
          paymentId,
          amount,
          reason,
          metadata,
        );
        
        return {
          code: '200',
          success: true,
          message: 'Payment refunded successfully',
          refund,
        };
      } catch (error) {
        console.error('Error refunding payment:', error);
        throw new GraphQLError('Failed to refund payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Payment: {
    __resolveReference: async (reference: { id: string }) => {
      return paymentRepository.findById(reference.id);
    },
    
    order: (parent: any) => {
      return { __typename: 'Order', id: parent.orderId };
    },
    
    paymentMethod: (parent: any) => {
      return parent.paymentMethodId ? { __typename: 'PaymentMethod', id: parent.paymentMethodId } : null;
    },
  },
  
  Refund: {
    payment: (parent: any) => {
      return { __typename: 'Payment', id: parent.paymentId };
    },
  },
};