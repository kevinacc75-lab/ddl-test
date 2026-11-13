// r57 Choke Point Lab content (13 Nov 2026). Format and CP-001 r1 authored by ChatGPT (RELAY-193, T13); built by Claude.
// factCheck: pending Seto team; strategyReview: candidate (NOT a "best choke point" claim). Bubbles are ChatGPT's exact
// text (apostrophes typeset). Builder choices, listed so the team can check them:
//  - mood "pointing" uses the tutors' presenting pose with its own spoken label (r58, tutors.mjs POSES);
//  - the Pass branch (F0) shows ChatGPT's replacement line, then beats 5-7; Ash-only beats 3, 4 and 8 are not shown there
//    (beat 8 says "We stopped a search", which did not happen in F0). Beat 9's replay prompt is shown after both branches
//    as the ending question, worded for either branch, with the expected answer from RELAY-193 section C;
//  - chips appear only on beats AFTER the event they describe, and only because the CP-001 fixtures record it
//    (tests/r57-chokepoint-engine.test.mjs). The badge is gated per lesson like the Ruling Desk (engineState).
// The opponent's moves are a SCRIPTED illustration of the BE-SAGE book line (r54 blueeyes-lines.mjs, 3 steps), not an
// autonomous AI trace. The opponent's hand is revealed because this is a scripted lesson; live duels never do this.
export const CP_CARDS={
 56506740:{name:'Primite Lordly Lode',cid:20534,text:"When this card is activated: Add 1 \"Primite\" card from your Deck to your hand, except \"Primite Lordly Lode\". You can declare 1 Normal Monster Card name; Special Summon 1 declared Normal Monster from your hand, Deck, or GY in Defense Position, also you cannot activate the effects of Special Summoned monsters on the field this turn. You can only use each effect of \"Primite Lordly Lode\" once per turn. Normal Monsters and \"Primite\" monsters you control gain 300 ATK for each Normal Monster with different names in your GY."},
 8240199:{name:'Sage with Eyes of Blue',cid:12292},
 63198739:{name:'Primite Dragon Ether Beryl',cid:20754},
 89631139:{name:'Blue-Eyes White Dragon',cid:4007},
 17947697:{name:'Maiden of White',cid:20602},
 59822133:{name:'Blue-Eyes Spirit Dragon',cid:12324},
 14558127:{name:'Ash Blossom & Joyous Spring',cid:12950}
};
for(const [c,v] of Object.entries(CP_CARDS))v.art='art/'+c+'.jpg';
const LODE=56506740,SAGE=8240199,BERYL=63198739,BEWD=89631139,MAIDEN=17947697,SPIRIT=59822133,ASH=14558127;
const cid=c=>`https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=${c}&ope=2&request_locale=en`;
const E=()=>[null,null,null,null,null];
const REVEAL='OPPONENT’S HAND · SCRIPTED LESSON · HAND REVEALED';
export const CHOKEPOINTS=[
 {id:'CP-001',kind:'choke_point',revision:1.1/* r59: r1.1 (ChatGPT RELAY-207, from Seto team RELAY-206 MED-4); rules re-check pending */,rulesCheck:{relay:'RELAY-200',revision:1},level:'Beginner–Intermediate',minutes:5,title:'Stopped the search. Did we stop the line?',decks:'Blue-Eyes vs Sky Striker',
  engineTests:['CP-001 F1','CP-001 F0'],
  lineRef:{book:'ai/book/blueeyes-lines.mjs',line:'BE-SAGE',steps:['activate Primite Lordly Lode','summon Sage with Eyes of Blue','special Blue-Eyes Spirit Dragon'],commit:'6b4a699c540c966db0cb4b6935d94952615917b8'},
  strategy:'candidate',
  beats:[
   {say:'This lesson reveals the opponent’s starting hand: Lode and Sage. We’ll test one response to that exact line.',mood:'neutral',sfx:'paw',tags:['SCRIPTED · HAND REVEALED'],
    board:{opp:[LODE,SAGE],oppLabel:REVEAL,hand:[ASH]}},
   {say:'Lode’s search is Chain Link 1. Ash is offered here. Try it, or pass to watch the control.',mood:'pointing',sfx:'tick',tags:['CHOKE POINT C1','CHAIN LINK 1'],
    board:{opp:[SAGE],oppLabel:REVEAL,oppSt:[LODE],hand:[ASH],chain:[{code:LODE,who:'opp'}]},text:{code:LODE,hl:'When this card is activated: Add 1 "Primite" card from your Deck to your hand, except "Primite Lordly Lode".'},
    choice:{prompt:'Your response window (C1)',options:[{branch:'F1',label:'Chain Ash Blossom',code:ASH},{branch:'F0',label:'Pass'}]}},
   {branch:'F1',say:'Ash is discarded before its effect resolves. It’s now Chain Link 2.',mood:'thinking',sfx:'slide',tags:['COST','CHAIN LINK 2'],
    board:{opp:[SAGE],oppLabel:REVEAL,oppSt:[LODE],gy:[ASH],chain:[{code:LODE,who:'opp'},{code:ASH,who:'you'}]},chips:[{kind:'cost',text:'Ash discarded · this turn’s named effect used'}],text:{code:ASH,hl:'You can discard this card; negate that effect.'}},
   {branch:'F1',say:'Ash resolves first. Lode’s search effect is negated, so Beryl isn’t added.',mood:'neutral',sfx:'thud',tags:['EFFECT NEGATED'],
    board:{opp:[SAGE],oppLabel:REVEAL,oppSt:[LODE],gy:[ASH],chain:[{code:LODE,who:'opp'},{code:ASH,who:'you'}],resolving:1,stamp:{text:'SEARCH NEGATED',kind:'bad'}},
    chips:[{kind:'outcome',text:'CL2 Ash · response resolved'},{kind:'outcome',text:'CL1 Lode · search effect negated · no Beryl added'},{kind:'state',text:'Lode still face-up'}]},
   {branch:'F0',say:'Lode resolves and adds Beryl. Now watch the same declared summon and Sage line.',mood:'neutral',sfx:'paper',tags:['PASS · CONTROL'],
    board:{opp:[SAGE,BERYL],oppLabel:REVEAL,oppSt:[LODE],hand:[ASH]},chips:[{kind:'outcome',text:'CL1 Lode · Beryl added'},{kind:'state',text:'Ash still in your hand'}]},
   {say:'Lode stays face-up. Its separate declaration effect can still summon Blue-Eyes White Dragon.',mood:'thinking',sfx:'slide',tags:['NEW CHAIN','DECLARE'],
    board:{opp:[SAGE],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,null,BEWD,null,null],gy:[ASH]},variants:{F0:{board:{opp:[SAGE,BERYL],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,null,BEWD,null,null],hand:[ASH]},
     say:'You kept Ash. Lode’s declaration is another Ash window. This replay passes it, so Blue-Eyes White Dragon is summoned.',
     chips:[{kind:'outcome',text:'Blue-Eyes White Dragon summoned · Defense'},{kind:'lock',text:'After Lode’s declaration resolves: opponent can’t activate effects of Special Summoned monsters on the field this turn'},{kind:'state',text:'Ash still in hand · later windows passed in this replay'}]}},text:{code:LODE,hl:'You can declare 1 Normal Monster Card name; Special Summon 1 declared Normal Monster from your hand, Deck, or GY in Defense Position'},
    chips:[{kind:'outcome',text:'Blue-Eyes White Dragon summoned · Defense'},{kind:'lock',text:'After Lode’s declaration resolves: opponent can’t activate effects of Special Summoned monsters on the field this turn'}/* r58 RELAY-200 LOW-1 */]},
   {say:'Sage was already in hand. Normal Summoning it still supplies the Tuner for this line.',mood:'pointing',sfx:'slide',tags:['NORMAL SUMMON','TUNER'],
    board:{opp:[MAIDEN],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,SAGE,BEWD,null,null],gy:[ASH]},variants:{F0:{board:{opp:[BERYL,MAIDEN],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,SAGE,BEWD,null,null],hand:[ASH]},
     say:'Sage was already in hand. Its Normal Summon search is another Ash window. This replay passes that window too, so Maiden is added.',
     chips:[{kind:'outcome',text:'Sage adds Maiden of White'},{kind:'state',text:'Normal Summoned · Lode’s lock doesn’t apply'},{kind:'state',text:'Ash kept · Sage’s search passed in this replay'}]}},chips:[{kind:'outcome',text:'Sage adds Maiden of White'},{kind:'state',text:'Normal Summoned · Lode’s lock doesn’t apply'}]},
   {say:'With Sage and Blue-Eyes on the field, the shown line can still Synchro Summon Spirit Dragon.',mood:'neutral',sfx:'chime',tags:['SYNCHRO'],
    board:{opp:[MAIDEN],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,null,SPIRIT,null,null],gy:[ASH]},variants:{F0:{board:{opp:[BERYL,MAIDEN],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,null,SPIRIT,null,null],hand:[ASH]}}},chips:[{kind:'outcome',text:'Blue-Eyes Spirit Dragon Synchro Summoned'}]},
   {branch:'F1',say:'We stopped a search, but this hand still has its main route. One negated effect isn’t the same as stopping a deck.',mood:'thinking',sfx:'paper',tags:['CATCH'],
    board:{opp:[MAIDEN],oppLabel:REVEAL,oppSt:[LODE],oppMmz:[null,null,SPIRIT,null,null],gy:[ASH]},catch:'We stopped Lode’s search, not its separate summon effect. Sage was already in the revealed hand, so this line can still reach Spirit Dragon.'}
  ],
  question:{ask:'Replay and try the other choice at C1. What changes: the search result, the final summon, or both?',answer:'The search result changes: with Ash, no Beryl is added. The final summon stays: Spirit Dragon is reached either way in this exact replay. In the Pass branch, Ash stayed live at Lode’s declaration and Sage’s search; this replay passed both. A separate F2 branch using Ash on the declaration has not been reviewed.'}/* r1.1 RELAY-207 */,
  ruling:'Ash negates Lode’s search effect, not its card activation. Lode stays face-up and its separate summon effect remains available. With Sage already held, this fixed hand can still assemble Spirit Dragon’s materials. This does not establish the best response against other hands. The Pass branch also passes the later Ash windows at Lode’s declaration and Sage’s search. Reaching Spirit Dragon here does not mean those later windows are unavailable.'/* r1.1 RELAY-207 */,
  provenance:'Neuron EN / Rulebook v10',
  sources:[{label:'Primite Lordly Lode (cid 20534)',url:cid(20534)},{label:'Sage with Eyes of Blue (cid 12292)',url:cid(12292)},{label:'Blue-Eyes Spirit Dragon (cid 12324)',url:cid(12324)},{label:'Ash Blossom & Joyous Spring (cid 12950)',url:cid(12950)},
   {label:'Official Rulebook v10 (Chains pp. 44–47; ‘Actions which cannot be Chained to’ p. 51)'/* r58: p. 51 (Seto team RELAY-199/200 LOW) */,url:'https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf'}]}
];
// The steps for one branch: shared beats, then that branch's beats. Before a choice, only up to the choice beat.
// r58 (RELAY-200 MED-1) / r59 (RELAY-207): a shared beat can carry variants[branch] (board, say, chips) so each branch
// shows its own true state and words.
export function cpBeats(l,branch){const out=[];for(const b of l.beats){if(b.branch&&b.branch!==branch)continue;out.push(branch&&b.variants?.[branch]?{...b,...b.variants[branch]}:b);if(b.choice&&!branch)break}return out}
