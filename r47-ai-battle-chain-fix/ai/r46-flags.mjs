// r46 WindBot port (Kevy approved 11 Nov 2026 14:54 AEDT: "I approve all ... If we can out perform Windbot that should be our
// new goal"). One switchboard for the ported WindBot rules (ai/book/windbot-port.mjs) so tests and the benchmark can turn
// each one off. R46.on=false gives the r45 behaviour for every switched part.
export const R46={
 on:true,
 // W1 (WindBot DefaultTrap / LastChainPlayer==1): a hand trap is only chained to an OPPONENT's chain link, never our own.
 ownChainGuard:true,
 // W2 (WindBot DefaultGhostOgreAndSnowRabbit): Ghost Ogre & Snow Rabbit answers their key or Extra Deck card activated on
 // the field (never their Mirrorjade: destroying it arms its End Phase wipe of our monsters).
 ghostOgre:true,
 // W3 (AlbazExecutor MirrorjadeTheIcebladeDragonActivate): on the opponent's turn our Mirrorjade only banishes against an
 // Extra Deck monster or an activating Albaz, in the Battle Phase, or in their End Phase; not into a bare starter.
 mirrorjadeTiming:true,
 // W4 (same function, checkDict): Mirrorjade's Extra Deck send follows WindBot's priority (Rindbrumm / Titaniklad /
 // Alba-Lenatus / Lubellion / Sanctifire), adapted to the 41 list.
 mirrorjadeCost:true,
 // W9 (WindBot MaxxC timing, DefaultExecutor): Mulcharmy Fuwalos only on the opponent's turn before their Battle Phase.
 fuwalosTiming:true,
 // W10 (DefaultInfiniteImpermanence / Sky Striker WidowAnchorEffect): a SET Infinite Impermanence, Widow Anchor or Forbidden
 // Droplet answers their key or Extra Deck monster effect activated on the field, like the hand traps (r32 rule).
 setTraps:true,
 // W11 (AlbazExecutor BlazingCartesiaTheVirtuousActivate): Cartesia's Quick Effect Fusion uses only monsters with 2500 or
 // less ATK (never our Mirrorjade), and on the opponent's turn only makes Mirrorjade / Sanctifire or Kevy's delayed
 // Nadir Granguignol (Quem on the field).
 cartesia:true,
 // W12 (WindBot DefaultExecutor OnBattle / OnPreBattleBetween): a monster only attacks when the visible board lets it destroy
 // a target or attack directly; never into a face-up monster whose battle value is at least its ATK (r46 mirror log: Aluber
 // and Lubellion attacked their 3000 ATK Mirrorjade). Face-down defenders are unknown and still allowed.
 attackGuard:true,
 // r47 (ChatGPT RELAY-140; Kevy approved the build 11 Nov 17:18 AEDT). Both default ON; off gives the r46 rule exactly.
 // w1Proactive: W1 no longer bans Impermanence / Veiler / Droplet / Widow Anchor / Ghost Mourner on our own chain link when
 //   the opponent shows a face-up Effect Monster (they act on monsters, they do not answer an activation).
 // w12Battle: W12 uses the real battle value (DEF when attacking from Defense Position), never holds back a monster whose
 //   text changes the battle (reflect / indestructible / battle effect) or while we control an Equip Card, and leaves an
 //   equal-ATK trade to the policy.
 w1Proactive:true,
 w12Battle:true
};
export const setR46=(patch={})=>{for(const [k,v] of Object.entries(patch))R46[k]=v&&typeof v==='object'&&!Array.isArray(v)?{...R46[k],...v}:v;return R46};
