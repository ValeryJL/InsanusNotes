import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";

const mockNotes = [
  {
    id: "note-1",
    title: "Nota 1",
    content: { text: "Hola" },
  },
];

const pagesSelect = jest.fn(() => ({
  order: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
}));

const pagesUpdate = jest.fn(() => ({
  eq: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: { id: "note-1", title: "Actualizada", content: { text: "Hola" } },
        error: null,
      }),
    })),
  })),
}));

const customAttributesSelect = jest.fn(() => ({
  eq: jest.fn(() => ({
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
}));

const mockFrom = jest.fn((table: string) => {
  if (table === "pages") {
    return {
      select: pagesSelect,
      update: pagesUpdate,
      insert: jest.fn(),
    };
  }

  if (table === "custom_attributes") {
    return {
      select: customAttributesSelect,
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };
  }

  return {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
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

    expect(pagesUpdate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(pagesUpdate).toHaveBeenCalled();
    });

    type UpdatePayload = { title: string; content: { text: string } };
    const calls = (pagesUpdate as jest.Mock).mock.calls as UpdatePayload[][];
    const payload = calls[0]?.[0];
    if (!payload) {
      throw new Error("pagesUpdate was not called");
    }
    expect(payload).toEqual({
      title: "Nueva nota",
      content: { text: "Hola" },
    });
  });
});
