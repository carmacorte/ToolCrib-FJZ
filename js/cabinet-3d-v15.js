/* Tool Crib FJZ | Gabinete CSS 3D V15. Basado en toolcrib_gabinete_3d.html del usuario.
   Modelo independiente; los datos proceden de los botones generados por el inventario Excel. */
(function(){
'use strict';
const host=document.getElementById('storage-cab-drawers');
if(!host)return;
const css=document.createElement('style');
css.textContent=`
#view-locations #storage-cab-drawers.tc3d-host{display:block!important;position:relative!important;min-height:510px!important;padding:0!important;overflow:hidden!important;isolation:isolate;background:radial-gradient(ellipse at 50% 45%,#17426a,#061529 78%)!important;touch-action:pan-y}
#view-locations .tc3d-scene{position:relative;width:100%;height:510px;overflow:hidden;perspective:900px;touch-action:pan-y;user-select:none}
#view-locations .tc3d-world{position:absolute;left:50%;top:48%;width:218px;height:350px;transform-style:preserve-3d;transition:transform .14s ease-out;pointer-events:none}
#view-locations .tc3d-cab{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}
#view-locations .tc3d-wall{position:absolute;box-sizing:border-box;border:2px solid #4788b8;background:linear-gradient(130deg,#245b88,#0b294b 85%);backface-visibility:visible}
#view-locations .tc3d-front{width:218px;height:350px;transform:translateZ(92px);padding:9px 9px 13px;display:flex;flex-direction:column;gap:3px;border:7px solid #194a77;box-shadow:inset 0 0 17px #020c1e;pointer-events:none}
#view-locations .tc3d-back{width:218px;height:350px;transform:rotateY(180deg) translateZ(92px)}
#view-locations .tc3d-left{width:184px;height:350px;left:17px;transform:rotateY(-90deg) translateZ(109px);background:linear-gradient(110deg,#234e79,#071c36)}
#view-locations .tc3d-right{width:184px;height:350px;left:17px;transform:rotateY(90deg) translateZ(109px)}
#view-locations .tc3d-top{width:218px;height:184px;top:83px;transform:rotateX(90deg) translateZ(92px);background:linear-gradient(135deg,#659bc8,#244d77);border-color:#93c5e6}
#view-locations .tc3d-bottom{width:218px;height:184px;top:83px;transform:rotateX(-90deg) translateZ(258px)}
#view-locations .tc3d-drawer{position:relative;flex:1;min-height:0;display:block;width:100%;padding:0;border:0;background:transparent;color:white;text-align:left;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.2,.8,.2,1);cursor:pointer;pointer-events:auto}
#view-locations .tc3d-drawer.is-open{transform:translateZ(125px);z-index:20}
#view-locations .tc3d-panel{position:absolute;inset:0;background:linear-gradient(150deg,#2b669a,#102d51);border:1px solid #5896c6;box-shadow:inset 0 1px 3px #78b7e4;display:flex;align-items:center;padding:0 10px;font-size:18px;font-weight:800;backface-visibility:hidden}
#view-locations .tc3d-drawer.is-selected .tc3d-panel{border:2px solid #62d6ff;box-shadow:0 0 11px #00bfff8a,inset 0 0 9px #008cde}
#view-locations .tc3d-drawer:focus-visible .tc3d-panel{outline:2px solid #fff;outline-offset:2px}
#view-locations .tc3d-handle{position:absolute;width:88px;height:8px;right:10px;top:42%;border-radius:4px;background:linear-gradient(#fff,#a6bed5 55%,#426987);box-shadow:2px 3px 4px #0008}
#view-locations .tc3d-count{position:absolute;bottom:2px;left:40px;font-size:8px;font-weight:600;color:#c7e5f8}
#view-locations .tc3d-tray{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}
#view-locations .tc3d-floor{position:absolute;left:2px;right:2px;top:0;height:177px;transform-origin:top;transform:rotateX(-90deg);background:linear-gradient(#082b49,#0879a8);border:2px solid #53cfff;box-shadow:inset 0 0 18px #00c6ff55}
#view-locations .tc3d-traywall{position:absolute;top:0;height:177px;width:18px;transform-origin:top;background:#103b5d;border:1px solid #57a5d1}
#view-locations .tc3d-traywall.left{left:0;transform:rotateX(-90deg) rotateY(90deg)}
#view-locations .tc3d-traywall.right{right:0;transform:rotateX(-90deg) rotateY(90deg)}
#view-locations .tc3d-wheel{position:absolute;bottom:-19px;width:31px;height:31px;border:6px solid #5292c4;border-radius:50%;background:#061222;box-shadow:inset 0 0 0 5px #1d4265}
#view-locations .tc3d-toolbar{position:absolute;right:10px;bottom:8px;display:flex;gap:6px;z-index:5}
#view-locations .tc3d-toolbar button{border:1px solid #5186af;background:#102e4ee8;color:#e9f7ff;border-radius:7px;padding:6px 9px;font-size:11px;cursor:pointer}
#view-locations .tc3d-hint{position:absolute;left:10px;top:10px;z-index:5;color:#b1d4eb;font-size:10px;pointer-events:none}
#view-locations .tc3d-scene{cursor:grab}#view-locations .tc3d-scene.dragging{cursor:grabbing;touch-action:none}
@media(max-width:650px){#view-locations #storage-cab-drawers.tc3d-host{min-height:480px!important}#view-locations .tc3d-scene{height:480px}}
@media(prefers-reduced-motion:reduce){#view-locations .tc3d-drawer,#view-locations .tc3d-world{transition:none!important}}
`;
document.head.append(css);
host.classList.add('tc3d-host');
let cab='',open=null,lastSelected='',yaw=-28,pitch=-12,zoom=.82,dragging=false,dragDistance=0,px=0,py=0,pointer=null,scene=null,world=null,spin=false,raf=0;
function div(cls,parent){const e=document.createElement('div');e.className=cls;parent.append(e);return e}
function updateCamera(){if(world)world.style.transform=`translate(-50%,-50%) scale(${zoom}) rotateX(${pitch}deg) rotateY(${yaw}deg)`}
function stopSpin(){spin=false;if(raf)cancelAnimationFrame(raf);raf=0}
function tick(){if(!spin)return;yaw=(yaw+.4)%360;updateCamera();raf=requestAnimationFrame(tick)}
function build(){
 const originals=[...host.querySelectorAll(':scope > button.storage-drawer')];
 if(!originals.length)return;
 if(cab!==storageUI.cabinet){cab=storageUI.cabinet;open=null}
 if(lastSelected&&lastSelected!==storageUI.drawer)open=storageUI.drawer;
 lastSelected=storageUI.drawer;
 const items=originals.map(b=>({letter:b.dataset.value,count:b.querySelector('em')?.textContent||'0 SKU',selected:b.classList.contains('active'),title:b.title}));
 host.replaceChildren();
 scene=div('tc3d-scene',host);
 const hint=div('tc3d-hint',scene);hint.textContent='ARRASTRA PARA ROTAR · 360°';
 world=div('tc3d-world',scene);const cabinet=div('tc3d-cab',world);
 for(const face of ['back','left','right','top','bottom'])div('tc3d-wall tc3d-'+face,cabinet);
 const front=div('tc3d-wall tc3d-front',cabinet);
 for(const [x,z] of [['3px','100px'],['183px','100px'],['3px','-80px'],['183px','-80px']]){
  const wheel=div('tc3d-wheel',cabinet);wheel.style.left=x;wheel.style.transform=`translateZ(${z})`;
 }
 items.forEach(item=>{
  const button=document.createElement('button');button.type='button';button.className='tc3d-drawer'+(item.selected?' is-selected':'');
  button.dataset.storageAction='drawer';button.dataset.value=item.letter;button.title=item.title;button.setAttribute('aria-expanded',String(open===item.letter));
  const tray=div('tc3d-tray',button);div('tc3d-floor',tray);
  const panel=div('tc3d-panel',button);panel.append(document.createTextNode(item.letter));div('tc3d-handle',panel);
  const count=div('tc3d-count',panel);count.textContent=item.count;
  button.addEventListener('click',e=>{
   e.stopPropagation();
   if(dragDistance>5)return;
   const wasOpen=open===item.letter;
   open=wasOpen?null:item.letter;
   storageUI.drawer=item.letter;
   storageUI.slot=1;
   lastSelected=item.letter;
   // Preserve the 3D scene; changing the inventory selection must not recreate the cabinet.
   front.querySelectorAll('.tc3d-drawer').forEach(drawer=>{
    const selected=drawer.dataset.value===item.letter;
    drawer.classList.toggle('is-selected',selected);
    drawer.classList.toggle('is-open',drawer.dataset.value===open);
    drawer.setAttribute('aria-expanded',String(drawer.dataset.value===open));
   });
   // Update the compartment panel through the existing inventory renderer.
   // The observer will rebuild the scene if that renderer replaces the source buttons.
   if(typeof renderStorageMap==='function')renderStorageMap();
  });
  front.append(button);
 });
 const toolbar=div('tc3d-toolbar',scene);
 const controls=[['−',()=>{zoom=Math.max(.48,zoom-.1);updateCamera()}],['+',()=>{zoom=Math.min(1.45,zoom+.1);updateCamera()}],['Restablecer',()=>{stopSpin();yaw=-28;pitch=-12;zoom=.82;updateCamera()}],['360°',()=>{spin=!spin;if(spin)tick();else stopSpin()}]];
 controls.forEach(([label,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);toolbar.append(b)});
 scene.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointer=e.pointerId;px=e.clientX;py=e.clientY;dragDistance=0;dragging=true;scene.classList.add('dragging');scene.setPointerCapture(e.pointerId)});
 scene.addEventListener('pointermove',e=>{if(!dragging||pointer!==e.pointerId)return;const dx=e.clientX-px,dy=e.clientY-py;dragDistance+=Math.abs(dx)+Math.abs(dy);yaw+=dx*.55;pitch=Math.max(-65,Math.min(65,pitch-dy*.35));px=e.clientX;py=e.clientY;updateCamera()});
 const release=e=>{if(pointer!==e.pointerId)return;dragging=false;pointer=null;scene.classList.remove('dragging')};
 scene.addEventListener('pointerup',release);scene.addEventListener('pointercancel',release);
 scene.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.48,Math.min(1.45,zoom-e.deltaY*.001));updateCamera()},{passive:false});
 updateCamera();
 // Apply opening after insertion so CSS transitions run on iOS Safari.
 if(open)requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const drawer=[...front.querySelectorAll('.tc3d-drawer')].find(x=>x.dataset.value===open);
  if(drawer){drawer.classList.add('is-open');drawer.setAttribute('aria-expanded','true')}
 }));
}
new MutationObserver(()=>{if(host.querySelector(':scope > button.storage-drawer'))build()}).observe(host,{childList:true});
build();
})();
