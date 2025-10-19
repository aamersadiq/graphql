import { orderRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';

export const orderResolvers = {
  Query: {
    order: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const order = await orderRepository.findById(id);
        
        if (!order) {
          throw new GraphQLError(`Order with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if user has access to this order
        if (order.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to access this order', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        return order;
      } catch (error) {
        console.error('Error fetching order:', error);
        throw new GraphQLError('Failed to fetch order', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    orders: async (_: any, args: any, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const { filter, sort, pagination } = args;
        
        // If not admin, restrict to user's own orders
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
        
        const { items, totalCount } = await orderRepository.findMany(
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
        console.error('Error fetching orders:', error);
        throw new GraphQLError('Failed to fetch orders', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    createOrder: async (_: any, { input }: { input: any }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const userId = context.userId;
        
        // Create order data
        const orderData = {
          ...input,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        };
        
        const order = await orderRepository.create(orderData);
        
        return {
          code: '200',
          success: true,
          message: 'Order created successfully',
          order,
        };
      } catch (error) {
        console.error('Error creating order:', error);
        throw new GraphQLError('Failed to create order', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    updateOrder: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Only admins can update orders
        if (!context.isAdmin) {
          throw new GraphQLError('Not authorized to update orders', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        const existingOrder = await orderRepository.findById(id);
        
        if (!existingOrder) {
          throw new GraphQLError(`Order with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const order = await orderRepository.update(id, input);
        
        return {
          code: '200',
          success: true,
          message: 'Order updated successfully',
          order,
        };
      } catch (error) {
        console.error('Error updating order:', error);
        throw new GraphQLError('Failed to update order', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    cancelOrder: async (_: any, { id, reason }: { id: string; reason?: string }, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const existingOrder = await orderRepository.findById(id);
        
        if (!existingOrder) {
          throw new GraphQLError(`Order with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Check if user has access to this order
        if (existingOrder.userId !== context.userId && !context.isAdmin) {
          throw new GraphQLError('Not authorized to cancel this order', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Check if order can be cancelled
        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(existingOrder.status)) {
          throw new GraphQLError(`Order cannot be cancelled in ${existingOrder.status} status`, {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        
        const order = await orderRepository.cancel(id, reason || 'Cancelled by user', context.userId);
        
        return {
          code: '200',
          success: true,
          message: 'Order cancelled successfully',
          order,
        };
      } catch (error) {
        console.error('Error cancelling order:', error);
        throw new GraphQLError('Failed to cancel order', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Order: {
    __resolveReference: async (reference: { id: string }) => {
      return orderRepository.findById(reference.id);
    },
    
    user: (parent: any) => {
      return { __typename: 'User', id: parent.userId };
    },
    
    items: (parent: any) => {
      return parent.items || [];
    },
  },
  
  OrderItem: {
    product: (parent: any) => {
      return { __typename: 'Product', id: parent.productId };
    },
    
    variant: (parent: any) => {
      return parent.variantId ? { __typename: 'ProductVariant', id: parent.variantId } : null;
    },
  },
};