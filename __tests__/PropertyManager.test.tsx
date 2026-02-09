import { fireEvent, render, screen } from "@testing-library/react";
import PropertyManager from "@/components/PropertyManager";
import type { Property } from "@/types";

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

  it("fires handlers for creating and updating properties", () => {
    const onNewPropertyLabelChange = jest.fn();
    const onNewPropertyTypeChange = jest.fn();
    const onCreateProperty = jest.fn();
    const onPropertyValueChange = jest.fn();

    render(
      <PropertyManager
        properties={properties}
        newPropertyLabel=""
        newPropertyType="text"
        onNewPropertyLabelChange={onNewPropertyLabelChange}
        onNewPropertyTypeChange={onNewPropertyTypeChange}
        onCreateProperty={onCreateProperty}
        onPropertyValueChange={onPropertyValueChange}
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
});
