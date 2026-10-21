import {PRESENTATION_OVERRIDES} from './effect-overrides.mjs';
import {decodeEffectId} from './effect-id.mjs';
import {EFFECT_CLAUSES,EFFECT_ZONES} from './effect-clauses.mjs';
import {EFFECT_CLAUSES_TCG,PRESENTATION_EXCERPTS_TCG} from './effect-clauses-tcg.mjs'; // r22: TCG-wording clauses, used only when the shown text is the TCG text
// Exact engine Stringid indices, paired with literal text excerpts in the bundled
// card database. Unknown effects retain their engine label and full card text.
const focus={
 57103969:[/When this card is activated:.*?your hand\./s],
 44146295:[/Once per turn \(Quick Effect\):.*?next turn\./s,/If your opponent makes.*$/s],
 37818794:[/During your Main Phase:.*?original ATK\./s,/Once per turn, when a card or effect.*$/s],
 57566760:[/If this card is Special Summoned:.*?your hand\./s,/If this card attacks and battles,.*$/s],
 35618217:[/Once per turn:.*?this turn\./s,/If this card is sent to the GY.*?your hand\./s,/If this card is banished:.*$/s],
 43527730:[/The equipped monster cannot.*?effects\./s,/During your Main Phase:.*?the hand\./s],
 63288573:[/If this card is Special Summoned:.*?your hand\./s],
 8491308:[/After damage calculation,.*$/s],
 90673288:[/Once per turn, during the End Phase,.*$/s],
 62962630:[/If this card is Normal or Special Summoned:.*?your hand\./s,/If a face-up Fusion Monster.*$/s],
 70534340:[/If this card is Fusion Summoned:.*?banished cards\./s],
 87746184:[/If this card is Fusion Summoned:.*?field, or GY\./s,/Once per turn, during the End Phase,.*$/s],
 80044027:[/Special Summon 1 "Mikanko".*?effects\./s,/then you can Special Summon.*?effects\./s],
 63166095:[/then, if you have 3 or more Spells.*$/s]
};
const labels={
36637374:{zero:'Discard 1 card, then take a Despia monster from your Deck: add it to your hand or Special Summon it in Defense Position. After resolution, only Fusion Monsters can be Special Summoned from your Extra Deck for the rest of this turn.',0:'Discard 1 card, then take a Despia monster from your Deck: add it to your hand or Special Summon it in Defense Position. After resolution, only Fusion Monsters can be Special Summoned from your Extra Deck for the rest of this turn.'},
42141493:{0:'If you control no cards (Quick Effect): you may discard this card to gain these effects for this turn. Draw 1 immediately whenever your opponent Special Summons from their Deck, Extra Deck, or both. At this turn’s End Phase, count the cards your opponent controls and add 6. If you hold more than that many cards, randomly shuffle cards from your hand into your Deck until you hold exactly that many. You may activate only 1 other Mulcharmy monster effect during this turn.'},
50005218:{0:'Excavate and search',2:'GY trigger · Summon a Sky Striker Ace'},
83190280:{0:'Pendulum effect · Revive a Lunalight',1:'Destruction trigger · Revive a Lunalight'},
47705572:{0:'Pendulum effect · Fusion Summon'},
9839945:{0:'Revive a LIGHT monster',1:'Search a LIGHT monster'},
88753594:{0:'GY effect · Boost a Fusion Monster'},
98127546:{0:'On Link Summon · Negate opposing monsters',1:'Quick Effect · Negate a GY summon'}
};
export function effectFocus(code,description,db,context={}){
 const card=db[code];if(!card)return null;
 const text=(card.desc||'').split(/\r?\n\r?\n\* The above text/)[0].trim();
 let index=null,n=0n;try{n=BigInt(description||0);const decoded=decodeEffectId(n);if(decoded.code===(card.alias||code)||decoded.code===code)index=decoded.index}catch{}
 const override=PRESENTATION_OVERRIDES[code+':'+String(n)];if(override?.noEffect)return {text,excerpt:null,mapped:true,noEffect:true,label:override.label,index};
 const official=card.strings?.[index]?.trim();
 const label=override?.label||(index===null?'Full printed effect':labels[code]?.[index]||official||'Active printed effect');
 const key=n===0n?'zero':index,location=context.effectLocation??context.location;
 const tcgOf=t=>t&&text.includes(t)?t:null,overrideExcerpt=override?.excerpt&&!text.includes(override.excerpt)?tcgOf(PRESENTATION_EXCERPTS_TCG[code+':'+String(n)])||override.excerpt:override?.excerpt,clause=EFFECT_CLAUSES[code]?.[key]&&!text.includes(EFFECT_CLAUSES[code][key])?tcgOf(EFFECT_CLAUSES_TCG[code]?.[key])||EFFECT_CLAUSES[code][key]:EFFECT_CLAUSES[code]?.[key];
 let excerpt=overrideExcerpt||EFFECT_ZONES[code]?.[key]?.[location]||clause||(index!==null?text.match(focus[code]?.[index]||/^(?!)$/)?.[0]?.trim():null);
 // A single non-persistent Spell/Trap activation with a zero description uses
 // its printed text as a whole; it has no indexed clause to invent.
 const whole=index===null&&n===0n&&(card.type&(2|4))&&!(card.type&(131072|262144|524288|16777216))&&(text.match(/\./g)||[]).length<=1;
 if(code===57103969&&n===0n)excerpt=text.match(focus[57103969][0])?.[0];
 const fullExcerpt=excerpt||(whole?text:null);if(context.type==='resolve'&&excerpt){const semicolon=excerpt.indexOf(';'),colon=excerpt.indexOf(':');const split=semicolon>=0?semicolon:colon;if(split>=0&&split<excerpt.length-1)excerpt=excerpt.slice(split+1).trim();}
 // Unmapped native effects get an honest printed-clause preview, with full
 // text still available. Do not claim that a guessed clause is the active one.
 const printed=text.split(/\r?\n/).filter(line=>line.trim()&&!/^".*"\s*\+/.test(line.trim())).join(' ').trim();
 const preview=printed.match(/^.*?(?:\.(?=\s|$)|$)/s)?.[0]||text;
 const mapped=!!excerpt||!!whole;
 return {fullExcerpt,label:whole||n===0n&&excerpt?(labels[code]?.zero||(context.type==='resolve'?'Resolving printed effect':'Printed activation effect')):mapped?label:card.name+' · '+(official&&!/Card interaction/i.test(official)?official:'Printed text preview'),text,excerpt:excerpt||(whole?text:preview),mapped,index};
}
export function effectMarkup(effect,escape){
 if(!effect)return '';
 if(effect.excerpt){const at=effect.text.indexOf(effect.excerpt);return `${at>0?`<span class="effect-context">${contextMarkup(effect.text.slice(0,at),effect,escape)}</span>`:''}<mark data-active-clause><strong>${activeMarkup(effect.excerpt,effect,escape)}</strong></mark>${at>=0&&at+effect.excerpt.length<effect.text.length?`<span class="effect-context">${contextMarkup(effect.text.slice(at+effect.excerpt.length),effect,escape)}</span>`:''}`}
 return `<mark class="engine-effect-label">${escape(effect.label)}</mark><span class="effect-fallback">Read the full printed effect</span><p>${escape(effect.text)}</p>`
}

function contextMarkup(text,effect,escape){
 const full=effect.fullExcerpt||'',semi=full.indexOf(';');
 if(semi<0)return escape(text);
 const cost=full.slice(0,semi+1),at=text.indexOf(cost);if(at<0)return escape(text);
 return escape(text.slice(0,at))+'<span class="effect-cost"><small>COST</small>'+escape(cost)+'</span>'+escape(text.slice(at+cost.length));
}

function activeMarkup(text,effect,escape){const semi=text.indexOf(';');if(!effect.mapped||semi<0)return escape(text);return '<span class="effect-cost"><small>COST</small>'+escape(text.slice(0,semi+1))+'</span>'+escape(text.slice(semi+1));}
