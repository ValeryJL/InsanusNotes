Product Backlog: Insanus Notes (MVP)

Autor: Valeria Jauregui Lorda

Versión: 1.0.0

Stack: Next.js + Supabase + TypeScript

ÉPICA 1: Motor de Datos y Esquemas (Backend Core)

Descripción: Implementación de la arquitectura de "Colecciones" vs "Notas Libres" y la migración de la base de datos para soportar integridad referencial estricta.

US-1.1: Migración de Esquema de Base de Datos

Como Arquitecto de Backend,

Quiero estructurar las tablas collections, notes y properties en Supabase,

Para soportar la lógica de herencia de propiedades y notas libres.

Criterios de Aceptación (AC):

[ ] Tabla collections creada con id, user_id, name, schema_json.

[ ] Tabla notes actualizada con collection_id (nullable). Si es NULL, es "Nota Libre" (Default).

[ ] Constraint: Una nota no puede tener propiedades en property_values que no estén definidas en su collection_id (si no es NULL).

[ ] Configurar ON DELETE CASCADE: Si borro una colección, se borran sus notas.

US-1.2: API de Gestión de Colecciones (CRUD)

Como Desarrollador Frontend,

Quiero endpoints o funciones RPC en Supabase,

Para crear y configurar nuevas "Bases de Datos" (Colecciones).

AC:

[ ] Función para crear una colección nueva con un nombre e icono.

[ ] Función para editar el schema_json de una colección (agregar/quitar definiciones de propiedades).

[ ] Al eliminar una propiedad del esquema, se deben limpiar los valores correspondientes en todas las notas hijas.

ÉPICA 2: Sistema de Propiedades Estrictas

Descripción: Lógica de negocio para manejar tipos de datos y validación.

US-2.1: Definición de Propiedades en Colección

Como Usuario,

Quiero agregar una propiedad (columna) a una Colección (ej. "Fecha Límite"),

Para que todas las notas dentro de esa colección tengan ese campo disponible.

AC:

[ ] UI para agregar propiedad seleccionando tipo: Texto, Número, Fecha, Bool, Select.

[ ] El sistema guarda la definición en el schema_json de la colección.

[ ] Todas las notas existentes en esa colección muestran inmediatamente el nuevo campo vacío.

US-2.2: Edición de Valores (Inline Property Editor)

Como Usuario,

Quiero editar los valores de las propiedades directamente desde la vista de la nota,

Para clasificar mi información rápidamente.

AC:

[ ] Componente PropertyGrid renderizado debajo del título.

[ ] Si la nota es Libre (Default), permite agregar propiedades ad-hoc.

[ ] Si la nota es de Colección, SOLO muestra las propiedades definidas por la colección (no permite agregar nuevas locales).

[ ] Input específico por tipo de dato (DatePicker para fechas, Checkbox para bool).

ÉPICA 3: Experiencia de Usuario y Vistas (Frontend)

Descripción: Interfaz visual para la navegación y manipulación de notas.

US-3.1: Sidebar Organizada por Contexto

Como Usuario,

Quiero ver mis "Notas Libres" separadas de mis "Bases de Datos",

Para navegar eficientemente entre contextos.

AC:

[ ] Sección "Mis Notas" (Query: collection_id IS NULL).

[ ] Sección "Colecciones" (Lista de bases de datos creadas).

[ ] Al hacer clic en una Colección, se abre una vista de tabla con todas sus notas.

US-3.2: Vista de Tabla (Database View)

Como Usuario,

Quiero visualizar una colección como una tabla,

Para ver múltiples notas y sus propiedades al mismo tiempo.

AC:

[ ] Renderizar una grilla donde cada fila es una nota y cada columna una propiedad.

[ ] Celdas editables (doble clic para editar valor).

[ ] Botón "Nueva" dentro de la tabla crea una nota vinculada automáticamente a esa colección.

ÉPICA 4: Comandos y Bloques Avanzados

Descripción: Funcionalidades de inserción dinámica.

US-4.1: Menú de Comandos (/Slash)

Como Usuario,

Quiero escribir / en el editor,

Para insertar bloques especiales o vistas.

AC:

[ ] Menú flotante al detectar /.

[ ] Opción "Insertar Vista de Colección".

[ ] Opción "Texto", "H1", "H2", "Lista".

US-4.2: Bloque de Vista Incrustada

Como Usuario,

Quiero insertar una tabla de una colección dentro de una nota libre,

Para tener un dashboard con información de varios proyectos.

AC:

[ ] El bloque recibe un collection_id como prop.

[ ] Renderiza el componente de Tabla (US-3.2) dentro del flujo del documento.

[ ] Los cambios hechos en esta vista incrustada persisten en la base de datos real.