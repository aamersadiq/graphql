import { PrismaClient, Prisma, Cart } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export class CartRepository extends PrismaRepository<Cart, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.cart);
  }

  async findById(id: string): Promise<Cart | null> {
    return this.prisma.cart.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                thumbnail: true,
                inventory: true,
              },
            },
            variant: true,
          },
        },
        promoCode: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    return this.prisma.cart.findFirst({
      where: { userId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                thumbnail: true,
                inventory: true,
              },
            },
            variant: true,
          },
        },
        promoCode: true,
      },
    });
  }

  async createOrUpdateCart(userId?: string): Promise<Cart> {
    // Check if user already has a cart
    let cart: Cart | null = null;
    
    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: true,
        },
      });
    }
    
    // If cart exists, return it
    if (cart) {
      return this.findById(cart.id) as Promise<Cart>;
    }
    
    // Otherwise create a new cart
    return this.prisma.cart.create({
      data: {
        user: userId ? { connect: { id: userId } } : undefined,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                thumbnail: true,
                inventory: true,
              },
            },
            variant: true,
          },
        },
        promoCode: true,
      },
    });
  }

  async addItem(cartId: string, item: CartItemInput): Promise<Cart> {
    // Get the product to calculate price
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: item.variantId ? {
          where: { id: item.variantId },
        } : undefined,
      },
    });
    
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    
    // Check if variant exists if variantId is provided
    if (item.variantId && (!product.variants || product.variants.length === 0)) {
      throw new Error(`Variant with ID ${item.variantId} not found`);
    }
    
    // Get price from variant if available, otherwise use product price
    const price = item.variantId && product.variants && product.variants.length > 0
      ? product.variants[0].price
      : product.price;
    
    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: item.productId,
        variantId: item.variantId || null,
      },
    });
    
    if (existingItem) {
      // Update existing item quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + item.quantity,
          total: (existingItem.quantity + item.quantity) * price,
        },
      });
    } else {
      // Add new item to cart
      await this.prisma.cartItem.create({
        data: {
          cart: { connect: { id: cartId } },
          product: { connect: { id: item.productId } },
          variant: item.variantId ? { connect: { id: item.variantId } } : undefined,
          quantity: item.quantity,
          price,
          total: item.quantity * price,
        },
      });
    }
    
    // Recalculate cart totals
    await this.recalculateCartTotals(cartId);
    
    // Return updated cart
    return this.findById(cartId) as Promise<Cart>;
  }

  async updateItem(cartItemId: string, data: UpdateCartItemInput): Promise<Cart> {
    // Get the cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { cartId: true, price: true },
    });
    
    if (!cartItem) {
      throw new Error(`Cart item with ID ${cartItemId} not found`);
    }
    
    // Update the cart item
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: data.quantity,
        total: data.quantity * cartItem.price,
      },
    });
    
    // Recalculate cart totals
    await this.recalculateCartTotals(cartItem.cartId);
    
    // Return updated cart
    return this.findById(cartItem.cartId) as Promise<Cart>;
  }

  async removeItem(cartItemId: string): Promise<Cart> {
    // Get the cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { cartId: true },
    });
    
    if (!cartItem) {
      throw new Error(`Cart item with ID ${cartItemId} not found`);
    }
    
    // Remove the cart item
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });
    
    // Recalculate cart totals
    await this.recalculateCartTotals(cartItem.cartId);
    
    // Return updated cart
    return this.findById(cartItem.cartId) as Promise<Cart>;
  }

  async clearCart(cartId: string): Promise<Cart> {
    // Remove all items from cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
    
    // Reset cart totals
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        promoCode: { disconnect: true },
      },
    });
    
    // Return updated cart
    return this.findById(cartId) as Promise<Cart>;
  }

  async applyPromoCode(cartId: string, code: string): Promise<Cart> {
    // Find the promo code
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code },
    });
    
    if (!promoCode) {
      throw new Error(`Promo code ${code} not found`);
    }
    
    // Check if promo code is expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      throw new Error(`Promo code ${code} has expired`);
    }
    
    // Apply promo code to cart
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        promoCode: { connect: { id: promoCode.id } },
      },
    });
    
    // Recalculate cart totals
    await this.recalculateCartTotals(cartId);
    
    // Return updated cart
    return this.findById(cartId) as Promise<Cart>;
  }

  async removePromoCode(cartId: string): Promise<Cart> {
    // Remove promo code from cart
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        promoCode: { disconnect: true },
      },
    });
    
    // Recalculate cart totals
    await this.recalculateCartTotals(cartId);
    
    // Return updated cart
    return this.findById(cartId) as Promise<Cart>;
  }

  private async recalculateCartTotals(cartId: string): Promise<void> {
    // Get cart with items and promo code
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: true,
        promoCode: true,
      },
    });
    
    if (!cart) {
      throw new Error(`Cart with ID ${cartId} not found`);
    }
    
    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    
    // Calculate discount based on promo code
    let discount = 0;
    if (cart.promoCode) {
      discount = cart.promoCode.isPercentage
        ? subtotal * (cart.promoCode.discount / 100)
        : Math.min(cart.promoCode.discount, subtotal); // Don't allow discount to exceed subtotal
    }
    
    // Calculate tax (assuming tax rate is stored in cart)
    const taxRate = 0.1; // 10% tax rate (should be configurable)
    const tax = (subtotal - discount) * taxRate;
    
    // Calculate shipping (could be based on weight, location, etc.)
    const shipping = subtotal > 0 ? 10 : 0; // Free shipping over $100 (should be configurable)
    
    // Calculate total
    const total = subtotal - discount + tax + shipping;
    
    // Update cart totals
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        discount,
        tax,
        shipping,
        total,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.cart.delete({
      where: { id },
    });
    return true;
  }
}