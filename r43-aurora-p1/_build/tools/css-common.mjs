export const ORDER_LIST=['style','arena','mobile-motion','vibrant','master-duel','lab-shell','pacing-impact','arenas','showtime','fusion-materials','summon-cutscenes','coin-cutscene','human-flow','play-flow','fx-r23','token-fx','r26-panels','learning-routes','deck-list','r33-polish','r34-arena','r34-persona','dl-fx'];
export function family(p){p=p.toLowerCase();if(p.startsWith('--'))return p;p=p.replace(/^-(webkit|moz|ms|o)-/,'');
 if(p==='all')return '*';if(/^(top|right|bottom|left|inset)(-|$)/.test(p))return 'inset';if(/^(gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/.test(p))return 'gap';
 if(/^(place|align|justify)-/.test(p))return 'align';if(p==='line-height')return 'font';if(p==='word-wrap')return 'overflow';
 return p.split('-')[0]}
