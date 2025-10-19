import Stripe from 'stripe';
import { paymentRepository, paymentMethodRepository } from '@e-commerce/database';

// Initialize Stripe with API key from environment variables
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key';
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string,
    paymentMethodId?: string,
    metadata?: any,
  ) {
    try {
      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: paymentMethodId ? true : false,
        confirmation_method: 'manual',
        metadata: {
          orderId,
          ...metadata,
        },
      });
      
      // Create a record in our database
      await paymentRepository.create({
        orderId,
        amount,
        currency,
        status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
        provider: 'STRIPE',
        providerPaymentId: paymentIntent.id,
        paymentMethodId,
        metadata: paymentIntent,
      });
      
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        currency,
        status: paymentIntent.status,
        paymentMethod: paymentMethodId ? { id: paymentMethodId } : null,
        metadata: paymentIntent,
        createdAt: new Date(paymentIntent.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${(error as Error).message}`);
    }
  }
  
  /**
   * Confirm a payment intent with Stripe
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      // Confirm the payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      
      // Update the payment record in our database
      const payment = await paymentRepository.findMany({
        filter: { 
          status: ['PENDING', 'PROCESSING', 'AUTHORIZED'],
        },
      });
      
      const matchingPayment = payment.items.find(p => p.providerPaymentId === paymentIntentId);
      
      if (matchingPayment) {
        await paymentRepository.update(matchingPayment.id, {
          status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
          paymentMethodId,
          metadata: paymentIntent,
        });
      }
      
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: { id: paymentMethodId },
        metadata: paymentIntent,
        createdAt: new Date(paymentIntent.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw new Error(`Failed to confirm payment intent: ${(error as Error).message}`);
    }
  }
  
  /**
   * Create a payment method with Stripe
   */
  async createPaymentMethod(
    userId: string,
    type: string,
    token: string,
    billingDetails: any,
    isDefault: boolean = false,
  ) {
    try {
      // Create a payment method with Stripe
      const stripePaymentMethod = await stripe.paymentMethods.create({
        type: type.toLowerCase(),
        card: {
          token,
        },
        billing_details: {
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: {
            line1: billingDetails.addressLine1,
            line2: billingDetails.addressLine2 || '',
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.postalCode,
            country: billingDetails.country,
          },
        },
      });
      
      // Create a customer if not exists
      let customer;
      const customers = await stripe.customers.list({
        email: billingDetails.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: billingDetails.email,
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          phone: billingDetails.phone,
          address: {
            line1: billingDetails.addressLine1,
            line2: billingDetails.addressLine2 || '',
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.postalCode,
            country: billingDetails.country,
          },
        });
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(stripePaymentMethod.id, {
        customer: customer.id,
      });
      
      // Create a record in our database
      const paymentMethod = await paymentMethodRepository.create({
        userId,
        type: type.toUpperCase(),
        provider: 'STRIPE',
        isDefault,
        lastFour: stripePaymentMethod.card?.last4,
        expiryMonth: stripePaymentMethod.card?.exp_month,
        expiryYear: stripePaymentMethod.card?.exp_year,
        cardBrand: stripePaymentMethod.card?.brand,
        billingAddress: {
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          addressLine1: billingDetails.addressLine1,
          addressLine2: billingDetails.addressLine2 || '',
          city: billingDetails.city,
          state: billingDetails.state,
          postalCode: billingDetails.postalCode,
          country: billingDetails.country,
          phone: billingDetails.phone,
          isDefault: true,
        },
        metadata: {
          stripePaymentMethodId: stripePaymentMethod.id,
          stripeCustomerId: customer.id,
        },
      });
      
      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error(`Failed to create payment method: ${(error as Error).message}`);
    }
  }
  
  /**
   * Process a refund with Stripe
   */
  async processRefund(
    paymentId: string,
    amount: number,
    reason: string,
    metadata?: any,
  ) {
    try {
      // Get the payment from our database
      const payment = await paymentRepository.findById(paymentId);
      
      if (!payment) {
        throw new Error(`Payment with ID ${paymentId} not found`);
      }
      
      if (payment.provider !== 'STRIPE') {
        throw new Error(`Payment provider ${payment.provider} not supported for refunds`);
      }
      
      // Process the refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.providerPaymentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: this.mapRefundReason(reason),
        metadata: {
          paymentId,
          ...metadata,
        },
      });
      
      // Create a refund record in our database
      const updatedPayment = await paymentRepository.createRefund(
        paymentId,
        amount,
        reason,
        refund.id,
        refund,
      );
      
      // Find the created refund
      const createdRefund = updatedPayment.refunds.find(r => r.providerRefundId === refund.id);
      
      if (!createdRefund) {
        throw new Error('Refund was created but not found in the database');
      }
      
      return createdRefund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${(error as Error).message}`);
    }
  }
  
  /**
   * Map Stripe payment intent status to our payment status
   */
  private mapStripeStatusToPaymentStatus(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'PENDING';
      case 'processing':
        return 'PROCESSING';
      case 'requires_capture':
        return 'AUTHORIZED';
      case 'succeeded':
        return 'COMPLETED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'FAILED';
    }
  }
  
  /**
   * Map refund reason to Stripe refund reason
   */
  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    if (reason.toLowerCase().includes('duplicate')) {
      return 'duplicate';
    } else if (reason.toLowerCase().includes('fraud')) {
      return 'fraudulent';
    } else {
      return 'requested_by_customer';
    }
  }
}

export const stripeService = new StripeService();