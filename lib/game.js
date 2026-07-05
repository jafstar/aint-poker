// aint.poker — the real game engine, proven working tonight in poker-party.mjs,
// now wired for the web. Same six personalities, same starting balances
// (tuned to match who they are), same Durstenfeld shuffle used everywhere
// else in the colony.

import Anthropic from '@anthropic-ai/sdk';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const PLAYERS = [
  { name: 'Zoë', balance: 5100, personality: "Classic player making all the right moves but sly and slick without letting anyone know what she may be up to." },
  { name: 'Sammi', balance: 50000, personality: "The smartest and richest at the table, warrants the respect as the wisest and loose with her giant stack." },
  { name: 'Cali', balance: 2400, personality: "The aggressive type but isn't scared to be lazy at times, always knows how to avoid trouble." },
  { name: 'Penny', balance: 1500, personality: "The most laid back of the bunch, caught up in the social mix, doesn't care a hoot if she wins or loses." },
  { name: 'Baloo', balance: 500, personality: "Ultra aggressive, doesn't know where the boundaries are, high risk high reward, loves to go All In." },
  { name: 'Lilly', balance: 5000, personality: "The tightest and most technical, 99% of the time won't ever bluff, or at least makes you think she doesn't." },
];

function freshDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(r + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function rankValue(card) { return RANKS.indexOf(card.slice(0, -1)) + 2; }

function scoreHand(hand) {
  const values = hand.map(rankValue).sort((a, b) => b - a);
  const suits = hand.map(c => c.slice(-1));
  const isFlush = suits.every(s => s === suits[0]);
  const uniqueVals = [...new Set(values)];
  const isStraight = uniqueVals.length === 5 && (uniqueVals[0] - uniqueVals[4] === 4);
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countVals = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const tiebreak = values.reduce((acc, v) => acc * 100 + v, 0);

  if (isStraight && isFlush) return { rank: 8, tiebreak, name: 'Straight Flush' };
  if (countVals[0][1] === 4) return { rank: 7, tiebreak, name: 'Four of a Kind' };
  if (countVals[0][1] === 3 && countVals[1]?.[1] === 2) return { rank: 6, tiebreak, name: 'Full House' };
  if (isFlush) return { rank: 5, tiebreak, name: 'Flush' };
  if (isStraight) return { rank: 4, tiebreak, name: 'Straight' };
  if (countVals[0][1] === 3) return { rank: 3, tiebreak, name: 'Three of a Kind' };
  if (countVals[0][1] === 2 && countVals[1]?.[1] === 2) return { rank: 2, tiebreak, name: 'Two Pair' };
  if (countVals[0][1] === 2) return { rank: 1, tiebreak, name: 'One Pair' };
  return { rank: 0, tiebreak, name: 'High Card' };
}

function evaluate7(cards) {
  const combos = [];
  function pick5(start, chosen) {
    if (chosen.length === 5) { combos.push([...chosen]); return; }
    for (let i = start; i < 7; i++) { chosen.push(cards[i]); pick5(i + 1, chosen); chosen.pop(); }
  }
  pick5(0, []);
  let best = null;
  for (const hand of combos) {
    const score = scoreHand(hand);
    if (!best || score.rank > best.rank || (score.rank === best.rank && score.tiebreak > best.tiebreak)) best = score;
  }
  return best;
}

async function askDecision(client, player, situation) {
  const prompt = `You are ${player.name}, playing Texas Hold'em poker. Your personality: ${player.personality}\n\nSituation: ${situation}\n\nRespond with exactly one line: your action (check/call/raise/fold/all-in), then a dash, then one short sentence of in-character flavor.`;
  const res = await client.messages.create({
    model: 'claude-sonnet-5', max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = res.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text.trim() : `${player.name} stares blankly (no response)`;
}

export async function playHand(apiKey) {
  const client = new Anthropic({ apiKey });
  const deck = freshDeck();
  const hands = {};
  for (const p of PLAYERS) hands[p.name] = [deck.pop(), deck.pop()];

  const board = [];
  const stages = [{ label: 'Flop', draw: 3 }, { label: 'Turn', draw: 1 }, { label: 'River', draw: 1 }];
  const rounds = [];

  for (const stage of stages) {
    for (let i = 0; i < stage.draw; i++) board.push(deck.pop());
    const decisions = [];
    for (const p of PLAYERS) {
      const situation = `Board so far: ${board.join(' ')}. Your hole cards: ${hands[p.name].join(' ')}. Your balance: $${p.balance}.`;
      const decision = await askDecision(client, p, situation);
      decisions.push({ player: p.name, decision });
    }
    rounds.push({ stage: stage.label, board: [...board], decisions });
  }

  const results = PLAYERS.map(p => {
    const score = evaluate7([...hands[p.name], ...board]);
    return { name: p.name, hand: hands[p.name], handName: score.name, rank: score.rank, tiebreak: score.tiebreak };
  }).sort((a, b) => b.rank - a.rank || b.tiebreak - a.tiebreak);

  return { hands, board, rounds, results, winner: results[0].name };
}
