import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CollectionPage from "@/app/collection/[id]/page";

const updateSchemaMock = jest.fn();
const createNoteMock = jest.fn();
const getCollectionMock = jest.fn();
const getNotesMock = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "collection-1" }),
}));

jest.mock("@/lib/api", () => ({
  getCollectionById: (...args: unknown[]) => getCollectionMock(...args),
  getNotes: (...args: unknown[]) => getNotesMock(...args),
  createNote: (...args: unknown[]) => createNoteMock(...args),
  updateCollectionSchema: (...args: unknown[]) => updateSchemaMock(...args),
}));

const notesUpdate = jest.fn(() => ({
  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      update: notesUpdate,
    }),
  },
}));

describe("Collection page", () => {
  beforeEach(() => {
    getCollectionMock.mockResolvedValue({
      id: "collection-1",
      name: "Tareas",
      schema_json: [
        { id: "status", name: "Estado", type: "select", options: ["Abierto"] },
      ],
    });
    getNotesMock.mockResolvedValue([
      {
        id: "note-1",
        title: "Nota 1",
        collection_id: "collection-1",
        content_jsonb: { text: "" },
        properties_jsonb: { status: "Abierto" },
      },
    ]);
    createNoteMock.mockResolvedValue({
      id: "note-2",
      title: "Nueva",
      collection_id: "collection-1",
      content_jsonb: { text: "" },
      properties_jsonb: {},
    });
    updateSchemaMock.mockResolvedValue({
      id: "collection-1",
      name: "Tareas",
      schema_json: [
        { id: "status", name: "Estado", type: "select", options: ["Abierto"] },
        { id: "priority", name: "Prioridad", type: "text" },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders collection schema in the table", async () => {
    await act(async () => {
      render(<CollectionPage />);
    });

    expect(await screen.findByText("Estado")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Nota 1")).toBeInTheDocument();
  });

  it("creates a new row when clicking Nueva fila", async () => {
    await act(async () => {
      render(<CollectionPage />);
    });

    fireEvent.click(screen.getByRole("button", { name: /nueva fila/i }));

    await waitFor(() => {
      expect(createNoteMock).toHaveBeenCalledWith("collection-1");
    });
  });

  it("updates schema when saving a new property", async () => {
    await act(async () => {
      render(<CollectionPage />);
    });

    fireEvent.click(
      screen.getByRole("button", { name: /gestionar propiedades/i }),
    );

    fireEvent.change(screen.getByPlaceholderText("Nombre"), {
      target: { value: "Prioridad" },
    });

    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(updateSchemaMock).toHaveBeenCalled();
    });
  });
});
