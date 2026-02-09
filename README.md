# Insanus Notes MVP

Minimal Notion-style MVP built with Next.js and Supabase.

## Architecture

- **Next.js App Router** for the UI and client components.
- **Supabase** for Postgres storage and JSONB content.
- **Tailwind CSS** for the minimal interface styling.

Key folders:

- `src/app` - routes and state orchestration.
- `src/components` - `Sidebar`, `NoteEditor`, `PropertyManager`.
- `src/lib` - Supabase client.
- `src/types` - shared TypeScript types.

## Data Schema

The app expects the following tables in Supabase:

### `pages`

- `id` (uuid, primary key)
- `title` (text)
- `content` (jsonb)

### `custom_attributes` (properties)

- `id` (uuid, primary key)
- `page_id` (uuid, foreign key to `pages.id`)
- `label` (text)
- `value_type` (text, enum: `text`, `number`, `date`, `status`)
- `value` (text)

Relationship: `pages` has many `custom_attributes`.

## Installation

```bash
git clone https://github.com/ValeryJL/InsanusNotes.git
cd InsanusNotes
npm install
```

Create a `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the app:

```bash
npm run dev
```

## Testing

Run the unit tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Contributing

- Use TypeScript strictly and keep components typed.
- Prefer small, focused components in `src/components`.
- Mock Supabase in tests to avoid network calls.
- Run `npm test` and `npm run lint` before opening a PR.
