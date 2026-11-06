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

## Comensales privados (solo dev)

Disponible en `#comensales`, desde el menú y Planes. Registra alias, edad en meses/años, diabetes u otra necesidad, alergias/exclusiones, preferencias y pauta anotada por el responsable. No vincula automáticamente fichas clínicas ni cuentas de terceros. El registro exige confirmar autorización o responsabilidad sobre los datos.

Las recetas y las comidas del plan permiten seleccionar personas y definir manualmente sus porciones. La lista de compras utiliza su suma, incluidas fracciones. La edad no se convierte automáticamente en una ración infantil. Al publicar un plan solo viajan las cantidades y la receta; perfiles y asignaciones quedan en `nutre_dev_households`, sin acceso anónimo, con RLS por propietario y control de revisión para evitar sobrescrituras desde otra ventana. La edad es la registrada, no se infiere una fecha de nacimiento; se muestra cuándo revisarla.

Diabetes: se recuerda revisar carbohidratos y pauta individual, sin inventar composición nutricional ni calcular insulina. Alimentación complementaria: recordatorios de textura/desarrollo y supervisión; no asigna recetas a menores de 6 meses y detecta miel antes de 12 meses. Las exclusiones se buscan por nombre y algunos sinónimos; no son un detector exhaustivo de alérgenos ni certifican aptitud. Una incompatibilidad detectada bloquea asignación/compras del grupo. La confirmación del usuario no convierte la receta en clínicamente validada.

Fuentes revisadas el 05-11-2026:
- https://www.who.int/publications/b/70981
- https://www.cdc.gov/diabetes/healthy-eating/diabetes-meal-planning.html
- https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html
- https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html

Migración `20261106004752_nutre_dev_households.sql` autorizada explícitamente y aplicada solo a estructuras dev. La validación de documentos de producción queda intacta. Pruebas de interfaz con perfiles ficticios exclusivamente en servidor local; no se cargaron datos de salud reales. El escaneo de despensa por foto y la importación de boletas siguen siendo propuestas pendientes.

### Importación visual (solo dev)
Despensa → Importar foto o boleta. Una imagen JPG/PNG/WebP por análisis; revisión editable obligatoria. La función verifica Aura Auth, limita 5 solicitudes/minuto por IP y dominio y usa OpenAI gpt-4.1-mini mediante Netlify AI Gateway. Se requiere AI Gateway habilitado y créditos disponibles. No almacena imágenes ni registra respuestas en logs. No certifica inventario completo: no puede contar productos ocultos. Boletas sin cantidad explícita requieren completarla. Importaciones usan UUID estables por intento y upsert para evitar duplicar un reintento; una nueva importación requiere revisar duplicados. Categoría y origen se guardan en los documentos privados existentes; no requiere migración. PDF pendiente: usar foto o captura de la boleta.

### Comensales y preparación de varios días (dev)
Mis comensales permite buscar perfiles mediante `core.buscar_perfiles`, respetando permisos del servidor, y vincular su UUID/alias a un registro privado de Nutre. No importa información clínica ni altera el perfil Core. En una receta, «Elegir personas y días» admite cantidad de personas o perfiles seleccionados, porciones manuales y 1–7 días consecutivos desde hoy. Calcula ingredientes totales y guarda un plan privado con fechas y porciones diarias. Los días planificados no constituyen un plazo de conservación. Sin migración nueva. La búsqueda real requiere sesión iniciada; cálculo y guardado local comprobados con 3 personas durante 3 días.
