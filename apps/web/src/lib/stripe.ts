import { loadStripe } from '@stripe/stripe-js';

// This is a singleton to ensure we only instantiate Stripe once.
let stripePromise: any;

/**
 * Returns a Stripe instance for client-side use
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
      : '';
      
    if (!key) {
      console.warn('Stripe publishable key is not set in environment variables');
    }
    
    stripePromise = loadStripe(key || '');
  }
  return stripePromise;
};

/**
 * Response from the payment intent creation API
 */
export interface PaymentIntentResponse {
  paymentIntent: {
    clientSecret: string;
    amount: number;
    currency: string;
    paymentMethodTypes: string[];
  };
  ephemeralKey: string;
  customer: string;
}

/**
 * Creates a payment intent on the server
 */
export const createPaymentIntent = async (
  amount: number, 
  currency = 'usd', 
  metadata: Record<string, string> = {}
): Promise<PaymentIntentResponse> => {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirms a payment with Stripe
 */
export const confirmPayment = async (clientSecret: string, paymentMethod: any) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe has not been initialized');
  }

  return stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });
};

/**
 * Processes a payment from start to finish
 */
export const processPayment = async (
  amount: number, 
  paymentMethod: any, 
  currency = 'usd', 
  metadata: Record<string, string> = {}
) => {
  try {
    // 1. Create a payment intent
    const { paymentIntent } = await createPaymentIntent(amount, currency, metadata);
    
    // 2. Confirm the payment
    const result = await confirmPayment(paymentIntent.clientSecret, paymentMethod);
    
    if (result.error) {
      throw new Error(result.error.message || 'Payment failed');
    }
    
    return result;
  } catch (error: any) {
    console.error('Error processing payment:', error);
    throw error;
  }
};