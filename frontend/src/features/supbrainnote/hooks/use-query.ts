/** Hooks para consultas com IA. */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface QueryResponse {
  answer: string;
  sources: Array<{
    note_id: string;
    excerpt: string;
    date: string;
    box_name: string;
  }>;
}

interface QueryRequest {
  question: string;
  box_id?: string;
  limit?: number;
}

/** Consulta inteligente com IA. */
export function useQueryAI() {
  return useMutation<QueryResponse, Error, QueryRequest>({
    mutationFn: async (data: QueryRequest) => {
      const response = await apiClient.post("/supbrainnote/query/ask/", data);
      return response.data;
    },
  });
}

