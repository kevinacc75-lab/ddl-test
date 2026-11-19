import {M,R} from './duel.mjs';

// These are card-text learning notes, separate from the pilot's decision rules.
const lessons={
 'Branded Fusion':['Build the Fusion route','This can use materials from your hand, Deck or field for a Fusion that mentions Fallen of Albaz.','The Fusion-only Extra Deck restriction applies this turn. Activation does not guarantee resolution.'],
 'Aluber the Jester of Despia':['Find the starter','Its summon effect can add a Branded Spell/Trap from the Deck. Branded Fusion is a common follow-up if available.','The search still needs to resolve. The engine offers the cards you can actually add.'],
 'Branded Opening':['Reach the engine','This can put a Despia monster in hand or summon it in Defence Position.','Discard happens when this effect resolves. Its Extra Deck restriction matters for the rest of the turn.'],
 'Fallen of Albaz':['Use the opposing board','Its summon effect can Fusion Summon using itself and monsters on either field.','The discard is a cost. You cannot use your other monsters as materials for this effect.'],
 'Lubellion the Searing Dragon':['Continue the Fusion route','Its summon effect can shuffle eligible materials into the Deck for another Fusion Summon.','Discard is a cost. Lubellion cannot attack this turn after using this effect.'],
 'Albion the Branded Dragon':['Convert materials into a Fusion','Its summon effect can banish materials from your hand, field or GY for another Fusion Summon.','Banishing useful GY cards can affect later plays. The selected materials must fit the Fusion.'],
 'Mirrorjade the Iceblade Dragon':['Establish removal','Mirrorjade can banish a face-up monster after sending a qualifying Fusion from the Extra Deck to the GY as cost.','The banish does not target. Using it prevents using that effect next turn.'],
 'Red-Eyes Dark Dragoon':['Pressure and interruption','Dragoon provides an activated-effect negate that requires a discard, plus a destruction effect tied to its Normal Monster materials.','The destruction count depends on the actual materials used. A summon alone does not grant two destructions.'],
 'Ohime the Manifested Mikanko':['Find an equip route','Ohime can reveal itself to search a Mikanko card, then discard.','Battle reflection depends on its equip condition; check the live field before attacking.'],
 'Uzuhime the Manifested Mikanko':['Reflect damage and attack again','Uzuhime reflects the battle damage you would take in its battles. After it attacks and battles, detaching a material at the end of the Damage Step lets it attack again in a row.','Its reflection does not require an Equip Spell. Each extra attack needs another material; check how many remain.'],
 'Double-Edged Sword':['Understand the damage sequence','This Equip Spell changes ATK and makes both players take battle damage from battles involving the equipped monster.','Mikanko interactions depend on the exact monster effects. Do not infer the damage from ATK alone.'],
 'Sky Striker Mobilize - Engage!':['Search before extending','With no monsters in your Main Monster Zones, Engage can add a different Sky Striker card.','The extra draw needs at least three Spells in your GY. It is not automatic.'],
 'Sky Striker Ace - Raye':['Reach the Link engine','Raye supplies a Sky Striker body and can tribute itself as a Quick Effect for a Sky Striker Ace from the Extra Deck.','That effect uses the Extra Monster Zone. Follow the engine’s legal zone choices.'],
 'Sky Striker Ace - Kagari':['Recover a Spell','Kagari’s Special Summon effect can return a Sky Striker Spell from your GY to your hand.','The Spell must already be in the GY and the recovery must resolve.'],
 'Sky Striker Ace - Hayate':['Build the GY','Hayate can attack directly and can send a Sky Striker card from the Deck to the GY after battling.','Sending a Spell to the GY is different from searching it to hand.'],
 'Sky Striker Ace - Shizuku':['Prepare the next turn','Shizuku can search a Sky Striker Spell in the End Phase of the turn it was Special Summoned.','The searched name must differ from the Spells in your GY.'],
 'Lunalight Liger Dancer':['Establish the boss','Liger Dancer is unaffected by card effects except Lunalight cards, can attack twice per Battle Phase, and can send a Lunalight from the Extra Deck to the GY for its Quick Effect destruction.','That GY send is a cost. Its destruction only removes the opponent’s Special Summoned monsters.'],
 'Lunalight Gold Leo':['Find another Lunalight','Its summon effect can add another Lunalight monster from the Deck, then discard.','Discard happens after the search during resolution. The searched name cannot be Gold Leo.'],
 'Albion the Sanctifire Dragon':['Use both GYs','During the opponent’s turn, Sanctifire can target two monsters in any GYs and summon one to each field.','Both chosen monsters must fit the engine’s requirements. You are also giving the opponent a body.'],
 'Lunalight Black Sheep':['Find Fusion support','Discarding Black Sheep can obtain Polymerization or recover an eligible Lunalight monster from your GY.','Discard is a cost. Select the offered effect that fits the cards you actually have.'],
 'Polymerization':['Commit Fusion materials','Polymerization Fusion Summons using materials from your hand or field.','Sending materials happens during resolution. Other Fusion effects can use different locations.'],
 'Lunalight Fusion':['Check the extra-material condition','This Fusion Spell uses Lunalight materials from hand or field, with additional material access when the opponent meets its condition.','A monster summoned from the Extra Deck is the relevant opposing-board condition; ordinary bodies do not qualify.'],
 'Lunalight Kaleido Chick':['Prepare a Fusion name','Chick can send a Lunalight from the Deck or Extra Deck to the GY to substitute its name for Fusion Material use.','The sent card is a cost. Chick’s name substitution is for the stated Fusion Material use.']
};

