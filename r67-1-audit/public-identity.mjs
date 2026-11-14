// r35 (Claude, 24 Oct 2026): the ONE rule for "may the opponent know which card moved?" (Alexis Rhodes, rules ruling
// "r35-public-identity-rulings-alexis-2026-10-23"; Seto L1-L4, 23 Oct 21:40 / 21:45). Used by duel.mjs for the move
// event's code AND the log's concealed flag (L1), and by the Fusion-materials panel and the summon scene (P6), so there
// is no second path.
// Name the card if (a) its SOURCE was public at the moment of the move, or (b) its DESTINATION is public, or
// (c) it was revealed and the reveal still applies. Otherwise code 0.
//  - Public: face-up field (Monster Zones, Spell/Trap Zones incl. Pendulum and Field Zone), the GY, face-up banished,
//    face-up Extra Deck (Pendulums), Xyz Materials (the core reports an overlay source as a face-up Monster Zone card).
//  - Private: the Deck, the hand, face-down field cards (Set / face-down Defense), face-down banished, face-down Extra Deck.
//  - L2: (c) is DEFERRED in r35. A revealed hand card moving to a private place stays hidden (under-naming, legal).
//  - L3 (Seto): a face-up card bounced from the field to the hand is named by (a); a face-down one stays hidden.
//  - Deck sources are private: a search is made public by the script's ConfirmCards, a mill by its public destination.
// "Position at the moment of the move" = the position in the engine's MOVE message, never a remembered earlier state.
const FACE_UP = 5; // POS_FACEUP_ATTACK | POS_FACEUP_DEFENSE
const PLACES = [4, 8, 32, 64]; // places where face-up / face-down decides
export function publicSource(from) {
  const l = from?.location || 0;
  if (l === 16) return true;
  if (PLACES.includes(l)) return !!(from.position & FACE_UP);
  return false; // Deck, hand, or no place
}
// Unchanged from r34 (the old destination-only test): private only for the Deck, the hand, or a face-down place.
export function publicDestination(to) {
  const l = to?.location || 0;
  if (l === 1 || l === 2) return false;
  if (PLACES.includes(l)) return !!(to.position & FACE_UP);
  return true; // GY, leaving play (Tokens), overlay
}
export function publicMove(from, to) { return publicSource(from) || publicDestination(to); }
