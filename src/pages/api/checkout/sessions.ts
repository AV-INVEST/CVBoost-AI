import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

/**
 * POST /api/checkout/sessions
 * Body: { tier?: 'pro' | 'business' | 'business_plus', successUrl?: string, cancelUrl?: string }
 * Env:
 *  - STRIPE_SECRET_KEY
 *  - STRIPE_PRICE_ID              (Pro)
 *  - STRIPE_PRICE_ID_BUSINESS     (Business)
 *  - STRIPE_PRICE_ID_BUSINESS_PLUS(Business+)
 */
export default async function checkout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tier = 'pro', successUrl, cancelUrl } = req.body || {};

  const priceMap: Record<string, string | undefined> = {
    pro: process.env.STRIPE_PRICE_ID,
    business: process.env.STRIPE_PRICE_ID_BUSINESS,
    business_plus: process.env.STRIPE_PRICE_ID_BUSINESS_PLUS,
  };
  const priceId = priceMap[tier];

  // Fallback DEMO: se mancano chiavi/price, non blocchiamo il flusso.
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    const url = (successUrl || 'http://localhost:3000') + `?checkout=demo&tier=${tier}`;
    return res.status(200).json({ url, demo: true });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId!, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: successUrl || 'http://localhost:3000?checkout=success',
      cancel_url: cancelUrl || 'http://localhost:3000?checkout=cancel',
    });
    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || 'Stripe error' });
  }
}
