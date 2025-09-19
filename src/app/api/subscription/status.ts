// app/api/subscription/status/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";      // Stripe richiede Node runtime
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email richiesta" }, { status: 400 });

    if (!stripeKey) {
      // fallback demo: senza Stripe consideriamo tutti inattivi
      return NextResponse.json({ active: false, tier: null });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return NextResponse.json({ active: false, tier: null });

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      expand: ["data.items.price.product"],
    });

    const activeSub = subs.data.find((s) =>
      ["active", "trialing", "past_due", "unpaid"].includes(s.status)
    );
    if (!activeSub) return NextResponse.json({ active: false, tier: null });

    const price = activeSub.items.data[0]?.price;
    const productName = (price?.product as any)?.name || "";
    let tier: "pro" | "business" | "business_plus" | "unknown" = "unknown";
    const priceId = price?.id || "";
    if (priceId === process.env.STRIPE_PRICE_ID) tier = "pro";
    else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) tier = "business";
    else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS_PLUS) tier = "business_plus";

    return NextResponse.json({ active: true, tier, productName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Stripe error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
