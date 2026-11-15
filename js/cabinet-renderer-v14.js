/* Tool Crib - gabinete externo V14: geometria coherente y gavetas independientes. */
(function(){
'use strict';
const host=document.getElementById('storage-cab-drawers');
if(!host||typeof storageUI==='undefined')return;
let open=null,cabinet='',selected='',busy=false;
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent,text){
 const n=document.createElementNS(NS,tag);
 Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));
 if(text!==undefined)n.textContent=text;
 if(parent)parent.appendChild(n);
 return n;
}
function draw(){
 const buttons=Array.from(host.querySelectorAll('button.storage-drawer'));
 if(!buttons.length)return;
 const cab=storageUI.cabinet;
 if(cab!==cabinet){cabinet=cab;open=null;}
 const chosen=storageUI.drawer;
 if(selected&&chosen!==selected&&!busy)open=chosen;
 selected=chosen;
 const svg=el('svg',{viewBox:'0 0 360 610',class:'tc-iso-svg tc-v14-svg',role:'group','aria-label':'Gabinete digital con gavetas interactivas'});
 const defs=el('defs',{},svg);
 for(const [id,colors] of Object.entries({body:['#1e4b76','#0b2746'],side:['#28567f','#0c2b4e'],top:['#619ac6','#244e76'],front:['#244d75','#0c294b'],face:['#306393','#163d67'],active:['#48a3dc','#14538c']})){
  const g=el('linearGradient',{id:'v14-'+id,x1:'0%',y1:'0%',x2:'95%',y2:'100%'},defs);
  colors.forEach((color,i)=>el('stop',{offset:i?'100%':'0%','stop-color':color},g));
 }
 el('ellipse',{cx:185,cy:567,rx:152,ry:19,fill:'#06182c',opacity:'.65'},svg);
 [[99,552],[299,537]].forEach(([x,y])=>{
  el('circle',{cx:x,cy:y,r:17,fill:'#09223e',stroke:'#5595c3','stroke-width':4},svg);
  el('circle',{cx:x,cy:y,r:7,fill:'#3278a9',stroke:'#d2ebff','stroke-width':2},svg);
 });
 // All top edges share the same depth vector (-55,-36).
 el('polygon',{points:'43,124 98,160 98,550 43,514',fill:'url(#v14-side)',stroke:'#5d9bc7','stroke-width':2},svg);
 el('polygon',{points:'43,124 273,100 328,136 98,160',fill:'url(#v14-top)',stroke:'#a3d4f1','stroke-width':2},svg);
 el('polygon',{points:'98,160 328,136 328,540 98,564',fill:'url(#v14-front)',stroke:'#6da8d1','stroke-width':2.5},svg);
 el('path',{d:'M98 564 L328 540 L328 554 L98 578Z',fill:'#1b466b',stroke:'#70b0da'},svg);
 const step=380/buttons.length;
 const rows=buttons.map((b,i)=>({letter:b.dataset.value,index:i,count:b.querySelector('em')?.textContent||'0 SKU',active:b.classList.contains('active'),hit:(b.querySelector('b')?.textContent||'').includes('★'),opened:b.dataset.value===open}));
 // Closed drawers first; opened drawer last, keeping its own components grouped.
 rows.sort((a,b)=>Number(a.opened)-Number(b.opened)).forEach(row=>{
  const y=169+row.index*step,h=step-4;
  if(row.opened)el('polygon',{points:`108,${y} 318,${y-20} 318,${y+h-20} 108,${y+h}`,fill:'#041a30',stroke:'#6aa8d0','stroke-width':1.5},svg);
  const group=el('g',{class:'tc-v14-drawer'+(row.opened?' is-open':'')+(row.active?' is-selected':''),'data-storage-action':'drawer','data-value':row.letter,role:'button',tabindex:0,'aria-expanded':String(row.opened),'aria-label':'Gaveta '+row.letter+', '+row.count},svg);
  el('title',{},group,'Gaveta '+row.letter);
  if(row.opened){
   // Tray floor is a shallow trapezoid immediately behind its face, not 40px above it.
   el('polygon',{points:`108,${y+2} 318,${y-18} 306,${y-27} 96,${y-7}`,class:'tc-v14-tray',fill:'#21577f',stroke:'#9cdbfa','stroke-width':1.6},group);
   const bins=Math.min(12,storageLayout().bins);
   for(let k=0;k<bins;k++){
    const col=k%4,r=Math.floor(k/4),x=115+col*48,yb=y-5+r*2.5-col*.95;
    el('path',{d:`M${x} ${yb} l34 -3`,stroke:k+1===storageUI.slot?'#8ff0ff':'#6aa9c7','stroke-width':k+1===storageUI.slot?2.4:1.2},group);
   }
  }
  el('polygon',{points:`108,${y} 318,${y-20} 318,${y+h-20} 108,${y+h}`,class:'tc-v14-face',fill:'url(#v14-'+(row.active?'active':'face')+')',stroke:row.active?'#82e4ff':'#5c94bb','stroke-width':row.active?2.7:1.3},group);
  el('text',{x:120,y:y+h*.68,class:'tc-v14-letter'},group,row.letter);
  el('path',{d:`M195 ${y+h*.53} L280 ${y+h*.53-8}`,stroke:'#d9eefa','stroke-width':7,'stroke-linecap':'round'},group);
  el('path',{d:`M195 ${y+h*.53-2} L280 ${y+h*.53-10}`,stroke:'#fff','stroke-width':1.7,'stroke-linecap':'round'},group);
  el('text',{x:170,y:y+h-7,class:'tc-v14-count','text-anchor':'middle'},group,row.count);
  if(row.hit)el('circle',{cx:303,cy:y+6,r:3,fill:'#7ceaff'},group);
 });
 el('text',{x:183,y:605,'text-anchor':'middle',class:'tc-v14-note'},svg,'Selecciona una gaveta para abrirla o cerrarla');
 host.replaceChildren(svg);
 busy=false;
}
const css=document.createElement('style');css.textContent=`
#view-locations .tc-v14-svg{display:block;width:100%;height:auto;overflow:visible}
#view-locations .tc-v14-svg .tc-v14-drawer{cursor:pointer;outline:none;transition:transform .48s cubic-bezier(.22,.82,.22,1),filter .48s}
#view-locations .tc-v14-svg .tc-v14-drawer.is-open{transform:translate(22px,7px);filter:drop-shadow(3px 4px 5px #00162a99)}
#view-locations .tc-v14-svg .tc-v14-drawer:focus-visible .tc-v14-face{stroke:#fff;stroke-width:3}
#view-locations .tc-v14-svg .tc-v14-letter{font:900 21px Inter,Arial,sans-serif;fill:white;pointer-events:none}
#view-locations .tc-v14-svg .tc-v14-count{font:800 9px Inter,Arial,sans-serif;fill:#d1e9fc;pointer-events:none}
#view-locations .tc-v14-svg .tc-v14-note{font:10px Inter,Arial,sans-serif;fill:#b6d3e6;pointer-events:none}
#view-locations .tc-v14-svg .tc-v14-drawer:hover .tc-v14-face{stroke:#b5f0ff;stroke-width:2.5}
@media(prefers-reduced-motion:reduce){#view-locations .tc-v14-svg .tc-v14-drawer{transition:none}}
`;document.head.append(css);
host.addEventListener('click',e=>{
 const b=e.target.closest('.tc-v14-drawer');if(!b)return;
 busy=true;open=open===b.dataset.value?null:b.dataset.value;
 // Main application receives this same delegated event and updates compartment detail.
},true);
host.addEventListener('keydown',e=>{
 const b=e.target.closest('.tc-v14-drawer');if(!b||!['Enter',' '].includes(e.key))return;
 e.preventDefault();b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
});
new MutationObserver(()=>{if(host.querySelector('button.storage-drawer'))draw()}).observe(host,{childList:true});
draw();
})();