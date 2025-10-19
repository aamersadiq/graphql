import { productResolvers } from './product.resolver';
import { categoryResolvers } from './category.resolver';

export const resolvers = {
  Query: {
    ...productResolvers.Query,
    ...categoryResolvers.Query,
  },
  Mutation: {
    ...productResolvers.Mutation,
    ...categoryResolvers.Mutation,
  },
  Product: productResolvers.Product,
  Category: categoryResolvers.Category,
};