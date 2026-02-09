jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("supabase client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates a client when env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    await jest.isolateModulesAsync(async () => {
      const { createClient } = await import("@supabase/supabase-js");
      (createClient as jest.Mock).mockReturnValue({ mocked: true });
      const { supabase } = await import("@/lib/supabase");
      expect(supabase).toEqual({ mocked: true });
    });
  });

  it("throws when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await jest.isolateModulesAsync(async () => {
      const { createClient } = await import("@supabase/supabase-js");
      (createClient as jest.Mock).mockReturnValue({ mocked: true });
      await expect(import("@/lib/supabase")).rejects.toThrow(
        /Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/i,
      );
    });
  });
});
