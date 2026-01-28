# InsanusNotes Examples

This directory contains example files demonstrating the key features of InsanusNotes.

## Directory Structure

```
examples/
├── interfaces/     # Interface definitions (schemas)
├── notes/          # Example notes
└── data/           # CSV data files
```

## Interfaces

Interfaces define schemas for notes with support for inheritance:

- **entity.md**: Base interface for all entities
- **character.md**: Character schema (extends Entity)
- **location.md**: Location schema (extends Entity)

## Notes

Example notes demonstrating various features:

- **aria-shadowblade.md**: A character note using the Character interface
- **silverwood-forest.md**: A location note using the Location interface

Both notes demonstrate:
- YAML frontmatter for structured metadata
- Interface validation
- Dynamic references using `[[Note.id.property]]` syntax
- Cross-referencing between notes
- References to CSV data using `[[Data.source.row.column]]`

## Data

CSV files that can be queried from notes:

- **equipment.csv**: Game equipment data
- **spells.csv**: Magic spell data

## Using These Examples

1. Copy the examples directory to your notes folder
2. Open InsanusNotes
3. The files will be automatically indexed
4. Try editing notes and see the references resolve in real-time

## Reference Syntax

### Note References
```
[[Note.aria-shadowblade.name]]        → "Aria Shadowblade"
[[Note.silverwood-forest.population]] → 500
```

### Data References
```
[[Data.equipment.0.name]]    → "Elven Longbow" (first row, name column)
[[Data.spells.2.damage]]     → 0 (third row, damage column)
```

## Interface Validation

Notes are validated against their interface. For example, the `aria-shadowblade` note:
- Must have a `name` (required by Character interface)
- Must have `id` and `createdAt` (required by Entity, which Character extends)
- Can have optional fields like `age`, `race`, `class`, etc.

If a required field is missing, a warning will be logged.
