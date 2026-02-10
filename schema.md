Documentación de Arquitectura de Datos: Insanus Notes

Este documento define la estructura actual de la base de datos en Supabase (PostgreSQL) y las proyecciones futuras de seguridad.

Estado Actual (MVP - Sprint 1)

El sistema se basa en un modelo relacional con soporte extensivo de JSONB para flexibilidad de esquema.

1. Tabla: collections (Bases de Datos / Clases)

Define los "moldes" o tipos de documentos.

id (UUID, PK): Identificador único.

user_id (UUID): Propietario (temporalmente mockeado o abierto hasta implementar Auth).

name (TEXT): Nombre de la colección (ej. "Tareas", "Proyectos").

icon (TEXT): Emoji o URL de icono.

description (TEXT): Descripción opcional.

schema_json (JSONB): CRÍTICO. Define la estructura de las propiedades obligatorias para las notas de esta colección.

Estructura esperada: [{ "id": "uuid", "name": "Estado", "type": "select", "options": [...] }, ...]

created_at (TIMESTAMPTZ).

2. Tabla: notes (Instancias / Páginas)

La entidad central. Puede actuar como nota libre o como instancia de una colección.

id (UUID, PK): Identificador único.

user_id (UUID): Propietario.

collection_id (UUID, FK -> collections.id):

Si es NULL: Es una "Nota Libre" (estructura flexible).

Si tiene UUID: Pertenece a una colección y debe respetar el schema_json.

Comportamiento: ON DELETE CASCADE.

parent_id (UUID, FK -> notes.id): Para anidamiento jerárquico de páginas. ON DELETE CASCADE.

title (TEXT): Título de la nota.

content_jsonb (JSONB): Cuerpo del documento (formato TipTap/ProseMirror).

properties_jsonb (JSONB): Valores de las propiedades.

Estructura: { "uuid_propiedad_del_schema": "valor_real" }.

is_archived (BOOLEAN): Soft delete.

Futuras Implementaciones (Roadmap de Seguridad)

NOTA PARA EL DESARROLLADOR: NO implementar esto en el Sprint 1, pero diseñar el código teniendo en cuenta que esto existirá.

Tabla users:

Se implementará un sistema de autenticación propio o híbrido.

Campos previstos: email (Unique), password_hash (Argon2/Bcrypt), created_at.

Seguridad (Auth):

Implementación de JWT (JSON Web Tokens) para sesiones stateless.

Hashing de contraseñas estricto en el backend (Edge Functions o API Routes).

RLS (Row Level Security) en Supabase habilitado y filtrando por auth.uid().

Restricción Técnica Actual:
Para el Sprint 1, asuma que user_id es un UUID fijo de prueba o use el usuario anónimo de Supabase, pero mantenga la columna en las tablas para facilitar la migración futura.