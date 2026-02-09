import { fireEvent, render, screen } from "@testing-library/react";
import NoteEditor from "@/components/NoteEditor";
import type { Note, Property } from "@/types";

describe("NoteEditor", () => {
  const note: Note = {
    id: "note-1",
    title: "Nota",
    content: { text: "Contenido" },
  };

  const properties: Property[] = [];

  it("renders note content and fires change handlers", () => {
    const onTitleChange = jest.fn();
    const onContentChange = jest.fn();

    render(
      <NoteEditor
        note={note}
        title="Nota"
        contentText="Contenido"
        isSaving={false}
        properties={properties}
        newPropertyLabel=""
        newPropertyType="text"
        statusMessage=""
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onCreateNote={jest.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText("Titulo de la nota");
    fireEvent.change(titleInput, { target: { value: "Nueva" } });
    expect(onTitleChange).toHaveBeenCalledWith("Nueva");

    const contentInput = screen.getByPlaceholderText(
      "Escribe tu contenido aqui...",
    );
    fireEvent.change(contentInput, { target: { value: "Texto" } });
    expect(onContentChange).toHaveBeenCalledWith("Texto");
  });

  it("renders empty state and triggers create action", () => {
    const onCreateNote = jest.fn();

    render(
      <NoteEditor
        note={null}
        title=""
        contentText=""
        isSaving={false}
        properties={[]}
        newPropertyLabel=""
        newPropertyType="text"
        statusMessage=""
        onTitleChange={jest.fn()}
        onContentChange={jest.fn()}
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onCreateNote={onCreateNote}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /crear nota/i }));
    expect(onCreateNote).toHaveBeenCalled();
  });
});
