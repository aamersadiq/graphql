import { PrismaClient, Prisma, Payment } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface PaymentCreateInput extends Omit<Prisma.PaymentCreateInput, 'order' | 'paymentMethod' | 'refunds'> {
  orderId: string;
  paymentMethodId?: string;
}

export interface PaymentFilterOptions {
  orderId?: string;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

export interface PaymentSortOptions {
  field: 'createdAt' | 'updatedAt' | 'amount' | 'status';
  direction: 'asc' | 'desc';
}

export interface PaymentPaginationOptions {
  skip?: number;
  take?: number;
  cursor?: { id: string };
}

export class PaymentRepository extends PrismaRepository<Payment, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
        paymentMethod: true,
        refunds: true,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { orderId },
      include: {
        order: true,
        paymentMethod: true,
        refunds: true,
      },
    });
  }

  async findMany(
    filter?: PaymentFilterOptions,
    sort?: PaymentSortOptions,
    pagination?: PaymentPaginationOptions,
  ) {
    const where: Prisma.PaymentWhereInput = {};
    
    if (filter) {
      if (filter.orderId) {
        where.orderId = filter.orderId;
      }
      
      if (filter.status && filter.status.length > 0) {
        where.status = { in: filter.status };
      }
      
      if (filter.dateFrom || filter.dateTo) {
        where.createdAt = {};
        
        if (filter.dateFrom) {
          where.createdAt.gte = filter.dateFrom;
        }
        
        if (filter.dateTo) {
          where.createdAt.lte = filter.dateTo;
        }
      }
      
      if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
        where.amount = {};
        
        if (filter.minAmount !== undefined) {
          where.amount.gte = filter.minAmount;
        }
        
        if (filter.maxAmount !== undefined) {
          where.amount.lte = filter.maxAmount;
        }
      }
      
      if (filter.userId) {
        where.order = {
          userId: filter.userId,
        };
      }
    }
    
    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    
    if (sort) {
      switch (sort.field) {
        case 'createdAt':
          orderBy.createdAt = sort.direction;
          break;
        case 'updatedAt':
          orderBy.updatedAt = sort.direction;
          break;
        case 'amount':
          orderBy.amount = sort.direction;
          break;
        case 'status':
          orderBy.status = sort.direction;
          break;
      }
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const [items, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy,
        skip: pagination?.skip,
        take: pagination?.take,
        cursor: pagination?.cursor,
        include: {
          order: true,
          paymentMethod: true,
          refunds: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    
    return { items, totalCount };
  }

  async create(data: PaymentCreateInput): Promise<Payment> {
    const { orderId, paymentMethodId, ...paymentData } = data;
    
    return this.prisma.payment.create({
      data: {
        ...paymentData,
        order: {
          connect: { id: orderId },
        },
        paymentMethod: paymentMethodId
          ? {
              connect: { id: paymentMethodId },
            }
          : undefined,
      },
      include: {
        order: true,
        paymentMethod: true,
        refunds: true,
      },
    });
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data,
      include: {
        order: true,
        paymentMethod: true,
        refunds: true,
      },
    });
  }

  async createRefund(
    paymentId: string,
    amount: number,
    reason: string,
    providerRefundId: string,
    metadata?: any,
  ): Promise<Payment> {
    // Get the payment to check if refund is possible
    const payment = await this.findById(paymentId);
    
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }
    
    if (payment.status !== 'COMPLETED') {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }
    
    // Calculate total refunded amount including this refund
    const totalRefunded = payment.refunds.reduce((sum, refund) => sum + refund.amount, 0) + amount;
    
    // Check if refund amount is valid
    if (totalRefunded > payment.amount) {
      throw new Error(`Refund amount exceeds payment amount`);
    }
    
    // Create the refund
    await this.prisma.refund.create({
      data: {
        payment: { connect: { id: paymentId } },
        amount,
        currency: payment.currency,
        reason,
        status: 'COMPLETED',
        providerRefundId,
        metadata,
      },
    });
    
    // Update payment status
    const newStatus = totalRefunded === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    
    return this.update(paymentId, { status: newStatus });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.payment.delete({
      where: { id },
    });
    return true;
  }
}