import { prisma } from '../index';
import { UserRepository } from './user.repository';
import { ProductRepository } from './product.repository';
import { CategoryRepository } from './category.repository';
import { OrderRepository } from './order.repository';
import { CartRepository } from './cart.repository';
import { PaymentRepository } from './payment.repository';
import { PaymentMethodRepository } from './payment-method.repository';

// Create repository instances
export const userRepository = new UserRepository(prisma);
export const productRepository = new ProductRepository(prisma);
export const categoryRepository = new CategoryRepository(prisma);
export const orderRepository = new OrderRepository(prisma);
export const cartRepository = new CartRepository(prisma);
export const paymentRepository = new PaymentRepository(prisma);
export const paymentMethodRepository = new PaymentMethodRepository(prisma);

// Export repository classes
export * from './base.repository';
export * from './prisma.repository';
export * from './user.repository';
export * from './product.repository';
export * from './category.repository';
export * from './order.repository';
export * from './cart.repository';
export * from './payment.repository';
export * from './payment-method.repository';