import { fireEvent, render, screen } from "@testing-library/react";
import PropertyManager from "@/components/PropertyManager";
import type { Note } from "@/types/database";
import type { Property } from "@/types";

jest.mock("@/lib/api", () => ({
  searchNotes: jest.fn().mockResolvedValue([]),
  getNotesByIds: jest.fn().mockResolvedValue([]),
}));

describe("PropertyManager", () => {
  const properties: Property[] = [
    {
      id: "prop-1",
      page_id: "note-1",
      label: "Estado",
      value_type: "text",
      value: "Abierto",
    },
  ];

  const note: Note = {
    id: "note-1",
    title: "Nota",
    collection_id: null,
    content_jsonb: { text: "" },
    properties_jsonb: [],
  };

  const collectionNote: Note = {
    id: "note-2",
    title: "Nota coleccion",
    collection_id: "collection-1",
    content_jsonb: { text: "" },
    properties_jsonb: { "schema-1": "Abierto" },
  };

  it("fires handlers for creating and updating properties", () => {
    const onNewPropertyLabelChange = jest.fn();
    const onNewPropertyTypeChange = jest.fn();
    const onCreateProperty = jest.fn();
    const onPropertyValueChange = jest.fn();

    render(
      <PropertyManager
        note={note}
        schema={null}
        schemaValues={{}}
        properties={properties}
        newPropertyLabel=""
        newPropertyType="text"
        onNewPropertyLabelChange={onNewPropertyLabelChange}
        onNewPropertyTypeChange={onNewPropertyTypeChange}
        onCreateProperty={onCreateProperty}
        onPropertyValueChange={onPropertyValueChange}
        onSchemaValueChange={jest.fn()}
      />,
    );

    const labelInput = screen.getByPlaceholderText("Nombre de propiedad");
    fireEvent.change(labelInput, { target: { value: "Prioridad" } });
    expect(onNewPropertyLabelChange).toHaveBeenCalledWith("Prioridad");

    const typeSelect = screen.getByRole("combobox");
    fireEvent.change(typeSelect, { target: { value: "number" } });
    expect(onNewPropertyTypeChange).toHaveBeenCalledWith("number");

    fireEvent.click(screen.getByRole("button", { name: /agregar propiedad/i }));
    expect(onCreateProperty).toHaveBeenCalled();

    const valueInput = screen.getByDisplayValue("Abierto");
    fireEvent.change(valueInput, { target: { value: "Cerrado" } });
    expect(onPropertyValueChange).toHaveBeenCalledWith("prop-1", "Cerrado");
  });

  it("renders schema-driven properties for collection notes", () => {
    const onSchemaValueChange = jest.fn();

    render(
      <PropertyManager
        note={collectionNote}
        schema={[
          { id: "schema-1", name: "Estado", type: "select", options: ["Abierto"] },
        ]}
        schemaValues={{ "schema-1": "Abierto" }}
        properties={[]}
        newPropertyLabel=""
        newPropertyType="text"
        onNewPropertyLabelChange={jest.fn()}
        onNewPropertyTypeChange={jest.fn()}
        onCreateProperty={jest.fn()}
        onPropertyValueChange={jest.fn()}
        onSchemaValueChange={onSchemaValueChange}
      />,
    );

    expect(screen.queryByRole("button", { name: /agregar propiedad/i })).toBeNull();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Abierto" } });
    expect(onSchemaValueChange).toHaveBeenCalledWith("schema-1", "Abierto");
  });
});
