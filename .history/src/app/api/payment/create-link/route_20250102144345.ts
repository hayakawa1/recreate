import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { amount, description } = data;

    const paymentLink = await stripe.paymentLinks.create({
      amount: amount,
      currency: 'jpy',
      description: description || 'ReCreate リクエスト',
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return new NextResponse('Payment link creation failed', { status: 500 });
  }
} 