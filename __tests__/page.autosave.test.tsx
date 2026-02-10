import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";

const notesUpdate = jest.fn(() => ({
  eq: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: {
          id: "note-1",
          title: "Actualizada",
          collection_id: null,
          content_jsonb: { text: "Hola" },
          properties_jsonb: [],
        },
        error: null,
      }),
    })),
  })),
}));

const mockFrom = jest.fn((table: string) => {
  if (table === "notes") {
    return {
      update: notesUpdate,
    };
  }

  return {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  };
});

jest.mock("@/lib/api", () => {
  const mockNotes = [
    {
      id: "note-1",
      title: "Nota 1",
      collection_id: null,
      content_jsonb: { text: "Hola" },
      properties_jsonb: [],
    },
  ];

  return {
    getNotes: jest.fn().mockResolvedValue(mockNotes),
    getCollections: jest.fn().mockResolvedValue([]),
    createNote: jest.fn(),
    createCollection: jest.fn(),
  };
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe("Home autosave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("debounces autosave when updating title", async () => {
    await act(async () => {
      render(<Home />);
    });

    await screen.findByDisplayValue("Nota 1");

    const titleInput = screen.getByPlaceholderText("Titulo de la nota");
    fireEvent.change(titleInput, { target: { value: "Nueva nota" } });

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(notesUpdate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(notesUpdate).toHaveBeenCalled();
    });

    type UpdatePayload = {
      title: string;
      content_jsonb: { text: string };
      properties_jsonb: unknown[];
    };
    const calls = (notesUpdate as jest.Mock).mock.calls as UpdatePayload[][];
    const payload = calls[0]?.[0];
    if (!payload) {
      throw new Error("notesUpdate was not called");
    }
    expect(payload).toEqual({
      title: "Nueva nota",
      content_jsonb: { text: "Hola" },
      properties_jsonb: [],
    });
  });
});
