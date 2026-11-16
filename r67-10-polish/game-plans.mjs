import {isBrandedNov08,brandedNov08Book} from './ai/book/branded-nov08.mjs';
import branded from './plans/branded.mjs';import mikanko from './plans/mikanko.mjs';import sky from './plans/sky.mjs';import luna from './plans/luna.mjs';
export const GAME_PLANS={branded,mikanko,sky,luna};
const nov08={id:'branded',source:'MetaGamesGX Pure Branded 41 · 10 Nov video TEST',starters:brandedNov08Book.starters,
 first:['Use a live Fusion route','Keep Ecclesia/Cartesia follow-up','Resolve Nadir after Extra Deck plays'],
 second:['Use original Albaz or Super Polymerization on a legal opposing board','Keep a second Fusion route after disruption'],
 lines:[['Aluber the Jester of Despia','Branded Fusion','Lubellion the Searing Dragon','Mirrorjade the Iceblade Dragon'],['Springans Kitt','Branded Fusion'],['Fallen of the White Dragon','Incredible Ecclesia, the Virtuous','Choose the offered Level 8 Synchro or an Albaz board breaker'],['Nadir Servant','Despian Luluwalilith','Guiding Quem, the Virtuous']]};
export function openingPlan(d,seat){const scoped=isBrandedNov08(d.decks[seat]),profile=scoped?nov08:GAME_PLANS[d.decks[seat]?.id];if(!profile)return null;const hand=d.zone(seat,2).filter(Boolean).map(c=>d.name(c.code)),starters=profile.starters.filter(n=>hand.includes(n));return {deck:profile.id,starter:starters[0]||null,availableStarters:starters,target:profile[seat===d.order[0]?'first':'second'],line:profile.lines.find(line=>starters.includes(line[0]))||(scoped?[]:profile.lines[0]),source:profile.source};}
