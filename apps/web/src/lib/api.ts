import type { GenerationResult, AlgorithmId, ApiError } from "@millionmind/shared";
import { createSupabaseBrowserClient } from "./supabase/client";

export class ApiCallError extends Error {
  constructor(public detail: ApiError, public status: number) {
    super(detail.message);
    this.name = "ApiCallError";
  }
}

export async function generateNumbers(
  algorithm: AlgorithmId,
): Promise<GenerationResult> {
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new ApiCallError({ code: "UNAUTHORIZED", message: "Not signed in" }, 401);
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-numbers`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ algorithm }),
  });
  const body = (await res.json()) as GenerationResult | ApiError;
  if (!res.ok) {
    throw new ApiCallError(body as ApiError, res.status);
  }
  return body as GenerationResult;
}
