import { PrismaClient, Prisma, Order } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface OrderCreateInput extends Omit<Prisma.OrderCreateInput, 'user' | 'items' | 'shippingAddress' | 'billingAddress' | 'promoCode' | 'paymentMethod'> {
  userId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    discount: number;
  }>;
  shippingAddressId?: string;
  shippingAddress?: Prisma.AddressCreateInput;
  billingAddressId?: string;
  billingAddress?: Prisma.AddressCreateInput;
  promoCodeId?: string;
  paymentMethodId?: string;
}

export interface OrderUpdateInput extends Omit<Prisma.OrderUpdateInput, 'user' | 'items' | 'shippingAddress' | 'billingAddress' | 'promoCode' | 'paymentMethod'> {
  status?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface OrderFilterOptions {
  search?: string;
  status?: string[];
  paymentStatus?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
  userId?: string;
}

export interface OrderSortOptions {
  field: 'orderNumber' | 'createdAt' | 'updatedAt' | 'total' | 'status';
  direction: 'asc' | 'desc';
}

export interface OrderPaginationOptions {
  skip?: number;
  take?: number;
  cursor?: { id: string };
}

export class OrderRepository extends PrismaRepository<Order, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promoCode: true,
        paymentMethod: true,
        refunds: true,
        history: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promoCode: true,
        paymentMethod: true,
        refunds: true,
        history: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });
  }

  async findMany(
    filter?: OrderFilterOptions,
    sort?: OrderSortOptions,
    pagination?: OrderPaginationOptions,
  ) {
    const where: Prisma.OrderWhereInput = {};
    
    if (filter) {
      if (filter.search) {
        where.OR = [
          { orderNumber: { contains: filter.search, mode: 'insensitive' } },
          { notes: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      
      if (filter.status && filter.status.length > 0) {
        where.status = { in: filter.status };
      }
      
      if (filter.paymentStatus && filter.paymentStatus.length > 0) {
        where.paymentStatus = { in: filter.paymentStatus };
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
      
      if (filter.minTotal !== undefined || filter.maxTotal !== undefined) {
        where.total = {};
        
        if (filter.minTotal !== undefined) {
          where.total.gte = filter.minTotal;
        }
        
        if (filter.maxTotal !== undefined) {
          where.total.lte = filter.maxTotal;
        }
      }
      
      if (filter.userId) {
        where.userId = filter.userId;
      }
    }
    
    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    
    if (sort) {
      switch (sort.field) {
        case 'orderNumber':
          orderBy.orderNumber = sort.direction;
          break;
        case 'createdAt':
          orderBy.createdAt = sort.direction;
          break;
        case 'updatedAt':
          orderBy.updatedAt = sort.direction;
          break;
        case 'total':
          orderBy.total = sort.direction;
          break;
        case 'status':
          orderBy.status = sort.direction;
          break;
      }
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const [items, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: pagination?.skip,
        take: pagination?.take,
        cursor: pagination?.cursor,
        include: {
          user: true,
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
          promoCode: true,
          paymentMethod: true,
          refunds: true,
          history: {
            include: {
              user: true,
            },
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    
    return { items, totalCount };
  }

  async create(data: OrderCreateInput): Promise<Order> {
    const {
      userId,
      items,
      shippingAddressId,
      shippingAddress,
      billingAddressId,
      billingAddress,
      promoCodeId,
      paymentMethodId,
      ...orderData
    } = data;
    
    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = items.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
    
    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return this.prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
        subtotal,
        discount,
        total: subtotal - discount + (orderData.tax || 0) + (orderData.shipping || 0),
        user: {
          connect: { id: userId },
        },
        items: {
          create: items.map(item => ({
            product: {
              connect: { id: item.productId },
            },
            variant: item.variantId
              ? {
                  connect: { id: item.variantId },
                }
              : undefined,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            total: item.price * item.quantity - item.discount * item.quantity,
          })),
        },
        shippingAddress: shippingAddressId
          ? {
              connect: { id: shippingAddressId },
            }
          : shippingAddress
          ? {
              create: shippingAddress,
            }
          : undefined,
        billingAddress: billingAddressId
          ? {
              connect: { id: billingAddressId },
            }
          : billingAddress
          ? {
              create: billingAddress,
            }
          : undefined,
        promoCode: promoCodeId
          ? {
              connect: { id: promoCodeId },
            }
          : undefined,
        paymentMethod: paymentMethodId
          ? {
              connect: { id: paymentMethodId },
            }
          : undefined,
        history: {
          create: {
            status: 'PENDING',
            timestamp: new Date(),
            note: 'Order created',
            user: {
              connect: { id: userId },
            },
          },
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promoCode: true,
        paymentMethod: true,
        refunds: true,
        history: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: OrderUpdateInput): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { status: true, userId: true },
    });
    
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    const updates: Prisma.OrderUpdateInput = { ...data };
    
    // If status is changing, add to history
    if (data.status && data.status !== order.status) {
      updates.history = {
        create: {
          status: data.status as string,
          timestamp: new Date(),
          note: data.notes || `Status changed to ${data.status}`,
          user: {
            connect: { id: order.userId },
          },
        },
      };
    }
    
    return this.prisma.order.update({
      where: { id },
      data: updates,
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promoCode: true,
        paymentMethod: true,
        refunds: true,
        history: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });
  }

  async cancel(id: string, reason: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
        history: {
          create: {
            status: 'CANCELLED',
            timestamp: new Date(),
            note: reason || 'Order cancelled',
            user: {
              connect: { id: userId },
            },
          },
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promoCode: true,
        paymentMethod: true,
        refunds: true,
        history: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.order.delete({
      where: { id },
    });
    return true;
  }
}