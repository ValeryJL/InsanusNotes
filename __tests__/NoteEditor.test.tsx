import { act, fireEvent, render, screen } from "@testing-library/react";
import NoteEditor from "@/components/NoteEditor";
import type { Collection, Note } from "@/types/database";
import type { Property } from "@/types";

jest.mock("@/components/TableView", () => () => <div>TableView</div>);

describe("NoteEditor", () => {
  const note: Note = {
    id: "note-1",
    title: "Nota",
    collection_id: null,
    content_jsonb: { text: "Contenido" },
    properties_jsonb: [],
  };

  const properties: Property[] = [];
  const collections: Collection[] = [
    { id: "collection-1", name: "Tareas", schema_json: [] },
  ];

  it("renders note content and fires change handlers", () => {
    const onTitleChange = jest.fn();
    const onContentChange = jest.fn();

    render(
      <NoteEditor
        note={note}
        schema={null}
        schemaValues={{}}
        blocks={[]}
        collections={collections}
        title="Nota"
        contentText="Contenido"
        isSaving={false}
        properties={properties}
        newPropertyLabel=""
        newPropertyType="text"
        statusMessage=""
        onBlocksChange={jest.fn()}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onSchemaValueChange={jest.fn()}
        onCreateNote={jest.fn()}
        onDeleteNote={jest.fn()}
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
        schema={null}
        schemaValues={{}}
        blocks={[]}
        collections={collections}
        title=""
        contentText=""
        isSaving={false}
        properties={[]}
        newPropertyLabel=""
        newPropertyType="text"
        statusMessage=""
        onBlocksChange={jest.fn()}
        onTitleChange={jest.fn()}
        onContentChange={jest.fn()}
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onSchemaValueChange={jest.fn()}
        onCreateNote={onCreateNote}
        onDeleteNote={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /crear nota/i }));
    expect(onCreateNote).toHaveBeenCalled();
  });

  it("opens command menu when typing slash", async () => {
    render(
      <NoteEditor
        note={note}
        schema={null}
        schemaValues={{}}
        blocks={[]}
        collections={collections}
        title="Nota"
        contentText=""
        isSaving={false}
        properties={properties}
        newPropertyLabel=""
        newPropertyType="text"
        statusMessage=""
        onBlocksChange={jest.fn()}
        onTitleChange={jest.fn()}
        onContentChange={jest.fn()}
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onSchemaValueChange={jest.fn()}
        onCreateNote={jest.fn()}
        onDeleteNote={jest.fn()}
      />,
    );

    const contentInput = screen.getByPlaceholderText(
      "Escribe tu contenido aqui...",
    );
    await act(async () => {
      fireEvent.change(contentInput, { target: { value: "/" } });
    });

    expect(await screen.findByText("/tabla")).toBeInTheDocument();
  });
});
