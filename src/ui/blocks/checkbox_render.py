from __future__ import annotations

import re
from typing import List, Tuple


CheckboxPosition = Tuple[int, int, bool]


def get_checkbox_positions(text: str) -> List[CheckboxPosition]:
    positions: List[CheckboxPosition] = []
    for m in re.finditer(r"\[( |x|X)\]", text):
        checked = m.group(1).lower() == "x"
        positions.append((m.start(), m.end(), checked))
    return positions


def render_checkboxes(html: str) -> str:
    counter = 0

    def replace_task(match):
        nonlocal counter
        state = match.group(1).lower()
        idx = counter
        counter += 1
        if state == "x":
            icon = '<a href="task:%d" class="task-link checked">☑</a>' % idx
        else:
            icon = '<a href="task:%d" class="task-link unchecked">☐</a>' % idx
        return f'<li class="task-item">{icon} '

    html = re.sub(r"<li>\s*\[([xX ])\]\s*", replace_task, html)

    def replace_inline(match):
        nonlocal counter
        state = match.group(1).lower()
        idx = counter
        counter += 1
        if state == "x":
            return '<a href="task:%d" class="task-link checked">☑</a>' % idx
        return '<a href="task:%d" class="task-link unchecked">☐</a>' % idx

    return re.sub(r"\[([xX ])\]", replace_inline, html)
