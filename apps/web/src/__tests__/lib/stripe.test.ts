import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStripe, createPaymentIntent, confirmPayment, processPayment } from '@/lib/stripe';

// Mock the loadStripe function from @stripe/stripe-js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmCardPayment: vi.fn(() => Promise.resolve({ paymentIntent: { status: 'succeeded' } })),
  })),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Stripe Library', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Mock environment variable
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
    
    // Setup fetch mock to return successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        paymentIntent: {
          clientSecret: 'pi_secret_123',
          amount: 1000,
          currency: 'usd',
          paymentMethodTypes: ['card'],
        },
        ephemeralKey: 'ek_123',
        customer: 'cus_123',
      }),
    });
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('getStripe', () => {
    it('should return a Stripe instance', async () => {
      const stripe = getStripe();
      expect(stripe).toBeDefined();
    });

    it('should only create one instance of Stripe', () => {
      const stripe1 = getStripe();
      const stripe2 = getStripe();
      expect(stripe1).toBe(stripe2);
    });
  });

  describe('createPaymentIntent', () => {
    it('should call the API with correct parameters', async () => {
      const amount = 1000;
      const currency = 'usd';
      const metadata = { orderId: '123' };

      await createPaymentIntent(amount, currency, metadata);

      expect(global.fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
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
    });

    it('should return payment intent data on success', async () => {
      const result = await createPaymentIntent(1000);
      
      expect(result).toEqual({
        paymentIntent: {
          clientSecret: 'pi_secret_123',
          amount: 1000,
          currency: 'usd',
          paymentMethodTypes: ['card'],
        },
        ephemeralKey: 'ek_123',
        customer: 'cus_123',
      });
    });

    it('should throw an error when API call fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Payment failed' }),
      });

      await expect(createPaymentIntent(1000)).rejects.toThrow('Payment failed');
    });
  });

  describe('confirmPayment', () => {
    it('should call stripe.confirmCardPayment with correct parameters', async () => {
      const clientSecret = 'pi_secret_123';
      const paymentMethod = { id: 'pm_123' };

      const stripe = await getStripe();
      const confirmCardPaymentSpy = vi.spyOn(stripe, 'confirmCardPayment');

      await confirmPayment(clientSecret, paymentMethod);

      expect(confirmCardPaymentSpy).toHaveBeenCalledWith(clientSecret, {
        payment_method: paymentMethod,
      });
    });
  });

  describe('processPayment', () => {
    it('should create a payment intent and confirm it', async () => {
      const amount = 1000;
      const paymentMethod = { id: 'pm_123' };
      
      const createPaymentIntentSpy = vi.spyOn({ createPaymentIntent }, 'createPaymentIntent');
      const confirmPaymentSpy = vi.spyOn({ confirmPayment }, 'confirmPayment');
      
      await processPayment(amount, paymentMethod);
      
      expect(createPaymentIntentSpy).toHaveBeenCalledWith(amount, 'usd', {});
      expect(confirmPaymentSpy).toHaveBeenCalledWith('pi_secret_123', paymentMethod);
    });
  });
});