# Nutre · Convergencia Aura

Despensa privada, recetas propias y compartidas, guías de cocina, planes semanales y lista de compras conectada a cantidades y porciones.

- Producción (`main`): https://nutre.convergenciaaura.cl
- Desarrollo (`dev`): https://dev.nutre.convergenciaaura.cl
- Repositorio: https://github.com/amolina007/Nutre

## Desarrollo

Node 22+. `npm test` verifica cálculos de compras y compatibilidad de sesión compartida. `npm run build` genera `dist/`. Servir `public/` para pruebas locales; su configuración es de desarrollo. Netlify genera `env.js` según la rama, sin inferir el entorno desde el navegador. `.netlify/` está excluido de Git.

No hay claves secretas en el cliente. La clave publishable de Aura es pública y las restricciones reales residen en RLS. La sesión utiliza el adaptador de cookies compartidas de Convergencia y los módulos oficiales del hub y mensajería de Core.

## Datos

Migración en `supabase/migrations/`. `nutre_documents` es producción y `nutre_dev_documents` desarrollo. El tipo de registro distingue alimentos, recetas, planes, compras, favoritos y progreso. Solo el propietario puede escribir. Solo recetas/planes marcados públicos se leen sin sesión. Las tablas nacen vacías. El recetario inicial y las guías son contenido editorial de Nutre.

Los planes guardan una copia de la preparación para conservar la semana aunque una receta se retire. Al publicar un plan se informa que se comparte esa preparación. No se presentan planes comunitarios como prescripciones clínicas. Las compras comparan nombres normalizados y unidades compatibles (g/kg, ml/l); no infieren equivalencias ni sustituciones. El usuario confirma antes de añadir compras. No se descuenta despensa automáticamente.

## Publicación

Dos proyectos Netlify conectados al mismo GitHub: `nutre-convergencia-aura` sigue `main`; `nutre-dev-convergencia-aura` sigue `dev`. Los cambios posteriores se trabajan en `dev`; no se fusionan a `main` sin autorización. Desarrollo emite `noindex`.

## Recursos

La portada de ensalada es una imagen generada con ImageGen para este proyecto. Prompt: fotografía editorial de ensalada de lentejas cocidas, tomate, pepino y espinaca, sobre piedra clara, luz natural cálida y espacio libre a la izquierda. El logo de Convergencia es el recurso existente del ecosistema. Supabase JS 2.57.4 se distribuye localmente en `public/vendor`, licencia MIT.

## Verificación de la primera publicación

Migración aplicada en Aura con autorización explícita del propietario el 05-11-2026. Lectura REST anónima verificada en las dos tablas, inicialmente vacías, y políticas de propietario/publicación activas. El asesor de seguridad no señaló hallazgos de Nutre.

`npm run test:db` reproduce en Postgres local (PGlite) los controles de propietario, prevención de cambio de dueño, lectura pública, rechazo de escrituras anónimas, validación de contenido y separación dev/producción. Pruebas de interfaz con cuenta ficticia aislada: alimento, receta compartida, pasos de cocina, copia de plan y lista de compras. No se introdujeron datos de prueba en las cuentas reales.

Imágenes adicionales generadas con ImageGen: tortilla de verduras y arroz con verduras, fotografías editoriales de comida casera con luz natural, cerámica clara y lino verde. Archivos en `public/assets/`.
