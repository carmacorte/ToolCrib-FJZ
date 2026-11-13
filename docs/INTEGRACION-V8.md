# Integración con Tool Crib V8

La rama contiene el motor de imágenes y un visor de prueba independiente.
La aplicación V8 existente todavía no se ha copiado a este repositorio.

## Integración pendiente
1. Incorporar la V8 aprobada como `index.html`.
2. Cargar `js/image-resolver.js` antes del script de aplicación.
3. Tras importar Excel, llamar `ToolCribImages.loadCatalog()` y asociar con `ToolCribImages.resolve(catalog, item.sku)`.
4. Mostrar miniatura, galería y estado de fotografía verificada en Inventario, Reabastecimiento y Mapa.
5. Mantener existencias y movimientos fuera de GitHub.
6. Validar importación, restauración JSON, sorts, y operación offline.

El fetch de JSON requiere un servidor HTTP/HTTPS; al abrir `file://` algunos navegadores lo bloquean. Para offline local, empaquetar el catálogo en JS o servir la carpeta por HTTP local autorizado.
