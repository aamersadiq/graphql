import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import FeaturedProducts from '@/components/products/FeaturedProducts';
import CategoryList from '@/components/categories/CategoryList';
import PromotionBanner from '@/components/promotions/PromotionBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden rounded-xl">
        <Image
          src="/images/hero.jpg"
          alt="E-Commerce Hero"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white p-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Welcome to Our E-Commerce Store
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl text-center">
            Discover amazing products with great deals and secure shopping experience
          </p>
          <Link 
            href="/products" 
            className="btn-primary text-lg px-8 py-3"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Shop by Category</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <CategoryList featured={true} />
        </Suspense>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Promotions */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Current Promotions</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <PromotionBanner />
        </Suspense>
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4 text-blue-600 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Free shipping on all orders over $50
          </p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4 text-blue-600 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Secure Payment</h3>
          <p className="text-gray-600 dark:text-gray-300">
            100% secure payment processing
          </p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4 text-blue-600 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Easy Returns</h3>
          <p className="text-gray-600 dark:text-gray-300">
            30-day return policy for all products
          </p>
        </div>
      </section>
    </div>
  );
}