import { NextResponse } from 'next/server';
import { playHand } from '../../../lib/game';

// Server-side only — the Anthropic key never reaches the browser.
export async function POST() {
  try {
    const hand = await playHand(process.env.ANTHROPIC_API_KEY);
    return NextResponse.json(hand);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
