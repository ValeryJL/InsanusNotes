from PyQt6.QtWidgets import QListWidget, QListWidgetItem, QFrame, QVBoxLayout, QLineEdit
from PyQt6.QtCore import Qt, pyqtSignal, QEvent

class SlashMenu(QFrame):
    """Menú flotante para comandos slash (/)"""
    
    command_selected = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.Popup | Qt.WindowType.FramelessWindowHint)
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setObjectName("SlashMenu")
        
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(5, 5, 5, 5)
        self.layout.setSpacing(3)
        
        # Campo de búsqueda
        self.search = QLineEdit()
        self.search.setPlaceholderText("Buscar comando...")
        self.search.setObjectName("SlashSearch")
        self.search.textChanged.connect(self.filter_commands)
        self.layout.addWidget(self.search)
        
        self.list = QListWidget()
        self.list.setCursor(Qt.CursorShape.PointingHandCursor)
        self.layout.addWidget(self.list)
        
        # Comandos expandidos
        self.add_command("Texto", "Párrafo de texto simple", "text")
        self.add_command("Título 1", "# Encabezado grande", "h1")
        self.add_command("Título 2", "## Encabezado mediano", "h2")
        self.add_command("Título 3", "### Encabezado pequeño", "h3")
        self.add_command("Tabla", "Inserta tabla interactiva n×m", "table")
        self.add_command("Código", "```Bloque de código```", "code")
        self.add_command("Lista", "- Item de lista", "list")
        self.add_command("Checkbox", "- [ ] Tarea pendiente", "check")
        self.add_command("Cita", "> Blockquote", "quote")
        
        self.list.itemClicked.connect(self.on_item_clicked)
        self.list.itemActivated.connect(self.on_item_clicked)
        self.installEventFilter(self)

    def add_command(self, title, desc, cmd_id):
        item = QListWidgetItem(self.list)
        item.setData(Qt.ItemDataRole.UserRole, cmd_id)
        item.setText(f"{title}\n{desc}")
        self.list.addItem(item)
    
    def filter_commands(self, text):
        """Filtra comandos por texto de búsqueda"""
        for i in range(self.list.count()):
            item = self.list.item(i)
            item.setHidden(text.lower() not in item.text().lower())

    def on_item_clicked(self, item):
        cmd_id = item.data(Qt.ItemDataRole.UserRole)
        self.command_selected.emit(cmd_id)
        self.hide()
    
    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.KeyPress:
            if event.key() == Qt.Key.Key_Escape:
                self.hide()
                return True
            elif event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
                current = self.list.currentItem()
                if current and not current.isHidden():
                    self.on_item_clicked(current)
                return True
            elif event.key() == Qt.Key.Key_Down:
                self.list.setFocus()
                return False
        return super().eventFilter(obj, event)

    def show_at_cursor(self, pos):
        self.move(pos)
        self.show()
        self.raise_()
        self.search.setFocus()
        self.search.clear()
        self.list.setCurrentRow(0)
