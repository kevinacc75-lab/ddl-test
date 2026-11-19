// Frozen conservative whitelist; no new allowances without team co-signature.
export default {
  "13935001": [
    {
      "hint": 551,
      "targetCode": "*",
      "why": "Serenade Dance targets its own freshly Fusion Summoned monster to give ATK; bundled script own-controller filter."
    }
  ],
  "60303245": [
    {
      "hint": 551,
      "targetCode": "*",
      "why": "Almiraj targets an own monster to protect it from destruction; bundled script own-controller filter."
    }
  ],
  "86066372": [
    {
      "hint": 551,
      "targetCode": "*",
      "why": "Accesscode targets a Link Monster used as its material to gain ATK; bundled script material group filter."
    }
  ],
  "51409648": [
    {
      "hint": 551,
      "targetCode": 68468459,
      "why": "Rindbrumm targets Fallen of Albaz in its GY for its summon/banish effect."
    }
  ],
  "44886582": [
    {
      "hint": 551,
      "targetCode": "*",
      "why": "Super Duper Polymerization permits own Effect Monster targeting for the explicitly stated Fusion conversion."
    }
  ]
};
