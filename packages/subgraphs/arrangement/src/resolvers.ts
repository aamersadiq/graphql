import { Prisma } from '@e-commerce/database';
import { AuthenticationError, ForbiddenError } from './errors';

interface Context {
  prisma: Prisma;
  user?: {
    id: string;
    role: string;
  };
}

export const resolvers = {
  Query: {
    promotions: async (_: any, __: any, { prisma, user }: Context) => {
      return prisma.promotion.findMany();
    },
    promotion: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.promotion.findUnique({
        where: { id },
      });
    },
    discounts: async (_: any, __: any, { prisma }: Context) => {
      return prisma.discount.findMany();
    },
    discount: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.discount.findUnique({
        where: { id },
      });
    },
    couponByCode: async (_: any, { code }: { code: string }, { prisma }: Context) => {
      return prisma.coupon.findUnique({
        where: { code },
      });
    },
  },

  Mutation: {
    createPromotion: async (_: any, { input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to create a promotion');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can create promotions');

      return prisma.promotion.create({
        data: {
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    updatePromotion: async (_: any, { id, input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to update a promotion');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can update promotions');

      return prisma.promotion.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    deletePromotion: async (_: any, { id }: { id: string }, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to delete a promotion');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can delete promotions');

      await prisma.promotion.delete({
        where: { id },
      });
      return true;
    },
    createDiscount: async (_: any, { input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to create a discount');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can create discounts');

      return prisma.discount.create({
        data: {
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    updateDiscount: async (_: any, { id, input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to update a discount');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can update discounts');

      return prisma.discount.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    deleteDiscount: async (_: any, { id }: { id: string }, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to delete a discount');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can delete discounts');

      await prisma.discount.delete({
        where: { id },
      });
      return true;
    },
    createCoupon: async (_: any, { input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to create a coupon');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can create coupons');

      return prisma.coupon.create({
        data: {
          ...input,
          usesCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    updateCoupon: async (_: any, { id, input }: any, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to update a coupon');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can update coupons');

      return prisma.coupon.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    deleteCoupon: async (_: any, { id }: { id: string }, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to delete a coupon');
      if (user.role !== 'ADMIN') throw new ForbiddenError('Only admins can delete coupons');

      await prisma.coupon.delete({
        where: { id },
      });
      return true;
    },
    applyCoupon: async (_: any, { code, cartId }: { code: string; cartId: string }, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to apply a coupon');

      // Find the coupon
      const coupon = await prisma.coupon.findUnique({
        where: { code },
      });

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      if (!coupon.isActive || new Date(coupon.endDate) < new Date() || new Date(coupon.startDate) > new Date()) {
        throw new Error('Coupon is not active or has expired');
      }

      if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
        throw new Error('Coupon usage limit reached');
      }

      // Get the cart
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true } } },
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Calculate cart total
      const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);

      if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
        throw new Error(`Minimum purchase amount of ${coupon.minPurchase} required for this coupon`);
      }

      // Calculate discount amount
      let discountAmount = 0;
      switch (coupon.discountType) {
        case 'PERCENTAGE':
          discountAmount = cartTotal * (coupon.discountValue / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
          break;
        case 'FIXED_AMOUNT':
          discountAmount = coupon.discountValue;
          break;
        case 'FREE_SHIPPING':
          // Assuming shipping cost is stored somewhere
          discountAmount = 0; // This would be the shipping cost
          break;
        default:
          discountAmount = 0;
      }

      // Update coupon usage count
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usesCount: { increment: 1 } },
      });

      // Update cart with discount
      await prisma.cart.update({
        where: { id: cartId },
        data: {
          discountAmount,
          couponCode: code,
        },
      });

      return {
        cartId,
        discountAmount,
        couponCode: code,
      };
    },
    removeCoupon: async (_: any, { cartId }: { cartId: string }, { prisma, user }: Context) => {
      if (!user) throw new AuthenticationError('You must be logged in to remove a coupon');

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          discountAmount: 0,
          couponCode: null,
        },
      });

      return true;
    },
  },

  Promotion: {
    discounts: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.discount.findMany({
        where: { promotionId: parent.id },
      });
    },
    __resolveReference: async (reference: { id: string }, { prisma }: Context) => {
      return prisma.promotion.findUnique({
        where: { id: reference.id },
      });
    },
  },

  Discount: {
    promotion: async (parent: any, _: any, { prisma }: Context) => {
      if (!parent.promotionId) return null;
      return prisma.promotion.findUnique({
        where: { id: parent.promotionId },
      });
    },
    __resolveReference: async (reference: { id: string }, { prisma }: Context) => {
      return prisma.discount.findUnique({
        where: { id: reference.id },
      });
    },
  },

  Coupon: {
    __resolveReference: async (reference: { id: string }, { prisma }: Context) => {
      return prisma.coupon.findUnique({
        where: { id: reference.id },
      });
    },
  },
};