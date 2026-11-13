export const BOSS_SCENES={
 'Mirrorjade the Iceblade Dragon':{theme:'ice',title:'THE ICEBLADE DRAGON',summon:'FUSION SUMMON',accent:'var(--palette-487)',line:'From the abyss, the iceblade awakens.'},
 'Red-Eyes Dark Dragoon':{theme:'crimson',title:'THE DARK DRAGOON',summon:'FUSION SUMMON',accent:'var(--palette-488)',line:'Dark magic. Crimson flame.'},
 'Albion the Sanctifire Dragon':{theme:'sanctifire',title:'THE SANCTIFIRE DRAGON',summon:'SPECIAL SUMMON',accent:'var(--palette-489)',line:'A wing of flame. A light in the abyss.'},
 'Lubellion the Searing Dragon':{theme:'searing',title:'THE SEARING DRAGON',summon:'SPECIAL SUMMON',accent:'var(--palette-490)',line:'The Fusion flame takes another form.'},
 'Uzuhime the Manifested Mikanko':{theme:'mikanko',title:'THE MANIFESTED MIKANKO',summon:'XYZ SUMMON',accent:'var(--palette-491)',line:'A sacred dance turns the battle.'},
 'Ohime the Manifested Mikanko':{theme:'mikanko',title:'THE MANIFESTED MIKANKO',summon:'SPECIAL SUMMON',accent:'var(--palette-491)',line:'The dance begins.'},
 'Lunalight Liger Dancer':{theme:'lunar',title:'THE LIGER DANCER',summon:'FUSION SUMMON',accent:'var(--palette-492)',line:'Under the moon, the hunt begins.'},
 'Lunalight Leo Dancer':{theme:'lunar',title:'THE LEO DANCER',summon:'FUSION SUMMON',accent:'var(--palette-492)',line:'The moonlit hunter takes the field.'},
 'Sky Striker Ace - Kagari':{theme:'striker',title:'ACE · KAGARI',summon:'LINK SUMMON',accent:'var(--palette-493)',line:'Striker system online.'},
 'Sky Striker Ace = Zero':{theme:'striker',title:'ACE · ZERO',summon:'LINK SUMMON',accent:'var(--palette-493)',line:'Zero protocol engaged.'}
};
export function sceneFor(code,db){return BOSS_SCENES[db[code]?.name]||null}
export function sceneDuration(events,db,enabled=true){return enabled?events.filter(e=>e.type==='summon'&&e.special&&sceneFor(e.code,db)).length*6000:0}
