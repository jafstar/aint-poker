import { NextResponse } from 'next/server';
import { generateScene } from '../../../lib/cartoon';

export async function POST(request) {
  try {
    const { situation } = await request.json().catch(() => ({}));
    const scene = await generateScene(process.env.ANTHROPIC_API_KEY, situation);
    return NextResponse.json(scene);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
