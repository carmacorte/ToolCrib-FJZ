/* Tool Crib V8 visual catalog: offline IndexedDB; stock and movements unchanged. */
(function(){'use strict';
const normalize=s=>String(s||'').trim().toUpperCase();
let active='',records={},demoManifest={};
function sampleUrl(sku){return demoManifest[normalize(sku)]?.main||''}
function imageFor(sku){const id=normalize(sku);return records[id]?.image||sampleUrl(id)}
window.ToolCribDemoPhotos={get:sampleUrl};
const photoStyle=document.createElement('style');
photoStyle.textContent=`
#view-locations .tc-map-material-photo{float:left;max-width:88px;width:28%;min-width:68px;margin:0 12px 7px 0;text-align:center;cursor:pointer}
#view-locations .tc-map-material-photo img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff;border:1px solid #dfebf5;border-radius:9px}
#view-locations .tc-map-material-photo small{display:block;font-size:9px;color:#697e92;margin-top:3px;line-height:1.2}
#view-locations .storage-sku-card:after{content:"";display:block;clear:both}
#inventory-body .tc-photo{background:#fff;object-fit:contain;border:1px solid #dfe9f3}
`;
document.head.append(photoStyle);
const dbReady=new Promise((resolve,reject)=>{const r=indexedDB.open('ToolCribVisualCatalog',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'sku'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
async function getAll(){const d=await dbReady;return new Promise((ok,no)=>{const r=d.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function put(record){const d=await dbReady;return new Promise((ok,no)=>{const t=d.transaction('photos','readwrite');t.objectStore('photos').put(record);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
async function remove(sku){const d=await dbReady;return new Promise((ok,no)=>{const t=d.transaction('photos','readwrite');t.objectStore('photos').delete(sku);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
const dlg=document.getElementById('tc-photo-dialog'),preview=document.getElementById('tc-photo-preview');
const publication = document.createElement('details');
publication.innerHTML = `<summary class="btn">Publicar foto al catálogo</summary>
 <p>La foto y el SKU serán públicos en carmacorte/ToolCrib-FJZ. Carga primero la fotografía que deseas compartir.</p>
 <label>Token de GitHub para este repositorio (Contents: lectura y escritura)
 <input type="password" autocomplete="off" spellcheck="false" placeholder="Solo para esta publicación"></label>
 <button type="button" class="btn primary">Publicar en GitHub</button>
 <p role="status" aria-live="polite"></p>`;
dlg.querySelector('.tc-photo-actions').after(publication);
const credential = publication.querySelector('input');
const publishButton = publication.querySelector('button');
const feedback = publication.querySelector('[role=status]');
let publishing = false;
dlg.addEventListener('close', () => {
 credential.value = '';
 publication.open = false;
 feedback.textContent = '';
});
async function publishPhoto(sku, record, token) {
 const repository = 'carmacorte/ToolCrib-FJZ';
 const indexPath = 'data/materials-images.json';
 const endpoint = 'https://api.github.com/repos/' + repository;
 async function request(path, method = 'GET', body) {
  const response = await fetch(endpoint + path, {
   method, redirect:'error', cache:'no-store',
   headers:{Authorization:'Bearer ' + token, Accept:'application/vnd.github+json','Content-Type':'application/json'},
   body:body && JSON.stringify(body)
  });
  if (!response.ok) {
   if ([401,403,404].includes(response.status)) throw Error('Verifica el token, su acceso al repositorio y el permiso Contents de escritura.');
   if ([409,422].includes(response.status)) throw Error('La rama cambió o está protegida. Revisa el catálogo y vuelve a intentar.');
   throw Error('GitHub respondió con el código ' + response.status);
  }
  return response.json();
 }
 if (!record?.image || !/^data:image\/(?:png|webp|jpeg);base64,/.test(record.image)) throw Error('Carga una fotografía local para este SKU.');
 if (record.image.length > 4200000) throw Error('La fotografía supera los 3 MB.');
 // Re-encode only the pixels, omitting embedded camera metadata.
 const photo = new Image();
 photo.src = record.image;
 await photo.decode();
 const scale = Math.min(1, 1600 / Math.max(photo.width, photo.height));
 const canvas = document.createElement('canvas');
 canvas.width = Math.max(1, Math.round(photo.width * scale));
 canvas.height = Math.max(1, Math.round(photo.height * scale));
 canvas.getContext('2d').drawImage(photo, 0, 0, canvas.width, canvas.height);
 const encoded = canvas.toDataURL('image/webp', 0.9);
 const ext = encoded.startsWith('data:image/webp;') ? 'webp' : 'png';
 const head = await request('/git/ref/heads/main');
 const base = await request('/git/commits/' + head.object.sha);
 const file = await request('/contents/' + indexPath + '?ref=' + head.object.sha);
 const bytes = Uint8Array.from(atob(file.content), c => c.charCodeAt(0));
 const manifest = JSON.parse(new TextDecoder().decode(bytes));
 const blob = await request('/git/blobs', 'POST', {encoding:'base64', content:encoded.split(',')[1]});
 const folder = /^[A-Z0-9_-][A-Z0-9._-]{0,99}$/.test(sku) ? sku :
  '~' + Array.from(new TextEncoder().encode(sku), b => b.toString(16).padStart(2,'0')).join('');
 const path = 'assets/materials/' + folder + '/' + blob.sha + '.' + ext;
 const previous = Object.hasOwn(manifest, sku) ? manifest[sku] : {};
 const entry = {main:path, gallery:previous.gallery || [], verified:record.verified === true, sample:false};
 if (previous.main === path && previous.verified === entry.verified && previous.sample === false) return entry;
 const next = {...manifest, [sku]:entry};
 const tree = await request('/git/trees', 'POST', {base_tree:base.tree.sha,tree:[
  {path,mode:'100644',type:'blob',sha:blob.sha},
  {path:indexPath,mode:'100644',type:'blob',content:JSON.stringify(next,null,2)+'\n'}
 ]});
 const commit = await request('/git/commits','POST',{message:'Actualizar fotografía de ' + sku, tree:tree.sha, parents:[head.object.sha]});
 await request('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});
 return entry;
}
publishButton.addEventListener('click', async () => {
 if (publishing) return;
 const sku = active, record = records[sku], token = credential.value.trim();
 if (!token) {feedback.textContent = 'Ingresa el token de publicación.';return}
 credential.value = '';
 publishing = true;
 publishButton.disabled = true;
 feedback.textContent = 'Publicando fotografía…';
 try {
  const entry = await publishPhoto(sku, record, token);
  demoManifest[sku] = entry;
  if (active === sku) feedback.textContent = 'Foto publicada. Las demás estaciones la verán al actualizar Inventory después del despliegue.';
 } catch (error) {
  if (active === sku) feedback.textContent = 'No se confirmó la publicación. ' + error.message;
 } finally {
  publishing = false;
  publishButton.disabled = false;
 }
});

function show(){
 const r=records[active],url=imageFor(active),demo=demoManifest[active]?.sample===true&&!r?.image;
 document.getElementById('tc-photo-sku').textContent=active+(demo?' · Imagen ilustrativa (DEMO)':'');
 preview.hidden=!url;
 preview.removeAttribute('src');
 if(url)preview.src=url;
 document.getElementById('tc-photo-empty').hidden=!!url;
 const check=document.getElementById('tc-photo-verified');check.checked=r?.image ? !!r.verified : !!demoManifest[active]?.verified;check.disabled=!r?.image;
 document.getElementById('tc-photo-remove').disabled=!r?.image;
}
function decorate(){
 document.querySelectorAll('#inventory-body tr').forEach(tr=>{
  const sku=normalize(tr.querySelector('.sku')?.textContent);if(!sku)return;
  const td=tr.querySelector('td');let b=td.querySelector('.tc-photo-btn');
  if(!b){
   b=document.createElement('button');b.type='button';b.className='tc-photo-btn';
   b.textContent='Foto';b.title='Abrir catálogo visual';
   b.addEventListener('click',()=>{active=sku;show();dlg.showModal()});td.append(b)
  }
  const old=td.querySelector('.tc-photo'),r=records[sku],url=imageFor(sku),demo=!r?.image&&demoManifest[sku]?.sample===true;
  if(url){
   let img=old;if(!img){img=document.createElement('img');img.className='tc-photo';td.prepend(img)}
   if(img.getAttribute('src')!==url)img.src=url;
   img.alt=(demo?'Imagen ilustrativa de ':'Fotografía de ')+sku;
   img.title=demo?'Imagen generada para DEMO; no verificada':'Imagen del catálogo visual';
   b.textContent=r?.verified?'Foto ✓':demo?'Foto DEMO':'Foto';
  }else{old?.remove();b.textContent='＋ Foto'}
 })
}
function decorateMap(){
 const cards=document.querySelectorAll('#view-locations .storage-sku-card');
 cards.forEach(card=>{
  const sku=normalize(card.querySelector('strong')?.textContent),url=imageFor(sku),demo=demoManifest[sku]?.sample===true&&!records[sku]?.image;
  let wrap=card.querySelector('.tc-map-material-photo');
  if(!url){wrap?.remove();return}
  if(!wrap){
   wrap=document.createElement('figure');wrap.className='tc-map-material-photo';
   wrap.tabIndex=0;wrap.setAttribute('role','button');wrap.setAttribute('aria-label','Ampliar fotografía del material');
   const openPreview=()=>{active=normalize(card.querySelector('strong')?.textContent);show();dlg.showModal()};
   wrap.addEventListener('click',openPreview);
   wrap.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPreview()}});
   const img=document.createElement('img');img.loading='lazy';
   const label=document.createElement('small');wrap.append(img,label);card.prepend(wrap);
  }
  const img=wrap.querySelector('img');
  if(img.getAttribute('src')!==url)img.src=url;
  img.alt=(demo?'Ilustración de ':'Fotografía de ')+sku;
  img.title=demo?'Imagen ilustrativa, no verificada con pieza física':'Foto del material';
  // Critical: only update DOM text when it really changes. Unconditional
  // textContent triggered its own MutationObserver indefinitely on the map.
  const label=wrap.querySelector('small');
  const caption=demo?'Imagen ilustrativa':'Foto del material';
  if(label&&label.textContent!==caption)label.textContent=caption;
 });
 document.querySelectorAll('#view-locations .tc-selected-overview').forEach(overview=>{
  const target=overview.querySelector('.tc-selected-photo');if(!target||target.querySelector('img'))return;
  const container=overview.closest('.storage-information');
  const cards=container?.querySelectorAll('.storage-sku-card')||[];
  if(cards.length!==1)return;
  const sku=normalize(cards[0].querySelector('strong')?.textContent),url=imageFor(sku);
  if(!url)return;
  const img=document.createElement('img');img.src=url;img.alt='Material '+sku;target.replaceChildren(img);
 });
}
const target=document.getElementById('inventory-body');
if(target){new MutationObserver(decorate).observe(target,{childList:true});decorate()}
['storage-slot-detail','storage-rack-detail'].forEach(id=>{
 const root=document.getElementById(id);
 // renderStorageMap replaces these panel contents directly. Observing only
 // direct children avoids reacting to thumbnails and labels we insert ourselves.
 if(root)new MutationObserver(decorateMap).observe(root,{childList:true});
});
document.getElementById('tc-photo-close').onclick=()=>dlg.close();
document.getElementById('tc-photo-upload').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>3*1024*1024){alert('Usa JPG, PNG o WebP de máximo 3 MB.');return}const sku=active;const reader=new FileReader();reader.onload=async()=>{records[sku]={sku,image:reader.result,verified:false};await put(records[sku]);show();decorate();decorateMap()};reader.readAsDataURL(f);e.target.value=''};
document.getElementById('tc-photo-verified').onchange=async e=>{if(!records[active]?.image){e.target.checked=false;return}records[active].verified=e.target.checked;await put(records[active]);decorate();decorateMap()};
document.getElementById('tc-photo-remove').onclick=async()=>{
 if(!records[active]?.image)return;
 if(!confirm('¿Eliminar fotografía local de '+active+'?'))return;
 delete records[active];await remove(active);show();decorate();decorateMap()
};
document.getElementById('tc-photo-export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'ToolCribVisualCatalog',version:1,photos:Object.values(records)},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ToolCrib_Catalogo_Visual.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.getElementById('tc-photo-import').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.format!=='ToolCribVisualCatalog'||!Array.isArray(data.photos))throw Error('Formato no válido');for(const x of data.photos){if(!x||!x.sku||!/^data:image\/(jpeg|png|webp);base64,/.test(x.image||''))continue;const r={sku:normalize(x.sku),image:x.image,verified:x.verified===true};records[r.sku]=r;await put(r)}show();decorate();decorateMap();alert('Catálogo visual importado')}catch(err){alert('No se pudo importar: '+err.message)}e.target.value=''};
getAll().then(rows=>{records=Object.fromEntries(rows.map(x=>[x.sku,x]));decorate();decorateMap()}).catch(err=>console.warn('Catálogo visual no disponible:',err));
fetch('data/materials-images.json',{cache:'no-cache'}).then(response=>{
 if(!response.ok)throw Error('No se encontró el catálogo de imágenes públicas');
 return response.json();
}).then(manifest=>{
 // Only automatically display material illustrations explicitly marked as demo.
 demoManifest=Object.fromEntries(Object.entries(manifest).filter(([sku,data])=>
   data?.sample!==true && /^assets\/materials\/[~a-zA-Z0-9_-][a-zA-Z0-9._-]*\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/i.test(data?.main) || sku.startsWith('DEMO-')&&data?.sample===true&&typeof data.main==='string'&&/^assets\/materials\/demo\/[a-zA-Z0-9._-]+\.webp$/.test(data.main)
 ));
 decorate();decorateMap();
}).catch(err=>console.info('Sin fotografías ilustrativas del repositorio:',err.message));
})();

