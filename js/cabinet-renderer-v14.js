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
 const svg=el('svg',{viewBox:'0 0 385 610',class:'tc-iso-svg tc-v14-svg',role:'group','aria-label':'Gabinete digital con gavetas interactivas'});
 const defs=el('defs',{},svg);
 for(const [id,colors] of Object.entries({body:['#1e4b76','#0b2746'],side:['#28567f','#0c2b4e'],top:['#619ac6','#244e76'],front:['#244d75','#0c294b'],face:['#306393','#163d67'],active:['#48a3dc','#14538c']})){
  const g=el('linearGradient',{id:'v14-'+id,x1:'0%',y1:'0%',x2:'95%',y2:'100%'},defs);
  colors.forEach((color,i)=>el('stop',{offset:i?'100%':'0%','stop-color':color},g));
 }

 // Unified oblique projection: X horizontal, Y vertical, depth (-78,-48).
 // Front is a true rectangle. Top and left wall use the SAME depth vector.
 el('ellipse',{cx:198,cy:563,rx:158,ry:20,fill:'#06182c',opacity:'.65'},svg);
 [[134,551],[317,551]].forEach(([x,y])=>{
  el('circle',{cx:x,cy:y,r:17,fill:'#09223e',stroke:'#5595c3','stroke-width':4},svg);
  el('circle',{cx:x,cy:y,r:7,fill:'#3278a9',stroke:'#d2ebff','stroke-width':2},svg);
 });
 el('polygon',{points:'52,107 130,155 130,545 52,497',fill:'url(#v14-side)',stroke:'#5d9bc7','stroke-width':2},svg);
 el('polygon',{points:'52,107 247,107 325,155 130,155',fill:'url(#v14-top)',stroke:'#a3d4f1','stroke-width':2},svg);
 el('rect',{x:130,y:155,width:195,height:390,fill:'url(#v14-front)',stroke:'#6da8d1','stroke-width':2.5},svg);
 el('path',{d:'M130 545 H325 V558 H130 Z',fill:'#1b466b',stroke:'#70b0da'},svg);
 const step=368/buttons.length;
 const rows=buttons.map((b,i)=>({letter:b.dataset.value,index:i,count:b.querySelector('em')?.textContent||'0 SKU',active:b.classList.contains('active'),hit:(b.querySelector('b')?.textContent||'').includes('★'),opened:b.dataset.value===open}));
 rows.sort((a,b)=>Number(a.opened)-Number(b.opened)).forEach(row=>{
  const y=163+row.index*step,h=step-4;
  if(row.opened){
   el('rect',{x:138,y,width:179,height:h,fill:'#041a30',stroke:'#6aa8d0','stroke-width':1.5},svg);
  }
  const group=el('g',{class:'tc-v14-drawer'+(row.opened?' is-open':'')+(row.active?' is-selected':''),'data-storage-action':'drawer','data-value':row.letter,role:'button',tabindex:0,'aria-expanded':String(row.opened),'aria-label':'Gaveta '+row.letter+', '+row.count},svg);
  el('title',{},group,'Gaveta '+row.letter);
  if(row.opened){
   // All tray surfaces use the same projection; the tray is rigidly connected to its front.
   const back=29, rise=18;
   el('polygon',{points:`138,${y+3} 317,${y+3} ${317-back},${y+3-rise} ${138-back},${y+3-rise}`,fill:'#1b5279',stroke:'#8fd9fa','stroke-width':1.6},group);
   el('polygon',{points:`${138-back},${y+3-rise} 138,${y+3} 138,${y+14} ${138-back},${y+14-rise}`,fill:'#0a304f',stroke:'#5aadd7','stroke-width':1.2},group);
   el('polygon',{points:`317,${y+3} ${317-back},${y+3-rise} ${317-back},${y+14-rise} 317,${y+14}`,fill:'#0b385a',stroke:'#5aadd7','stroke-width':1.2},group);
   const bins=Math.min(12,storageLayout().bins);
   for(let k=0;k<bins;k++){
    const col=k%4,r=Math.floor(k/4);
    const x=146+col*40-r*7, yy=y-1-r*4;
    el('path',{d:`M${x} ${yy} h28`,stroke:k+1===storageUI.slot?'#8ff0ff':'#6aa9c7','stroke-width':k+1===storageUI.slot?2.4:1.2},group);
   }
  }
  el('rect',{x:138,y,width:179,height:h,class:'tc-v14-face',fill:'url(#v14-'+(row.active?'active':'face')+')',stroke:row.active?'#82e4ff':'#5c94bb','stroke-width':row.active?2.7:1.3},group);
  el('text',{x:149,y:y+h*.68,class:'tc-v14-letter'},group,row.letter);
  el('path',{d:`M210 ${y+h*.52} H288`,stroke:'#d9eefa','stroke-width':7,'stroke-linecap':'round'},group);
  el('path',{d:`M210 ${y+h*.52-2} H288`,stroke:'#fff','stroke-width':1.7,'stroke-linecap':'round'},group);
  el('text',{x:188,y:y+h-6,class:'tc-v14-count','text-anchor':'middle'},group,row.count);
 });
 el('text',{x:190,y:601,'text-anchor':'middle',class:'tc-v14-note'},svg,'Selecciona una gaveta para abrirla o cerrarla');
 host.replaceChildren(svg);
 busy=false;
}
const css=document.createElement('style');css.textContent=`
#view-locations .tc-v14-svg{display:block;width:100%;height:auto;overflow:visible}
#view-locations .tc-v14-svg .tc-v14-drawer{cursor:pointer;outline:none;transition:transform .48s cubic-bezier(.22,.82,.22,1),filter .48s}
#view-locations .tc-v14-svg .tc-v14-drawer.is-open{transform:translate(38px,24px);filter:drop-shadow(3px 4px 5px #00162a99)}
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