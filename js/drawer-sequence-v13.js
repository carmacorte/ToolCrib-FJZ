/* Tool Crib FJZ - secuencia de localizacion de gaveta V13.
   No modifica existencias ni ubicaciones: solo consulta el inventario cargado. */
(function(){
'use strict';
const map=document.getElementById('view-locations');
const shell=map?.querySelector('.storage-shell');
const host=document.getElementById('storage-cab-drawers');
if(!map||!shell||!host||typeof activeItems!=='function'||typeof storageParseCabinet!=='function')return;
const style=document.createElement('style');
style.id='tc-v13-sequence-style';
style.textContent=`
#view-locations .tc-sequence{background:#fff;border:1px solid #dce7f2;border-radius:14px;box-shadow:0 5px 20px #1739540d;margin:0 0 17px;overflow:hidden}
#view-locations .tc-seq-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:17px 19px 12px}
#view-locations .tc-seq-top strong{font-size:14px;color:#1b3c5b;display:block}
#view-locations .tc-seq-top small{font-size:11px;color:#6a8198;display:block;margin-top:5px}
#view-locations .tc-seq-search{display:flex;align-items:center;gap:8px;flex:1 1 260px;max-width:390px}
#view-locations .tc-seq-search input{background:#fff;border:1px solid #cbdbea;border-radius:8px;padding:10px 12px;color:#1c3b5a;width:100%;min-width:0;font-size:12px}
#view-locations .tc-seq-list{display:flex;gap:6px;flex-wrap:wrap;padding:0 19px 12px}
#view-locations .tc-seq-option{border:1px solid #dce7f3;background:#f6f9fd;color:#285275;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;max-width:230px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
#view-locations .tc-seq-option:hover,#view-locations .tc-seq-option[aria-current=true]{border-color:#48aee8;background:#e4f4ff;color:#0a5487}
#view-locations .tc-seq-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;padding:12px 19px 15px;border-top:1px solid #edf2f8}
#view-locations .tc-seq-step{display:flex;align-items:center;gap:9px;min-width:0;padding:10px;border-radius:9px;background:#f5f8fc;border:1px solid #e4ebf3;transition:background .25s,border-color .25s,box-shadow .25s}
#view-locations .tc-seq-step b{flex:0 0 29px;width:29px;height:29px;display:grid;place-items:center;border-radius:50%;background:#dce8f4;color:#2e648d;font-size:14px}
#view-locations .tc-seq-step span{font-size:11px;font-weight:700;color:#58748b;line-height:1.4}
#view-locations .tc-seq-step.is-active{background:#eaf7ff;border-color:#57bcf0;box-shadow:0 0 0 1px #62caff55}
#view-locations .tc-seq-step.is-active b{color:#fff;background:#1378bc;box-shadow:0 0 13px #49bfff77}
#view-locations .tc-seq-step.is-done b{background:#2b997c;color:#fff}
#view-locations .tc-seq-status{padding:11px 19px 14px;background:#f7fafc;border-top:1px solid #e8eef5;color:#41637e;font-size:12px;line-height:1.5;min-height:42px}
#view-locations .tc-seq-status strong{color:#146a9d}
#view-locations .tc-seq-status.tc-error{color:#a34c38;background:#fff8f2}
#view-locations .tc-iso-drawer.tc-seq-target .tc-iso-face{stroke:#a3eeff;stroke-width:3;filter:drop-shadow(0 0 5px #26c7ff)}
@media(max-width:840px){#view-locations .tc-seq-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:450px){#view-locations .tc-seq-steps{gap:5px;padding:9px}#view-locations .tc-seq-step{padding:7px;gap:5px}#view-locations .tc-seq-step span{font-size:10px}#view-locations .tc-seq-top{padding:13px}#view-locations .tc-seq-list{padding:0 13px 12px}}
@media(prefers-reduced-motion:reduce){#view-locations .tc-seq-step{transition:none}}
`;
document.head.append(style);
const panel=document.createElement('section');
panel.className='tc-sequence';
panel.setAttribute('aria-label','Secuencia de localización de número de parte y apertura de gaveta');
panel.innerHTML=`<div class="tc-seq-top"><div><strong>Localizador de gavetas · Secuencia interactiva</strong><small>Selecciona un número de parte para identificar y abrir su gaveta virtual.</small></div><div class="tc-seq-search"><input id="tc-seq-input" type="search" autocomplete="off" aria-label="Buscar número de parte para localizar gaveta" placeholder="Buscar número de parte o descripción…" /><button type="button" class="btn" id="tc-seq-go">Localizar</button></div></div><div class="tc-seq-list" id="tc-seq-list"></div><div class="tc-seq-steps" aria-label="Progreso de la localización"><div class="tc-seq-step is-active"><b>1</b><span>Seleccionar número de parte</span></div><div class="tc-seq-step"><b>2</b><span>Identificar gaveta asignada</span></div><div class="tc-seq-step"><b>3</b><span>Apertura animada</span></div><div class="tc-seq-step"><b>4</b><span>Ubicación lista para acceso</span></div></div><div class="tc-seq-status" id="tc-seq-status" role="status" aria-live="polite">Importa tu Excel y selecciona un SKU con una ubicación de gaveta asignada.</div>`;
shell.before(panel);
const input=panel.querySelector('#tc-seq-input');
const options=panel.querySelector('#tc-seq-list');
const status=panel.querySelector('#tc-seq-status');
const steps=Array.from(panel.querySelectorAll('.tc-seq-step'));
let token=0,timerA=null,timerB=null,lastId='';
const delay=(callback,ms)=>setTimeout(callback,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms);
function phase(n,message,error=false){
 steps.forEach((el,i)=>{el.classList.toggle('is-active',i===n-1);el.classList.toggle('is-done',i<n-1)});
 status.textContent=message;status.classList.toggle('tc-error',error);
}
function matches(){
 const q=input.value.trim().toLocaleLowerCase('es-MX');
 const all=activeItems();
 return (q?all.filter(x=>[x.sku,x.name].some(v=>String(v||'').toLocaleLowerCase('es-MX').includes(q))):all).slice().sort((a,b)=>String(a.sku).localeCompare(String(b.sku),'es-MX',{numeric:true})).slice(0,7);
}
function list(){
 options.replaceChildren();
 const all=activeItems();
 if(!all.length){phase(1,'Sin materiales cargados: importa el archivo de inventario Excel.');return;}
 const results=matches();
 results.forEach(item=>{
  const button=document.createElement('button');button.type='button';button.className='tc-seq-option';
  button.textContent=item.sku+(item.location?' · '+item.location:' · Sin ubicación');
  button.title=item.name||item.sku;button.setAttribute('aria-current',String(item.id===lastId));
  button.addEventListener('click',()=>start(item));
  options.append(button);
 });
 if(!results.length)phase(1,'No se encontraron números de parte que coincidan.',true);
}
function highlight(letter){
 host.querySelectorAll('.tc-iso-drawer').forEach(el=>el.classList.toggle('tc-seq-target',el.getAttribute('data-value')===letter));
}
function start(item){
 token++;const mine=token;clearTimeout(timerA);clearTimeout(timerB);lastId=item.id;
 input.value=item.sku;list();
 const loc=storageParseCabinet(item.location||'');
 if(!loc||!loc.drawer||!loc.slot){
  phase(1,item.location?('El SKU '+item.sku+' está en '+item.location+'. Se mostrará su ubicación, sin animación de gaveta.'):('El SKU '+item.sku+' no tiene una gaveta asignada en el Excel.'),!item.location);
  if(item.location&&typeof storageFindItem==='function')storageFindItem(item.id);
  return;
 }
 phase(1,'Número de parte seleccionado: '+item.sku);
 // La ubicación se toma únicamente del inventario importado.
 storageUI.tab='cabinet';
 storageUI.cabinet=loc.cabinet;
 storageUI.drawer=loc.drawer;
 storageUI.slot=loc.slot;
 const originalSearch=storageUI.search;
 storageUI.search=item.sku;
 renderStorageMap();
 const standard=document.getElementById('storage-search');
 if(standard)standard.value=item.sku;
 phase(2,'Ubicación identificada: '+loc.cabinet+' / '+loc.drawer+' / '+String(loc.slot).padStart(2,'0')+'.');
 highlight(loc.drawer);
 timerA=delay(()=>{
  if(mine!==token)return;
  phase(3,'Abriendo virtualmente la gaveta '+loc.drawer+'…');
  const drawer=Array.from(host.querySelectorAll('.tc-iso-drawer')).find(x=>x.getAttribute('data-value')===loc.drawer);
  if(drawer&&drawer.getAttribute('aria-expanded')!=='true'){
   drawer.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  }
  highlight(loc.drawer);
  timerB=delay(()=>{
   if(mine!==token)return;
   phase(4,'Gaveta '+loc.drawer+' lista · compartimento '+String(loc.slot).padStart(2,'0')+' · '+item.sku+'. Apertura ilustrativa, no física.');
   highlight(loc.drawer);
  },800);
 },320);
}
panel.querySelector('#tc-seq-go').addEventListener('click',()=>{
 const q=input.value.trim().toLocaleLowerCase('es-MX');
 const items=activeItems().filter(x=>String(x.sku).toLocaleLowerCase('es-MX')===q);
 const chosen=items[0]||matches()[0];
 if(chosen)start(chosen);else phase(1,'Captura un número de parte presente en el Excel.',true);
});
input.addEventListener('input',()=>{token++;clearTimeout(timerA);clearTimeout(timerB);lastId='';phase(1,'Selecciona un material de los resultados.');list();});
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();panel.querySelector('#tc-seq-go').click();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-storage-action="find"]');
 if(!b||!b.dataset.id)return;
 const item=activeItems().find(x=>String(x.id)===String(b.dataset.id));
 if(item)delay(()=>start(item),30);
});
const watcher=new MutationObserver(()=>{if(map.classList.contains('active')&&panel.isConnected)list()});
watcher.observe(document.getElementById('storage-kpi-total'),{childList:true,characterData:true,subtree:true});
list();
})();
