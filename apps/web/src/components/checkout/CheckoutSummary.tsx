import Image from 'next/image';
import { formatCurrency } from '@/utils/format';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
}

interface CheckoutSummaryProps {
  cart: Cart;
}

export default function CheckoutSummary({ cart }: CheckoutSummaryProps) {
  // Calculate shipping cost based on cart total
  const getShippingCost = () => {
    if (cart.total >= 100) {
      return 0; // Free shipping for orders over $100
    }
    return 5.99;
  };

  const shippingCost = getShippingCost();
  const finalTotal = cart.total + shippingCost;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center">
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={item.product.imageUrl || '/images/placeholder.jpg'}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>
      
      {/* Price Breakdown */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(cart.subtotal)}
          </p>
        </div>
        
        {cart.discountAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-sm text-green-600 dark:text-green-400">
              Discount {cart.couponCode && `(${cart.couponCode})`}
            </p>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              -{formatCurrency(cart.discountAmount)}
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Shipping</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
          </p>
        </div>
        
        <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">Total</p>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(finalTotal)}
          </p>
        </div>
      </div>
      
      {/* Promotion Code */}
      {!cart.couponCode && (
        <div className="mt-6">
          <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Promo Code
          </label>
          <div className="flex">
            <input
              type="text"
              id="promo-code"
              className="form-input rounded-r-none flex-1"
              placeholder="Enter code"
            />
            <button
              type="button"
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
      
      {/* Secure Checkout Notice */}
      <div className="mt-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secure Checkout
      </div>
    </div>
  );
}