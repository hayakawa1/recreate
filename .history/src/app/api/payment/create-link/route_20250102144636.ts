import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { amount, description } = data;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'jpy',
            unit_amount: amount,
            product_data: {
              name: description || 'ReCreate リクエスト',
            },
          },
        },
      ],
      success_url: 'https://ea5484996bc2.ngrok.app/requests/sent',
      cancel_url: 'https://ea5484996bc2.ngrok.app/requests/sent',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return new NextResponse('Payment link creation failed', { status: 500 });
  }
} 