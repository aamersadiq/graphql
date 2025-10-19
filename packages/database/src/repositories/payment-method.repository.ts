import { PrismaClient, Prisma, PaymentMethod } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface PaymentMethodCreateInput extends Omit<Prisma.PaymentMethodCreateInput, 'user' | 'billingAddress'> {
  userId: string;
  billingAddressId?: string;
  billingAddress?: Prisma.AddressCreateInput;
}

export interface PaymentMethodUpdateInput extends Omit<Prisma.PaymentMethodUpdateInput, 'user' | 'billingAddress'> {
  billingAddressId?: string;
  billingAddress?: Prisma.AddressCreateInput;
}

export class PaymentMethodRepository extends PrismaRepository<PaymentMethod, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.paymentMethod);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        user: true,
        billingAddress: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      include: {
        billingAddress: true,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
  }

  async findDefaultByUserId(userId: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        billingAddress: true,
      },
    });
  }

  async create(data: PaymentMethodCreateInput): Promise<PaymentMethod> {
    const { userId, billingAddressId, billingAddress, ...paymentMethodData } = data;
    
    // If this is the first payment method for the user, make it default
    const existingMethods = await this.findByUserId(userId);
    const isDefault = existingMethods.length === 0 ? true : data.isDefault || false;
    
    // If setting this method as default, unset any existing default
    if (isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    return this.prisma.paymentMethod.create({
      data: {
        ...paymentMethodData,
        isDefault,
        user: {
          connect: { id: userId },
        },
        billingAddress: billingAddressId
          ? {
              connect: { id: billingAddressId },
            }
          : billingAddress
          ? {
              create: billingAddress,
            }
          : undefined,
      },
      include: {
        user: true,
        billingAddress: true,
      },
    });
  }

  async update(id: string, data: PaymentMethodUpdateInput): Promise<PaymentMethod> {
    const { billingAddressId, billingAddress, ...paymentMethodData } = data;
    
    // Get the payment method to check if we need to update default status
    const paymentMethod = await this.findById(id);
    
    if (!paymentMethod) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    
    // If setting this method as default, unset any existing default
    if (data.isDefault === true && !paymentMethod.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userId: paymentMethod.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...paymentMethodData,
        billingAddress: billingAddressId
          ? {
              connect: { id: billingAddressId },
            }
          : billingAddress
          ? {
              upsert: {
                create: billingAddress,
                update: billingAddress,
              },
            }
          : undefined,
      },
      include: {
        user: true,
        billingAddress: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    // Get the payment method to check if it's default
    const paymentMethod = await this.findById(id);
    
    if (!paymentMethod) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    
    // Delete the payment method
    await this.prisma.paymentMethod.delete({
      where: { id },
    });
    
    // If this was the default payment method, set another one as default if available
    if (paymentMethod.isDefault) {
      const otherMethods = await this.prisma.paymentMethod.findMany({
        where: {
          userId: paymentMethod.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });
      
      if (otherMethods.length > 0) {
        await this.prisma.paymentMethod.update({
          where: { id: otherMethods[0].id },
          data: { isDefault: true },
        });
      }
    }
    
    return true;
  }
}