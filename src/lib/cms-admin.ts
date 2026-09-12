import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";

/** Insert/update/delete helpers for the CMS tables, with cache refresh. */
export function useCmsTable(table: string, queryKey: readonly unknown[]) {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey });
  }

  return {
    async save(row: Record<string, unknown> & { id?: string | null }) {
      if (!client) return false;
      const { id, ...values } = row;
      const { error } = id
        ? await client.from(table).update(values).eq("id", id)
        : await client.from(table).insert(values);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await refresh();
      toast.success("Saved.");
      return true;
    },
    async remove(id: string) {
      if (!client) return false;
      const { error } = await client.from(table).delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await refresh();
      toast.success("Deleted.");
      return true;
    },
    refresh,
  };
}

/** Save one page_sections row by (page_slug, section_key). */
export function usePageSection() {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return async function saveSection(
    pageSlug: string,
    sectionKey: string,
    content: unknown,
  ): Promise<boolean> {
    if (!client) return false;
    const { error } = await client
      .from("page_sections")
      .upsert(
        { page_slug: pageSlug, section_key: sectionKey, content, updated_at: new Date().toISOString() },
        { onConflict: "page_slug,section_key" },
      );
    if (error) {
      toast.error(error.message);
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["cms", "page_sections"] });
    toast.success("Saved.");
    return true;
  };
}

/** Turn a textarea of one-per-line values into a string array, and back. */
export const linesToArray = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const arrayToLines = (value: string[] | null | undefined) => (value ?? []).join("\n");
