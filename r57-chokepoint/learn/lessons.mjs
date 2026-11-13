// r53 Ruling Desk lessons v1.1 (13 Nov 2026).
// Content authored by ChatGPT (RELAY-175 RD-001..003), corrected with every Seto-team FIX in RELAY-180:
//  - RD-001 beat 2: Alexis's tighter wording; Akiza's takeaway; the empty-zone condition is NOT widened to every Sky
//    Striker Spell; beat 6 is labelled a zone demo (Akiza) and Kagari's recovery is asserted NOT offered (Alexis 1-6).
//  - RD-002 beat 1: "You control no monsters" (Alexis 2-1). RD-003 beat 1: card-activation wording (Alexis GD01).
//  - Missing cids added (Tea); 2021 rules update as co-source for zones (Alexis HIGH 2); summon_negated in the enum.
// Engine outcomes are reproduced by tests/r53-lessons-engine.test.mjs (5 fixtures). Rules status stays PENDING until the
// Seto team re-checks v1.1 (RELAY-181 T11a). Text quotes are copied exactly from the bundled cards.json.gz.
export const VERDICTS=['legal_action','condition_not_met','effect_negated','activation_negated','summon_negated','observation','needs_review','none'];
export const ENGINE_CHECK={tests:'tests/r53-lessons-engine.test.mjs + tests/r55-lessons-engine.test.mjs + tests/r56-lessons-engine.test.mjs'};
// r55 per-lesson evidence (ChatGPT RELAY-192 A10, RELAY-189): a lesson shows "Engine outcome reproduced" only if EVERY test in its
// engineTests passed in this build's recorded run (learn/engine-evidence.mjs, generated from _build/tests-r55.txt). Missing or
// empty evidence is NOT RUN; any failure is a visible needs-review state. The rules badge is separate and never inherited.
import {ENGINE_EVIDENCE} from './engine-evidence.mjs';
export function engineState(l,ev=ENGINE_EVIDENCE){const ids=l?.engineTests||[];if(!ids.length)return 'notrun';const r=ids.map(id=>ev?.results?.[id]);if(r.some(x=>x==='fail'))return 'failed';return r.every(x=>x==='pass')?'reproduced':'notrun'}
const A=c=>({33925864:'art/33925864.jpg',97268402:'art/97268402.jpg',73642296:'art/73642296.jpg',63166095:'art/63166095.jpg',26077387:'art/26077387.jpg',63288573:'art/63288573.jpg',32909498:'art/32909498.jpg',31149212:'art/31149212.jpg',14558127:'art/14558127.jpg',57103969:'art/57103969.webp',8379983:'art/8379983.webp',80044027:'art/80044027.jpg',18377261:'art/18377261.jpg',6327734:'art/6327734.jpg'})[c];
export const CARDS={
 73642296:{name:'Ghost Belle & Haunted Mansion',cid:13587,text:"When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that activation.\r\n● Add a card(s) from the GY to the hand, Deck, and/or Extra Deck.\r\n● Special Summon a Monster Card(s) from the GY.\r\n● Banish a card(s) from the GY.\r\nYou can only use this effect of \"Ghost Belle & Haunted Mansion\" once per turn."},/* r56: text added for RD-005 */
 63166095:{name:'Sky Striker Mobilize - Engage!',cid:13671,text:'If you control no monsters in your Main Monster Zone: Add 1 "Sky Striker" card from your Deck to your hand, except "Sky Striker Mobilize - Engage!", then, if you have 3 or more Spells in your GY, you can draw 1 card.'},
 26077387:{name:'Sky Striker Ace - Raye',cid:13670},
 63288573:{name:'Sky Striker Ace - Kagari',cid:13668},
 32909498:{name:'Kashtira Fenrir',cid:17768,text:'If you control no monsters, you can Special Summon this card (from your hand). You can only use each of the following effects of "Kashtira Fenrir" once per turn. During your Main Phase: You can add 1 "Kashtira" monster from your Deck to your hand. When this card declares an attack, or if your opponent activates a monster effect (except during the Damage Step): You can target 1 face-up card your opponent controls; banish it, face-down.'},
 31149212:{name:'Kashtira Riseheart',cid:18151,text:"If you control a \"Kashtira\" monster: You can Special Summon this card from your hand, also you cannot Special Summon monsters from the Extra Deck for the rest of this turn, except Xyz Monsters. During your Main Phase, if this card was Normal or Special Summoned this turn: You can banish 1 \"Kashtira\" card from your Deck, except \"Kashtira Riseheart\"; banish the top 3 cards of your opponent's Deck face-down, and if you banish any, this card's Level becomes 7. You can only use each effect of \"Kashtira Riseheart\" once per turn."},
 33925864:{name:'Kashtira Big Bang',cid:18220,text:"If a \"Kashtira\" Xyz Monster is on the field and a player controls 2 or more monsters: They must banish monsters they control, face-down, so they only control 1 monster. If this card is banished: You can target 1 \"Kashtira\" Xyz Monster you control; add 1 of your \"Kashtira\" monsters attached to it to your hand, then you can Special Summon that monster from your hand. You can only use each effect of \"Kashtira Big Bang\" once per turn."},
 97268402:{name:'Effect Veiler',cid:8933,text:"During your opponent's Main Phase (Quick Effect): You can send this card from your hand to the GY, then target 1 Effect Monster your opponent controls; negate the effects of that face-up monster your opponent controls, until the end of this turn."},
 14558127:{name:'Ash Blossom & Joyous Spring',cid:12950,text:'When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that effect.\n●Add a card from the Deck to the hand.\n●Special Summon from the Deck.\n●Send a card from the Deck to the GY.\nYou can only use this effect of "Ash Blossom & Joyous Spring" once per turn.'},
 57103969:{name:'Fire Formation - Tenki',cid:10418,text:'When this card is activated: You can add 1 Level 4 or lower Beast-Warrior monster from your Deck to your hand. All Beast-Warrior monsters you control gain 100 ATK. You can only activate 1 "Fire Formation - Tenki" per turn.'},
 8379983:{name:'Lunalight Gold Leo',cid:21416},
 80044027:{name:'Mikanko Fire Dance',cid:18020,text:"Special Summon 1 \"Mikanko\" monster from your hand or GY, and if you do, equip it with this card, then you can Special Summon 1 monster from your opponent's GY to their field, but negate its effects. The equipped monster cannot be destroyed by card effects. You can only activate 1 \"Mikanko Fire Dance\" per turn."},
 18377261:{name:'Ha-Re the Sword Mikanko',cid:18015},
 6327734:{name:'Hu-Li the Jewel Mikanko',cid:18482}
};
for(const [c,v] of Object.entries(CARDS))v.art=A(Number(c));
const cid=c=>`https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=${c}&ope=2&request_locale=en`;
const RULEBOOK={label:'Official Rulebook v10 (Chains pp. 44–47; ‘Actions which cannot be Chained to’ p. 50)'/* r55: exact label, ChatGPT RELAY-192 */,url:'https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf'};
const RULES2021={label:'Konami 2021 rules update (zones)',url:'https://www.yugioh-card.com/en/play/2021_rules_update/'};
const RISE=31149212,BIGBANG=33925864,VEILER=97268402,GB=73642296,ENGAGE=63166095,RAYE=26077387,KAGARI=63288573,FENRIR=32909498,ASH=14558127,TENKI=57103969,LEO=8379983;
const E=()=>[null,null,null,null,null];
const FD=80044027,HARE=18377261,HULI=6327734;
export const LESSONS=[
 {id:'RD-001',revision:2,level:'Beginner',minutes:4,title:'Why won’t Engage! activate?',decks:'Sky Striker',
  engineTests:['RD-001','RD-001 control'],
  beats:[
   {say:'Engage is available while your Main Monster Zones are empty. Let’s watch what changes.',mood:'neutral',sfx:'paw',verdict:'observation',tags:['CONDITION TO ACTIVATE'],
    board:{mmz:E(),hand:[GB,ENGAGE],good:[ENGAGE]},text:{code:ENGAGE,hl:'If you control no monsters in your Main Monster Zone:'}},
   {say:'Normal Summoning Ghost Belle is legal here. But it fills a Main Monster Zone, and Engage needs those empty.',mood:'thinking',sfx:'slide',verdict:'legal_action',tags:['NORMAL SUMMON · LEGAL'],
    board:{mmz:[null,null,GB,null,null],hand:[ENGAGE],bad:[GB]}},
   {say:'Engage checks for no monsters in your Main Monster Zones, not just no Striker monsters.',mood:'notlegal',sfx:'paper',verdict:'condition_not_met',tags:['CONDITION NOT MET'],
    board:{mmz:[null,null,GB,null,null],hand:[ENGAGE],bad:[GB],off:[ENGAGE],stamp:{text:'CAN’T ACTIVATE',kind:'bad'}},text:{code:ENGAGE,hl:'If you control no monsters in your Main Monster Zone:'}},
   {say:'Ghost Belle isn’t negating Engage. Engage was never activated: its condition just isn’t met.',mood:'neutral',sfx:'paw',verdict:'condition_not_met',tags:['NO NEGATION'],
    board:{mmz:[null,null,GB,null,null],hand:[ENGAGE],off:[ENGAGE]}},
   {say:'Good play: activate Engage before you Normal Summon. Keep Ghost Belle in hand for your opponent’s turn.',mood:'proud',sfx:'chime',verdict:'observation',tags:['TAKEAWAY'],
    strategy:{note:'good_play',reason:'Engage first; the hand trap stays in hand.',reviewer:'Akiza (Seto team, RELAY-180)'},
    board:{mmz:E(),hand:[GB,ENGAGE],good:[ENGAGE]}},
   {say:'Zone demo: a Link in the Extra Monster Zone doesn’t fill a Main Monster Zone, so Engage is offered again.',mood:'legal',sfx:'chime',verdict:'legal_action',tags:['EXTRA MONSTER ZONE','ZONE DEMO'],
    caption:'This is a zone demonstration, not the usual opening. In real play Raye normally Tributes itself with its own Quick Effect to put a Sky Striker Ace in the Extra Monster Zone, often on the opponent’s turn. Either way, a Link only in the Extra Monster Zone leaves your Main zones empty.',
    board:{mmz:E(),emz:KAGARI,hand:[ENGAGE],good:[ENGAGE]}}
  ],
  ruling:'A monster in your Main Monster Zone stops Engage’s activation condition from being met. Normal Summoning Ghost Belle is legal here, but costly. A monster only in an Extra Monster Zone does not occupy a Main Monster Zone.',
  sources:[{label:'Engage! (cid 13671)',url:cid(13671)},{label:'Ghost Belle (cid 13587)',url:cid(13587)},{label:'Raye (cid 13670)',url:cid(13670)},{label:'Kagari (cid 13668)',url:cid(13668)},RULES2021]},
 {id:'RD-002',revision:3,level:'Beginner',minutes:4,title:'Fenrir’s summon and search are different',/* r55: ChatGPT RELAY-183 author caution: the old title was broader than the lesson */decks:'Kashtira',
  engineTests:['RD-002'],
  beats:[
   {say:'You control no monsters, so Fenrir can use its own Special Summon procedure.',mood:'neutral',sfx:'paw',verdict:'observation',tags:['SUMMON PROCEDURE'],
    board:{mmz:E(),hand:[FENRIR],opp:[ASH],good:[FENRIR]},text:{code:FENRIR,hl:'If you control no monsters, you can Special Summon this card (from your hand).'}},
   {say:'That procedure doesn’t activate an effect, so there’s no Chain Link for Ash to answer.',mood:'thinking',sfx:'slide',verdict:'legal_action',tags:['NO CHAIN LINK'],
    board:{mmz:[null,null,FENRIR,null,null],opp:[ASH],chain:[]}},
   {say:'That doesn’t mean nobody can ever respond. Some cards negate summons, or respond after one succeeds.',mood:'thinking',sfx:'paper',verdict:'observation',tags:['SUMMON ≠ EFFECT'],
    board:{mmz:[null,null,FENRIR,null,null],opp:[ASH]}},
   {say:'Fenrir’s search is different: it activates an effect that adds from the Deck.',mood:'neutral',sfx:'tick',verdict:'observation',tags:['ACTIVATED EFFECT','CHAIN LINK 1'],
    board:{mmz:[null,null,FENRIR,null,null],opp:[ASH],chain:[{code:FENRIR,who:'you'}]},text:{code:FENRIR,hl:'During your Main Phase: You can add 1 "Kashtira" monster from your Deck to your hand.'}},
   {say:'Now Ash has a matching effect to answer. Ash is Chain Link 2, resolves first, and negates the search.',mood:'surprised',sfx:'thud',verdict:'effect_negated',tags:['CHAIN LINK 2','EFFECT NEGATED'],
    board:{mmz:[null,null,FENRIR,null,null],chain:[{code:FENRIR,who:'you'},{code:ASH,who:'opp'}],stamp:{text:'SEARCH NEGATED',kind:'bad'}},text:{code:ASH,hl:'negate that effect.'}},
   {say:'Fenrir stays on the field. Only its search was negated, not its summon.',mood:'proud',sfx:'chime',verdict:'effect_negated',tags:['SUMMON STANDS'],
    board:{mmz:[null,null,FENRIR,null,null],good:[FENRIR]}}
  ],
  ruling:'Fenrir’s hand Special Summon procedure does not start a Chain, so Ash cannot answer it. Fenrir’s later Deck-search effect does start a Chain and can be answered by Ash. Other cards may interact with summons in different windows.',
  sources:[{label:'Kashtira Fenrir (cid 17768)',url:cid(17768)},{label:'Ash Blossom (cid 12950)',url:cid(12950)},RULEBOOK]},
 {id:'RD-003',revision:2,level:'Beginner',minutes:3,title:'Last added, first resolved',decks:'Lunalight',
  engineTests:['RD-003','RD-003 control'],
  beats:[
   {say:'Tenki was activated as Chain Link 1. Its search hasn’t happened yet.',mood:'neutral',sfx:'tick',verdict:'observation',tags:['CHAIN LINK 1'],
    board:{mmz:E(),st:[TENKI],opp:[ASH],chain:[{code:TENKI,who:'you'}]},text:{code:TENKI,hl:'When this card is activated: You can add 1 Level 4 or lower Beast-Warrior monster from your Deck to your hand.'}},
   {say:'Your opponent discards Ash to activate its effect. That’s Chain Link 2.',mood:'surprised',sfx:'slide',verdict:'observation',tags:['COST','CHAIN LINK 2'],
    board:{mmz:E(),st:[TENKI],chain:[{code:TENKI,who:'you'},{code:ASH,who:'opp'}]}},
   {say:'Both players pass. The last link resolves first: Ash, then Tenki.',mood:'thinking',sfx:'tick',verdict:'observation',tags:['REVERSE ORDER'],
    board:{mmz:E(),st:[TENKI],chain:[{code:TENKI,who:'you'},{code:ASH,who:'opp'}],resolving:1}},
   {say:'Ash negates Tenki’s search effect. Tenki doesn’t add a monster here.',mood:'notlegal',sfx:'thud',verdict:'effect_negated',tags:['EFFECT NEGATED'],
    board:{mmz:E(),st:[TENKI],stamp:{text:'SEARCH NEGATED',kind:'bad'}},text:{code:ASH,hl:'negate that effect.'}},
   {say:'Tenki isn’t destroyed by Ash. Its continuous ATK boost is a separate effect.',mood:'neutral',sfx:'paper',verdict:'observation',tags:['STILL FACE-UP'],
    board:{mmz:E(),st:[TENKI],good:[TENKI]},text:{code:TENKI,hl:'All Beast-Warrior monsters you control gain 100 ATK.'}},
   {say:'Replay without Ash: Tenki’s search resolves and adds Gold Leo. Same order, different result.',mood:'legal',sfx:'chime',verdict:'legal_action',tags:['CONTROL'],
    board:{mmz:E(),st:[TENKI],hand:[LEO],good:[LEO]}}
  ],
  ruling:'Chain Links resolve in reverse order. Ash resolves before Tenki and negates its search effect. That does not destroy Tenki or negate its card activation. In this example Tenki stays face-up and its separate continuous ATK effect remains.',
  sources:[{label:'Fire Formation - Tenki (cid 10418)',url:cid(10418)},{label:'Ash Blossom (cid 12950)',url:cid(12950)},{label:'Lunalight Gold Leo (cid 21416)',url:cid(21416)},RULEBOOK]},
 {id:'RD-004',revision:2,/* r55: ChatGPT RELAY-192 author r2 (s6 wording, from Seto team RELAY-190 B1) */level:'Intermediate',minutes:4,title:'A cost is paid before the answer',decks:'Kashtira',
  engineTests:['RD-004','RD-004 control'],
  beats:[
   {say:'Riseheart was Normal Summoned this turn. Its Deck-banish effect is available in your Main Phase.',mood:'neutral',sfx:'paw',verdict:'observation',tags:['CONDITION'],
    board:{mmz:[null,null,RISE,null,null],opp:[VEILER],good:[RISE]},text:{code:RISE,hl:'During your Main Phase, if this card was Normal or Special Summoned this turn:'}},
   {say:'Banish Big Bang to activate Riseheart’s effect. That cost is paid before your opponent responds.',mood:'thinking',sfx:'slide',verdict:'legal_action',tags:['COST','CHAIN LINK 1'],
    board:{mmz:[null,null,RISE,null,null],opp:[VEILER],banished:[BIGBANG],chain:[{code:RISE,who:'you'}]},text:{code:RISE,hl:'You can banish 1 "Kashtira" card from your Deck, except "Kashtira Riseheart";'}},
   {say:'Veiler answers Riseheart. Paying the cost didn’t guarantee the effect would succeed.',mood:'surprised',sfx:'tick',verdict:'observation',tags:['RESPONSE','CHAIN LINK 2'],
    board:{mmz:[null,null,RISE,null,null],banished:[BIGBANG],chain:[{code:RISE,who:'you'},{code:VEILER,who:'opp'}]},text:{code:VEILER,hl:'negate the effects of that face-up monster your opponent controls, until the end of this turn.'}},
   {say:'Veiler resolves first. Riseheart’s effect is negated, but the paid cost is not returned.',mood:'notlegal',sfx:'thud',verdict:'effect_negated',tags:['EFFECT NEGATED','NO REFUND'],
    board:{mmz:[null,null,RISE,null,null],banished:[BIGBANG],bad:[BIGBANG],stamp:{text:'EFFECT NEGATED',kind:'bad'}}},
   {say:'Big Bang is still banished. There is no Kashtira Xyz here for its banished-card effect to target.',mood:'thinking',sfx:'paper',verdict:'condition_not_met',tags:['NO TARGET'],
    board:{mmz:[null,null,RISE,null,null],banished:[BIGBANG],off:[BIGBANG]},text:{code:BIGBANG,hl:'If this card is banished: You can target 1 "Kashtira" Xyz Monster you control;'}},
   {say:'In a fresh replay without Veiler, Riseheart banishes your opponent’s top three cards face-down and becomes Level 7.',mood:'legal',sfx:'chime',verdict:'legal_action',tags:['CONTROL','LEVEL 7'],
    board:{mmz:[null,null,RISE,null,null],banished:[BIGBANG],good:[RISE],stamp:{text:'LEVEL 7',kind:'good'}}}
  ],
  ruling:'Riseheart pays its Deck-banish cost when activated. Negating its effect does not refund that cost. In this scene Veiler stops the opponent-Deck banish and the Level change. Big Bang cannot activate here without a Kashtira Xyz target.',
  sources:[{label:'Kashtira Riseheart (cid 18151)',url:cid(18151)},{label:'Kashtira Big Bang (cid 18220)',url:cid(18220)},{label:'Effect Veiler (cid 8933)',url:cid(8933)},RULEBOOK]},
 // r56 RD-005 r2: ChatGPT RELAY-192 (supersedes the disputed r1; ruling corrected by the Seto team, RELAY-190). Bubbles exact
 // (apostrophes typeset). Mood 'pointing' is drawn with the tutors' presenting pose ('notlegal' frame): art only, no verdict.
 // Title kept without its closing full stop, like every other lesson title. s06 is SOURCE-LED: no engine arm negates only the effect.
 // Engine: tests/r56-lessons-engine.test.mjs, narrowed fixtures (named cards + vanilla filler, not full presets).
 {id:'RD-005',revision:2,level:'Intermediate',minutes:4,title:'A negated activation and a negated effect are different',decks:'Mikanko',
  engineTests:['RD-005 A','RD-005 B'],
  beats:[
   {say:'Fire Dance says you can only activate 1 per turn. Watch exactly what Ghost Belle negates.',mood:'neutral',sfx:'paw',verdict:'observation',tags:['ACTIVATION LIMIT'],
    board:{mmz:E(),hand:[FD,FD],gy:[HARE],opp:[GB]},text:{code:FD,hl:'You can only activate 1 "Mikanko Fire Dance" per turn.'}},
   {say:'Fire Dance can Special Summon from the GY, so Ghost Belle can answer its activation.',mood:'notlegal',sfx:'slide',verdict:'observation',tags:['CHAIN LINK 2'],
    board:{mmz:E(),hand:[FD],gy:[HARE],chain:[{code:FD,who:'you'},{code:GB,who:'opp'}]},text:{code:GB,hl:'● Special Summon a Monster Card(s) from the GY.'}},
   {say:'Ghost Belle negates the activation. That is different from negating only an effect.',mood:'thinking',sfx:'thud',verdict:'activation_negated',tags:['ACTIVATION NEGATED'],
    board:{mmz:E(),hand:[FD],gy:[HARE,FD],chain:[{code:FD,who:'you'},{code:GB,who:'opp'}],resolving:1,stamp:{text:'ACTIVATION NEGATED',kind:'bad'}},text:{code:GB,hl:'negate that activation.'}},
   {say:'A negated activation doesn’t use up Fire Dance’s limit, so your second copy can still be activated.',mood:'legal',sfx:'chime',verdict:'legal_action',tags:['LIMIT NOT USED'],
    board:{mmz:E(),hand:[FD],gy:[HARE,FD],good:[FD],stamp:{text:'STILL OFFERED',kind:'good'}}},
   {say:'Reset: let the first Fire Dance resolve. Now the limit is used, so the second copy can’t be activated this turn.',mood:'thinking',sfx:'paper',verdict:'condition_not_met',tags:['CONTROL','LIMIT USED'],
    board:{mmz:[null,null,HARE,null,null],st:[FD],hand:[FD],gy:[HULI],handOff:[FD]/* only the hand copy is greyed; the equipped one is not */,stamp:{text:'LIMIT USED',kind:'bad'}},caption:'A separate replay: Ha-Re revived and equipped; Hu-Li is still a valid GY monster.'},
   {say:'If only Fire Dance’s effect were negated, the activation would still count: no second copy that turn.',mood:'neutral',sfx:'paper',verdict:'observation',tags:['SOURCE-LED'],
    board:{mmz:E(),hand:[FD],off:[FD]},caption:'From the sources only: this build has no engine replay of an effect-only negation.'}
  ],
  ruling:'Fire Dance limits activations, not uses. If its card activation is negated, it doesn’t count, so another Fire Dance can be activated that turn. If the activation resolves, even with its effect negated, the limit is used.',
  sources:[{label:'Mikanko Fire Dance (cid 18020)',url:cid(18020)},{label:'Ha-Re the Sword Mikanko (cid 18015)',url:cid(18015)},{label:'Hu-Li the Jewel Mikanko (cid 18482)',url:cid(18482)},{label:'Ghost Belle & Haunted Mansion (cid 13587)',url:cid(13587)},
   {label:'Konami Libromancer Manual, section 3 (TCG rules example on identical wording)',url:'https://img.yugioh-card.com/en/downloads/rivalry_of_warlords/Libromancer-Manual.pdf'},
   {label:'Fire Dance supplement (OCG supplement; no exception)',url:'https://www.db.yugioh-card.com/yugiohdb/faq_search.action?cid=18020&ope=4&request_locale=ja'}]}
];