export function buildPlan(d,response,{rule,reason,kind='selection'}){
 const m=d.prompt;let selected=[],code=0,title='Make the required choice';
 if(m.type===M.SELECT_IDLECMD){
  const lists=[m.summons,m.special_summons,m.pos_changes,m.monster_sets,m.spell_sets,m.activates];
  const labels=['Normal Summon','Special Summon','Change position','Set monster','Set','Activate'];
  code=lists[response.action]?.[response.index]?.code||0;title=response.action===6?'Enter Battle Phase':response.action===7?'End turn':labels[response.action]+' · '+d.name(code);
 }else if(m.type===M.SELECT_BATTLECMD){code=(response.action===0?m.chains:m.attacks)?.[response.index]?.code||0;title=response.action===2?'Enter Main Phase 2':response.action===3?'End turn':(response.action===0?'Activate':'Attack')+' · '+d.name(code)}
 else if(m.type===M.SELECT_CHAIN){code=m.selects[response.index]?.code||0;title=response.index===null?'Do not chain':'Chain · '+d.name(code)}
 else if([M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(m.type)){code=m.code||d.lastCard;title=(response.yes?'Use':'Decline')+' · '+d.name(code)}
 else if([M.SELECT_CARD,M.SELECT_TRIBUTE,M.SELECT_SUM].includes(m.type)){
  const cards=m.type===M.SELECT_SUM?[...(m.selects_must||[]),...m.selects]:m.selects;selected=(response.indicies||[]).map(i=>cards[i]?.code).filter(Boolean);title=d.title();
 }else if(m.type===M.SELECT_OPTION){title=d.description(m.options[response.index])}
 else if(m.type===M.SELECT_UNSELECT_CARD){code=m.select_cards[response.index]?.code||0;title=response.index===null?'Finish or cancel selection':'Use · '+d.name(code)}
 else if(m.type===M.SELECT_POSITION){code=m.code;title='Choose '+({1:'Attack',4:'Defence',8:'face-down Defence',2:'face-down Attack'}[response.position]||'position')}
 else if([M.SELECT_PLACE,M.SELECT_DISFIELD].includes(m.type))title='Choose the required field zone';
 else if(m.type===M.ANNOUNCE_CARD){code=response.card;title='Declare · '+d.name(code)}
 else if(m.type===M.SELECT_COUNTER)title='Pay the required counters';
 else if(m.type===M.ANNOUNCE_NUMBER)title='Choose '+String(m.options[response.value]);
 else if([M.ANNOUNCE_ATTRIB,M.ANNOUNCE_RACE].includes(m.type))title='Declare the required type';
 else if(m.type===M.SORT_CARD||m.type===M.SORT_CHAIN){selected=m.cards.map((c,i)=>({code:c.code,rank:response.order[i]})).sort((a,b)=>a.rank-b.rank).map(c=>c.code);title=(m.type===M.SORT_CHAIN?'Trigger order: ':'Card order: ')+selected.map(code=>d.name(code)).join(' → ')}
 const lesson=code&&kind!=='selection'?lessons[d.name(code)]:null;
 return {response,seat:m.seat,turn:d.turn,revision:d.revision,code,title,rule,reason,kind,selected,lesson:lesson?{goal:lesson[0],text:lesson[1],watch:lesson[2]}:null};
}
