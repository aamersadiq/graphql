'use client';

import CheckoutForm from '@/components/checkout/CheckoutForm';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { cart, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Check if cart is empty
    if (cart.length === 0 && !isLoading) {
      router.push('/cart');
    } else {
      setIsLoading(false);
    }
  }, [cart, router, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="border-t border-b py-4 mb-4">
            <div className="flex justify-between font-medium mb-2">
              <span>Items ({totalItems}):</span>
              <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Tax:</span>
              <span>Calculated at next step</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Order Total:</span>
            <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
          </div>
        </div>
        
        <StripeProvider>
          <CheckoutForm />
        </StripeProvider>
      </div>
    </div>
  );
}