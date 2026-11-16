// Presentation-only B1. Input is the worker's public event stream, never duel state.
import {publicMove} from './public-identity.mjs';
const MATERIAL = 8, FUSION = 262144;
export const MATERIAL_MS = Object.freeze({learning:4000, duel:2000, broadcast:1200, instant:0});
const zone = location => ({1:'Deck',2:'Hand',4:'Field',8:'Field',16:'GY',32:'Banished',64:'Extra Deck'})[location] || 'Unknown zone';
const isMaterial = e => e.type === 'move' && (e.reason & MATERIAL) && (e.reason & FUSION);

export function publicMaterial(e) {
  const from = e.from || {}, to = e.to || {};
  // r34: an Xyz Material arrives as location 64 with an overlay_sequence; it is shown as an Xyz Material, not an Extra Deck card.
  const overlay = to.overlay_sequence !== undefined && from.location === 4;
  // r35 (Alexis ruling, Seto L1 / P6): the same rule as the engine wrapper's move event (public-identity.mjs): named if
  // the source was public, or the destination is public. The wrapper already sends code 0 otherwise; a code-0 event
  // always stays anonymous here, and no name is ever restored from memory (the r34.1 PublicTracker is retired).
  const hidden = !e.code || !publicMove(from, to);
  return Object.freeze({code:hidden ? 0 : e.code, hidden, origin:zone(from.location), destination:overlay ? 'Xyz Material' : zone(to.location), controller:from.controller, destinationController:to.controller, destinationLocation:to.location});
}

// Match in native public order BEFORE ChainDirector extracts boss cut-ins. This
// matters when one resolution confirms more than one Fusion. No choice inference.
export class FusionMaterials {
  constructor() { this.reset(); }
  reset() { this.pending = []; this.confirmed = new Map(); }
  observe(events, db) {
    for (const e of events) {
      if (['turn','win','chainEnd','resolve','resolutionReady'].includes(e.type) || e.type === 'activate') this.pending = [];
      if (isMaterial(e)) this.pending.push({id:e.id, value:publicMaterial(e)});
      if (e.type === 'summon') {
        if (e.special && (db[e.code]?.type & 64) && this.pending.length) {
          this.confirmed.set(e.id, {items:this.pending.map(m=>m.value), moveIds:this.pending.map(m=>m.id)});
          if (this.confirmed.size > 120) this.confirmed.delete(this.confirmed.keys().next().value);
        }
        this.pending = [];
      }
    }
  }
  decorate(batches, preset) {
    const owned = new Set([...this.confirmed.values()].flatMap(g=>g.moveIds));
    const result = [];
    for (const batch of batches) {
      const following = [], kept = [];
      for (let i=0;i<batch.events.length;i++) {
        const source = batch.events[i], e = owned.has(source.id) ? {...source, b1Material:true} : {...source};
        const group = e.type === 'summon' && this.confirmed.get(e.id);
        if (!group) { kept.push(e); continue; }
        this.confirmed.delete(e.id);
        const reveal = {events:[{type:'fusionMaterials', player:e.player, materials:group.items}], duration:MATERIAL_MS[preset] ?? MATERIAL_MS.learning};
        if (i === 0) { result.push(reveal); kept.push(e); }
        else {
          // An ordinary Fusion has no boss cut-in in 2m. Preserve its zero extra
          // hold, but dispatch its existing summon feedback after MATERIALS.
          following.push(reveal, {events:[e],duration:0});
        }
      }
      if (kept.length) result.push({...batch,events:kept});
      result.push(...following);
    }
    return result;
  }
}

