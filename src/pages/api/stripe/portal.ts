import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method!=='POST') return res.status(405).json({ error:'Method not allowed' });
  try {
    const { email, returnUrl } = req.body || {};
    if (!email) return res.status(400).json({ error:'Email richiesta' });

    if (!stripeKey) {
      // fallback demo
      return res.status(200).json({ url: (returnUrl || '/') + '?portal=demo' });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return res.status(404).json({ error:'Cliente non trovato' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl || 'http://localhost:3000'
    });

    return res.status(200).json({ url: session.url });
  } catch (e:any) {
    return res.status(500).json({ error: e.message || 'Stripe error' });
  }
}
