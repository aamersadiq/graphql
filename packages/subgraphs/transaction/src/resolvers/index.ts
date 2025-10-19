import { orderResolvers } from './order.resolver';
import { cartResolvers } from './cart.resolver';

export const resolvers = {
  Query: {
    ...orderResolvers.Query,
    ...cartResolvers.Query,
  },
  Mutation: {
    ...orderResolvers.Mutation,
    ...cartResolvers.Mutation,
  },
  Order: orderResolvers.Order,
  OrderItem: orderResolvers.OrderItem,
  Cart: cartResolvers.Cart,
  CartItem: cartResolvers.CartItem,
};