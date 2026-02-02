from __future__ import annotations

import html
import re
from typing import Optional

import markdown

try:
    from markdown_it import MarkdownIt
    from mdit_py_plugins.footnote import footnote_plugin
    _MARKDOWN_IT_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    _MARKDOWN_IT_AVAILABLE = False

_md_renderer: Optional[MarkdownIt] = None


def get_markdown_renderer() -> Optional[MarkdownIt]:
    """Obtiene instancia global del renderer markdown-it-py."""
    global _md_renderer
    if _md_renderer is None and _MARKDOWN_IT_AVAILABLE:
        _md_renderer = MarkdownIt(
            "commonmark",
            {
                "breaks": True,
                "html": True,
                "linkify": True,
                "typographer": True,
            },
        ).use(footnote_plugin)
    return _md_renderer


def render_markdown(text: str) -> str:
    if not text:
        return ""
    try:
        md = get_markdown_renderer()
        if md:
            return md.render(text)
        return markdown.markdown(text, extensions=["fenced_code", "tables"])
    except Exception:
        return render_inline_markup(text)


def render_inline_markup(text: str) -> str:
    """Renderer simple con elementos básicos e inline."""
    if not text:
        return ""

    lines = text.splitlines()
    html_blocks = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue

        m = re.match(r"^\s*(#{1,6})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            content = html.escape(m.group(2))
            content = _inline_replace(content)
            html_blocks.append(f"<h{level}>{content}</h{level}>")
            i += 1
            continue

        if re.match(r"^\s*[-*]\s+", line):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i]):
                item = re.sub(r"^\s*[-*]\s+", "", lines[i]).strip()
                item = _inline_replace(html.escape(item))
                items.append(f"<li>{item}</li>")
                i += 1
            html_blocks.append("<ul style=\"margin:0 0 0 6px;padding-left:18px;\">" + "".join(items) + "</ul>")
            continue

        if re.match(r"^\s*\d+\.\s+", line):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i]):
                item = re.sub(r"^\s*\d+\.\s+", "", lines[i]).strip()
                item = _inline_replace(html.escape(item))
                items.append(f"<li>{item}</li>")
                i += 1
            html_blocks.append("<ol style=\"margin:0 0 0 6px;padding-left:18px;\">" + "".join(items) + "</ol>")
            continue

        if "|" in line:
            if i + 1 < len(lines) and re.match(r"^\s*\|?\s*[:\-]+\s*(\|\s*[:\-]+\s*)+\|?\s*$", lines[i + 1]):
                header_cells = [c.strip() for c in re.split(r"\|", line) if c.strip() != ""]
                i += 2
                rows = []
                while i < len(lines) and "|" in lines[i]:
                    cells = [html.escape(c.strip()) for c in re.split(r"\|", lines[i])]
                    rows.append(cells)
                    i += 1
                thead = "".join(f"<th>{_inline_replace(html.escape(h))}</th>" for h in header_cells)
                tbody = "".join(
                    "<tr>" + "".join(f"<td>{_inline_replace(c)}</td>" for c in row if c is not None) + "</tr>"
                    for row in rows
                )
                html_blocks.append(
                    f"<table class=\"md-table\"><thead><tr>{thead}</tr></thead><tbody>{tbody}</tbody></table>"
                )
                continue

        para_lines = [line]
        i += 1
        while i < len(lines) and lines[i].strip():
            para_lines.append(lines[i])
            i += 1
        para = "\n".join(para_lines)
        para = html.escape(para)
        para = para.replace("\n", "<br/>")
        para = _inline_replace(para)
        html_blocks.append(f"<p>{para}</p>")

    return "".join(html_blocks)


def _inline_replace(text: str) -> str:
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    out = re.sub(r"\*(.+?)\*", r"<em>\1</em>", out)
    out = re.sub(r"`(.+?)`", r"<code>\1</code>", out)
    out = re.sub(r"\[\[(.+?)\]\]", lambda m: f'<a href="ref:{m.group(1)}" class="ref">{m.group(1)}</a>', out)
    return out
