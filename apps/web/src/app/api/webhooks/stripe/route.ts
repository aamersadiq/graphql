import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Webhook secret for verifying the event
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get the raw body as a buffer
    const rawBody = await req.text();
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { message: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Verify the event
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { message: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        
        // Update order status in your database
        await handleSuccessfulPayment(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${failedPaymentIntent.last_payment_error?.message}`);
        
        // Update order status in your database
        await handleFailedPayment(failedPaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook: ${err.message}`);
    return NextResponse.json(
      { message: `Webhook error: ${err.message}` },
      { status: 500 }
    );
  }
}

// Helper functions to handle payment events
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  // Extract metadata from the payment intent
  const { userId, orderId } = paymentIntent.metadata || {};
  
  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }
  
  try {
    // Here you would update your database
    // For example, using a GraphQL mutation to update the order status
    
    // Example GraphQL mutation (pseudo-code)
    // await apolloClient.mutate({
    //   mutation: UPDATE_ORDER_STATUS,
    //   variables: {
    //     orderId,
    //     status: 'PAID',
    //     paymentId: paymentIntent.id,
    //     paymentAmount: paymentIntent.amount / 100, // Convert from cents
    //   },
    // });
    
    console.log(`Order ${orderId} marked as paid`);
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  // Extract metadata from the payment intent
  const { userId, orderId } = paymentIntent.metadata || {};
  
  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }
  
  try {
    // Here you would update your database
    // For example, using a GraphQL mutation to update the order status
    
    // Example GraphQL mutation (pseudo-code)
    // await apolloClient.mutate({
    //   mutation: UPDATE_ORDER_STATUS,
    //   variables: {
    //     orderId,
    //     status: 'PAYMENT_FAILED',
    //     failureReason: paymentIntent.last_payment_error?.message,
    //   },
    // });
    
    console.log(`Order ${orderId} marked as payment failed`);
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

// This is needed to parse the raw body as a buffer
export const config = {
  api: {
    bodyParser: false,
  },
};