import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json();

    if (!plan || !['pro', 'lifetime'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // For now, simulate successful checkout
    // In production, integrate with actual Stripe
    return NextResponse.json({ 
      sessionId: 'simulated_session_id',
      url: '#'
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
