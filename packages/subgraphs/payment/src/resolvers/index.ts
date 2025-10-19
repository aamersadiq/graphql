import { paymentResolvers } from './payment.resolver';
import { paymentMethodResolvers } from './payment-method.resolver';
import { GraphQLScalarType } from 'graphql';

// Custom scalar for JSON data
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'The JSON scalar type represents JSON objects as specified by ECMA-404',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast: any) {
    return ast.value;
  },
});

export const resolvers = {
  Query: {
    ...paymentResolvers.Query,
    ...paymentMethodResolvers.Query,
  },
  Mutation: {
    ...paymentResolvers.Mutation,
    ...paymentMethodResolvers.Mutation,
  },
  Payment: paymentResolvers.Payment,
  PaymentMethod: paymentMethodResolvers.PaymentMethod,
  Refund: paymentResolvers.Refund,
  JSON: JSONScalar,
};