"""Compatibilidad: re-exporta los bloques desde src/ui/blocks."""

from .blocks import (
    BaseBlock,
    ClickablePreview,
    EmbeddedTableHighlighter,
    HeaderBlock,
    PropertiesBlock,
    TableBlock,
    TextBlock,
)

__all__ = [
    "BaseBlock",
    "ClickablePreview",
    "EmbeddedTableHighlighter",
    "HeaderBlock",
    "PropertiesBlock",
    "TableBlock",
    "TextBlock",
]

