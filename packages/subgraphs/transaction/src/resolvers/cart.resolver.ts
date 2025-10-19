import { cartRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';

export const cartResolvers = {
  Query: {
    cart: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const cart = await cartRepository.findById(id);
        
        if (!cart) {
          throw new GraphQLError(`Cart with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // If cart belongs to a user, check authentication
        if (cart.userId && (!context.token || cart.userId !== context.userId)) {
          throw new GraphQLError('Not authorized to access this cart', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        return cart;
      } catch (error) {
        console.error('Error fetching cart:', error);
        throw new GraphQLError('Failed to fetch cart', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    userCart: async (_: any, __: any, context: any) => {
      try {
        // Check if user is authenticated
        if (!context.token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const userId = context.userId;
        
        // Find or create user's cart
        let cart = await cartRepository.findByUserId(userId);
        
        if (!cart) {
          cart = await cartRepository.createOrUpdateCart(userId);
        }
        
        return cart;
      } catch (error) {
        console.error('Error fetching user cart:', error);
        throw new GraphQLError('Failed to fetch user cart', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    addToCart: async (_: any, { input }: { input: any }, context: any) => {
      try {
        let cartId;
        
        // If user is authenticated, use their cart
        if (context.token) {
          const userId = context.userId;
          let cart = await cartRepository.findByUserId(userId);
          
          if (!cart) {
            cart = await cartRepository.createOrUpdateCart(userId);
          }
          
          cartId = cart.id;
        } else if (input.cartId) {
          // For anonymous users, require cartId
          cartId = input.cartId;
          
          // Verify cart exists
          const cart = await cartRepository.findById(cartId);
          if (!cart) {
            throw new GraphQLError(`Cart with ID ${cartId} not found`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
        } else {
          // Create a new cart for anonymous user
          const cart = await cartRepository.createOrUpdateCart();
          cartId = cart.id;
        }
        
        // Add item to cart
        const cart = await cartRepository.addItem(cartId, {
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
        });
        
        return {
          code: '200',
          success: true,
          message: 'Item added to cart successfully',
          cart,
        };
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw new GraphQLError('Failed to add item to cart', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    updateCartItem: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      try {
        // Get the cart item to check ownership
        const cartItem = await cartRepository.prisma.cartItem.findUnique({
          where: { id },
          include: { cart: true },
        });
        
        if (!cartItem) {
          throw new GraphQLError(`Cart item with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // If cart belongs to a user, check authentication
        if (cartItem.cart.userId && (!context.token || cartItem.cart.userId !== context.userId)) {
          throw new GraphQLError('Not authorized to update this cart item', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Update cart item
        const cart = await cartRepository.updateItem(id, {
          quantity: input.quantity,
        });
        
        return {
          code: '200',
          success: true,
          message: 'Cart item updated successfully',
          cart,
        };
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw new GraphQLError('Failed to update cart item', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    removeFromCart: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Get the cart item to check ownership
        const cartItem = await cartRepository.prisma.cartItem.findUnique({
          where: { id },
          include: { cart: true },
        });
        
        if (!cartItem) {
          throw new GraphQLError(`Cart item with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // If cart belongs to a user, check authentication
        if (cartItem.cart.userId && (!context.token || cartItem.cart.userId !== context.userId)) {
          throw new GraphQLError('Not authorized to remove this cart item', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Remove cart item
        const cart = await cartRepository.removeItem(id);
        
        return {
          code: '200',
          success: true,
          message: 'Cart item removed successfully',
          cart,
        };
      } catch (error) {
        console.error('Error removing cart item:', error);
        throw new GraphQLError('Failed to remove cart item', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    clearCart: async (_: any, __: any, context: any) => {
      try {
        let cartId;
        
        // If user is authenticated, use their cart
        if (context.token) {
          const userId = context.userId;
          const cart = await cartRepository.findByUserId(userId);
          
          if (!cart) {
            throw new GraphQLError('User does not have a cart', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          cartId = cart.id;
        } else {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Clear cart
        const cart = await cartRepository.clearCart(cartId);
        
        return {
          code: '200',
          success: true,
          message: 'Cart cleared successfully',
          cart,
        };
      } catch (error) {
        console.error('Error clearing cart:', error);
        throw new GraphQLError('Failed to clear cart', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    applyPromoCode: async (_: any, { code }: { code: string }, context: any) => {
      try {
        let cartId;
        
        // If user is authenticated, use their cart
        if (context.token) {
          const userId = context.userId;
          const cart = await cartRepository.findByUserId(userId);
          
          if (!cart) {
            throw new GraphQLError('User does not have a cart', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          cartId = cart.id;
        } else {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Apply promo code
        const cart = await cartRepository.applyPromoCode(cartId, code);
        
        return {
          code: '200',
          success: true,
          message: 'Promo code applied successfully',
          cart,
        };
      } catch (error) {
        console.error('Error applying promo code:', error);
        throw new GraphQLError('Failed to apply promo code', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    removePromoCode: async (_: any, __: any, context: any) => {
      try {
        let cartId;
        
        // If user is authenticated, use their cart
        if (context.token) {
          const userId = context.userId;
          const cart = await cartRepository.findByUserId(userId);
          
          if (!cart) {
            throw new GraphQLError('User does not have a cart', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          cartId = cart.id;
        } else {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Remove promo code
        const cart = await cartRepository.removePromoCode(cartId);
        
        return {
          code: '200',
          success: true,
          message: 'Promo code removed successfully',
          cart,
        };
      } catch (error) {
        console.error('Error removing promo code:', error);
        throw new GraphQLError('Failed to remove promo code', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Cart: {
    __resolveReference: async (reference: { id: string }) => {
      return cartRepository.findById(reference.id);
    },
    
    user: (parent: any) => {
      return parent.userId ? { __typename: 'User', id: parent.userId } : null;
    },
    
    items: (parent: any) => {
      return parent.items || [];
    },
  },
  
  CartItem: {
    product: (parent: any) => {
      return { __typename: 'Product', id: parent.productId };
    },
    
    variant: (parent: any) => {
      return parent.variantId ? { __typename: 'ProductVariant', id: parent.variantId } : null;
    },
  },
};