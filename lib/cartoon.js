// Cartoons — same proven personality engine as the poker table, pointed at
// a different output: instead of poker actions, each character reacts to a
// real situation in their own voice, panel by panel.

import Anthropic from '@anthropic-ai/sdk';
import { PLAYERS } from './game';

async function askLine(client, character, situation) {
  const prompt = `You are ${character.name}, a cartoon character. Your personality: ${character.personality}\n\nScene: ${situation}\n\nGive your one-line reaction, in character. No stage directions, just the line you'd actually say. Keep it under 20 words.`;
  const res = await client.messages.create({
    model: 'claude-sonnet-5', max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = res.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text.trim().replace(/^["']|["']$/g, '') : '...';
}

const SITUATIONS = [
  "Someone just ate the last slice of pizza without asking.",
  "The power just went out during movie night.",
  "Someone found $20 on the sidewalk.",
  "It's 3am and someone's phone won't stop buzzing.",
  "The group chat just got a message that says 'we need to talk.'",
  "Someone brought a stray dog home without telling anyone.",
  "The wifi just went down mid-game.",
  "Someone's cooking smells like it's on fire.",
];

export async function generateScene(apiKey, situation) {
  const client = new Anthropic({ apiKey });
  const scenario = situation || SITUATIONS[Math.floor(Math.random() * SITUATIONS.length)];
  const panels = [];
  for (const p of PLAYERS) {
    const line = await askLine(client, p, scenario);
    panels.push({ name: p.name, line });
  }
  return { scenario, panels };
}
