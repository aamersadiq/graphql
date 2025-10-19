import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to create a payment intent' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { amount, currency = 'usd', metadata = {} } = await request.json();
    
    if (!amount || amount < 1) {
      return NextResponse.json(
        { message: 'Amount is required and must be at least 1' },
        { status: 400 }
      );
    }
    
    // Create a customer if one doesn't exist
    let customerId: string;
    
    // In a real app, you would store the customer ID in your database
    // and retrieve it here based on the user's ID
    const customerEmail = session.user?.email;
    
    if (!customerEmail) {
      return NextResponse.json(
        { message: 'User email is required' },
        { status: 400 }
      );
    }
    
    // Check if customer exists
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: session.user?.id || '',
        },
      });
      
      customerId = customer.id;
    }
    
    // Create an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        userId: session.user?.id || '',
      },
    });
    
    // Return the payment intent client secret
    return NextResponse.json({
      paymentIntent: {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethodTypes: paymentIntent.payment_method_types,
      },
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}