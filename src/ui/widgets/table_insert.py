"""Widget selector de tablas estilo Microsoft Word"""

from PyQt6.QtWidgets import QWidget, QGridLayout, QLabel, QVBoxLayout, QFrame
from PyQt6.QtCore import Qt, pyqtSignal


class TableCell(QFrame):
    """Celda individual del selector de tabla"""
    hovered = pyqtSignal(int, int)  # row, col
    clicked = pyqtSignal(int, int)
    
    def __init__(self, row, col):
        super().__init__()
        self.row = row
        self.col = col
        self.is_highlighted = False
        self.setFixedSize(20, 20)
        self.setFrameShape(QFrame.Shape.Box)
        self.setStyleSheet("border: 1px solid #444; background: #1a1a1a;")
    
    def enterEvent(self, event):
        self.hovered.emit(self.row, self.col)
        super().enterEvent(event)
    
    def mousePressEvent(self, event):
        self.clicked.emit(self.row, self.col)
        super().mousePressEvent(event)
    
    def set_highlight(self, highlighted: bool):
        self.is_highlighted = highlighted
        if highlighted:
            self.setStyleSheet("border: 1px solid #8a2be2; background: #8a2be233;")
        else:
            self.setStyleSheet("border: 1px solid #444; background: #1a1a1a;")


class TableInsertWidget(QWidget):
    """Selector de tamaño de tabla estilo Microsoft Word"""
    table_selected = pyqtSignal(int, int)  # rows, cols
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("TableInsertWidget")
        self.setWindowFlags(Qt.WindowType.Popup | Qt.WindowType.FramelessWindowHint)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(5)
        
        # Grid de celdas
        self.grid = QGridLayout()
        self.grid.setSpacing(2)
        self.cells = []
        
        self.max_rows = 8
        self.max_cols = 10
        
        for r in range(self.max_rows):
            row_cells = []
            for c in range(self.max_cols):
                cell = TableCell(r, c)
                cell.hovered.connect(self.on_cell_hover)
                cell.clicked.connect(self.on_cell_click)
                self.grid.addWidget(cell, r, c)
                row_cells.append(cell)
            self.cells.append(row_cells)
        
        layout.addLayout(self.grid)
        
        # Label de tamaño
        self.size_label = QLabel("0 × 0 tabla")
        self.size_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.size_label.setStyleSheet("color: #888; font-size: 11px; padding: 5px;")
        layout.addWidget(self.size_label)
        
        self.current_rows = 0
        self.current_cols = 0
        
        # Estilo del widget completo
        self.setStyleSheet("""
            QWidget#TableInsertWidget {
                background-color: #1e1e1e;
                border: 1px solid #444;
                border-radius: 8px;
            }
        """)
    
    def on_cell_hover(self, row, col):
        self.current_rows = row + 1
        self.current_cols = col + 1
        
        # Actualizar highlights
        for r in range(self.max_rows):
            for c in range(self.max_cols):
                self.cells[r][c].set_highlight(r <= row and c <= col)
        
        self.size_label.setText(f"{self.current_rows} × {self.current_cols} tabla")
    
    def on_cell_click(self, row, col):
        self.table_selected.emit(row + 1, col + 1)
        self.hide()
    
    def show_at_cursor(self, pos):
        self.move(pos)
        self.show()
        self.raise_()
