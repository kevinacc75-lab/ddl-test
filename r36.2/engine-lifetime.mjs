// The upstream JS wrapper retains callback registry entries after native destroy.
// Release their payloads without changing the vendored core or its rule behavior.
const installed=new WeakMap(),cellMaps=new WeakMap();
export function releaseDestroyedDuelCallbacks(core){
 if(typeof core.createDuel!=='function'||typeof core.destroyDuel!=='function')return core;
 if(installed.has(core))return core;const create=core.createDuel.bind(core),destroy=core.destroyDuel.bind(core),cells=new WeakMap(),stats={created:0,released:0,active:0};installed.set(core,stats);cellMaps.set(core,cells);
 core.createDuel=options=>{const cell={callbacks:{cardReader:options.cardReader,scriptReader:options.scriptReader,errorHandler:options.errorHandler}};let handle;
  try{handle=create({...options,cardReader:code=>cell.callbacks?.cardReader(code)||null,scriptReader:name=>cell.callbacks?.scriptReader(name)||null,errorHandler:(type,text)=>cell.callbacks?.errorHandler?.(type,text)})}catch(error){cell.callbacks=null;throw error}
  if(handle){cells.set(handle,cell);stats.created++;stats.active++}else cell.callbacks=null;return handle;
 };
 core.destroyDuel=handle=>{try{return destroy(handle)}finally{const cell=cells.get(handle);if(cell?.callbacks){cell.callbacks=null;stats.released++;stats.active--}cells.delete(handle)}};
 return core;
}
export const callbackLifetimeStats=core=>({...installed.get(core)});

// Engine snapshots (dist/ai/engine-snapshot.mjs) rewind engine memory, so a world duel's
// native state can already be gone when the search finishes with it. Release its callback
// payload without calling into the engine.
export function releaseDuelCallbacksOnly(core,handle){const cells=cellMaps.get(core),stats=installed.get(core),cell=cells?.get(handle);if(cell?.callbacks){cell.callbacks=null;stats.released++;stats.active--}cells?.delete(handle)}
