/** Hooks para gerar resumos automáticos. */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface SummaryResponse {
  summary: string;
  sources?: Array<{
    note_id: string;
    excerpt: string;
  }>;
}

/** Gera resumo de caixinha. */
export function useGenerateBoxSummary() {
  return useMutation<SummaryResponse, Error, string>({
    mutationFn: async (boxId: string) => {
      const response = await apiClient.post(
        `/bau-mental/boxes/${boxId}/summarize/`
      );
      return response.data;
    },
  });
}

/** Gera resumo de múltiplas notas. */
export function useGenerateNotesSummary() {
  return useMutation<SummaryResponse, Error, string[]>({
    mutationFn: async (noteIds: string[]) => {
      const response = await apiClient.post("/bau-mental/notes/summarize/", {
        note_ids: noteIds,
      });
      return response.data;
    },
  });
}