export function materialsEnabled({preset, enabled, reduced, skipCutins}, body) {
  return !!MATERIAL_MS[preset] && enabled && !reduced && !skipCutins &&
    body.dataset.graphics !== 'smooth' && body.dataset.theme !== 'contrast' &&
    !body.classList.contains('quiet-motion') && !body.ownerDocument.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function materialsLine(items, db) {
  return 'Fusion materials: ' + items.map(m => (m.hidden ? 'Face-down material' : db[m.code]?.name || 'Public card') + ' · ' + m.origin + ' → ' + m.destination).join('; ');
}

export class MaterialsScene {
  constructor({document, db, frame, animate, scale=1}) { Object.assign(this,{document,db,frame,animate,scale}); }
  clear() { this.node?.remove(); this.node=null; }
  reset() { this.clear(); this.log?.remove(); this.log=null; }
  show(e, duration, visual) {
    this.clear();
    const doc=this.document;
    if (!this.log) {
      this.log=doc.createElement('p'); this.log.id='fusion-materials-log'; this.log.className='fusion-materials-log';
      this.log.setAttribute('role','log'); this.log.setAttribute('aria-live','polite');
      (doc.getElementById('event-log')?.parentElement || doc.getElementById('duel') || doc.body).append(this.log);
    }
    this.log.textContent=materialsLine(e.materials,this.db());
    // Instant and accessibility/low-cost modes do not create a visual scene.
    if (!visual) return;
    const node=doc.createElement('section'); this.node=node; node.className='fusion-materials-scene';
    node.setAttribute('role','region'); node.setAttribute('aria-label','Fusion materials');
    const header=doc.createElement('h2'); header.className='materials-hazard'; header.textContent='MATERIALS'; node.append(header);
    const row=doc.createElement('div'); row.className='materials-row'; row.setAttribute('aria-label','Materials and their public routes');
    for (const m of e.materials) {
      const item=doc.createElement('article'); item.className='materials-item';
      if (m.hidden) {
        const back=doc.createElement('div'); back.className='materials-back'; back.setAttribute('role','img'); back.setAttribute('aria-label','Face-down material'); back.textContent='FACE-DOWN MATERIAL'; item.append(back);
      } else {
        // Same original frame as the application's art-failed fallback. No new
        // third-party art; no image/network request or hidden-card lookup.
        const card=this.frame?.(m.code); if (!card) throw new Error('Public material frame unavailable');
        // r26: the card's own image (approved 21 Oct), the original frame as the fallback.
        const art=this.db()?.[m.code]?.art;
        if (art) { const img=doc.createElement('img'); img.className='materials-art'; img.alt=this.db()[m.code].name||''; img.src=art; img.onerror=()=>img.replaceWith(card); item.append(img); } else item.append(card);
      }
      const route=doc.createElement('p'); route.className='materials-route'; route.textContent=m.origin+' → '+m.destination; item.append(route); row.append(item);
    }
    node.append(row); const footer=doc.createElement('p'); footer.className='materials-destination';
    const destinations=[...new Set(e.materials.map(m=>m.destination))]; footer.textContent=destinations.length===1?'TO '+destinations[0].toUpperCase()+' · TOGETHER':'MATERIALS MOVE · PUBLIC DESTINATIONS SHOWN'; node.append(footer);
    doc.getElementById('fx-layer').append(node);
    this.animate(row,[{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration*.12*this.scale,easing:'ease-out',fill:'both'});
    for (const [i,item] of [...row.children].entries()) {
      const m=e.materials[i], target=doc.querySelector(`[data-pile="${m.destinationController}:${m.destinationLocation}"]`) || (m.destinationLocation===1 ? doc.querySelector(`[data-deck-pile="${m.destinationController}"]`) : null);
      const a=item.getBoundingClientRect(), b=target?.getBoundingClientRect();
      const dx=b?.width?b.left+b.width/2-a.left-a.width/2:0,dy=b?.width?b.top+b.height/2-a.top-a.height/2:72;
      this.animate(item,[{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.15)`}],{duration:duration*.24*this.scale,delay:duration*.76*this.scale,easing:'ease-in',fill:'forwards'});
    }
    // r26 (Kevy's recording, 21 Oct): the panel leaves with its cards, so it never sits empty ("TO GY · TOGETHER" alone).
    this.animate(node,[{opacity:1},{opacity:1,offset:.55},{opacity:0}],{duration:duration*.3*this.scale,delay:duration*.7*this.scale,easing:'ease-in',fill:'forwards'});
  }
}
