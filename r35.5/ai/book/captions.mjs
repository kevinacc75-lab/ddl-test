// r32 (Kevy 22 Oct 16:50, item 4: "a short caption naming the combo line ... so you can see the plan as well as the moves").
// Plain-words goal for each combo-book line, shown in Learning mode when the AI starts that line. Lines missing here
// fall back to the line's own name. Data only: the AI's choices never read this file.
export const LINE_GOALS={
 // Branded
 'G-04':'Punishing their monster effect with Triple Tactics Talent',
 'G-01':'Fallen of Albaz eats their monster',
 'L-04':'Going for Mirrorjade (Aluber + Branded Opening)',
 'L-01':'Going for Mirrorjade (one-card Aluber)',
 'L-05':'Going for Mirrorjade (Branded Opening as Aluber)',
 'L-02':'Going for Mirrorjade (one-card Branded Fusion)',
 'G-03':'Stealing their monster for Super Polymerization',
 'L-06':'Extending with Branded in High Spirits',
 'V53-SYN':'Making Despian Luluwalilith',
 'V53-L3':'Granguignol into Titaniklad',
 'V53-QC':'Guiding Quem sends Albaz, then a Cartesia Fusion',
 'V53-WD':'Fallen of the White Dragon into a Cartesia Fusion',
 // 'V53-KITT':'Springans Kitt into Branded Fusion', (line disabled by the Kitt swap, 28 Oct; Seto queue item 3 rebuilds it)
 'V53-CART':'Fusion with Blazing Cartesia',
 'RULE-NS-2':'Guiding Quem sends Albaz (saving Albaz for later)',
 'B-02':'Fusion Deployment for Fallen of Albaz',
 'L-07':'Going for Dragoon',
 'R30-QNS':'Guiding Quem for a body on their turn',
 'R33-PHARA':'Phara shields the combo spell from hand traps',
 'R33-SPL':'Going for Mirrorjade (Super Poly into Lubellion)',
 'MK-UZU':'Going for Uzuhime (Ha-Re and Hu-Li equips)',
 'MK-E1':'Uzuhime hits their biggest monster three times',
 // Lunalight
 'LU-01':'Going for Lunalight Liger Dancer',
 // Other decks
 'K-01':'Going for Kashtira Shangri-Ira',
 'BE-01':'Going for Blue-Eyes Spirit Dragon',
 'TO-01':'Going for Toon Black Luster Soldier',
 'HE-FD':'Going for Destroyer Phoenix Enforcer',
 'HE-FURN':'Masked HERO Furnace fetches Mask Change',
 'HE-FARIS':'Vision HERO Faris sets up Malicious','BE-SAGE':'Lordly Lode summons Blue-Eyes, Sage is the Tuner: Spirit Dragon','BE-SPIRIT':'Spirit with Eyes of Blue first, Lordly Lode last: Spirit Dragon','K-SCARE':'Birth lets Scareclaw in; Kashtiratheosis adds a 2nd Level 7',
 'HE-STRAT':'Stratos searches a HERO',
 'HE-CALL':'Emergency Call fetches Stratos',
 'HE-AHL':'A Hero Lives calls Shadow Mist or Stratos',
 'HE-VYON':'Vision HERO Vyon sets up two Malicious',
 'HE-MAL':'Malicious brings a second Malicious',
 'HE-EJ':'Miracle Ejector into EN Shuffle'
};
export const lineGoal=(id,line)=>LINE_GOALS[id]||String(line?.name||id||'').replace(/->/g,'→');
export const lineRoute=line=>String(line?.name||'').replace(/->/g,'→');
