/* Tool Crib: catálogo visual por SKU. No modifica inventario ni movimientos. */
(function(global){
  const normalizeSku = value => String(value || '').trim().toUpperCase();
  const safePath = path => {
    if(typeof path !== 'string') return null;
    const p=path.trim();
    if(!/^assets\/materials\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(webp|png|jpe?g)$/i.test(p) || p.includes('..')) return null;
    return p;
  };
  async function loadCatalog(url='data/materials-images.json'){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok) throw new Error('No se pudo cargar catálogo de imágenes: HTTP '+response.status);
    const data=await response.json();
    const catalog={};
    for(const [sku,entry] of Object.entries(data)){
      if(!entry || typeof entry!=='object') continue;
      catalog[normalizeSku(sku)]={
        main:safePath(entry.main),
        gallery:Array.isArray(entry.gallery)?entry.gallery.map(safePath).filter(Boolean):[],
        verified:entry.verified===true,
        description:String(entry.description||'')
      };
    }
    return catalog;
  }
  function resolve(catalog,sku){return catalog[normalizeSku(sku)]||null;}
  global.ToolCribImages={normalizeSku,loadCatalog,resolve};
})(window);
