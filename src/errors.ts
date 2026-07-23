export interface ApiError {
  code: string;
  message: string;
}

export function jsonError(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json({ code, message } satisfies ApiError, { status });
}
