import { NextResponse } from "next/server";

export type RouteContext<T extends Record<string, string>> = {
  params: Promise<T>;
};

export const badRequest = (body: unknown) =>
  NextResponse.json(body, { status: 400 });

export const notFound = (body: unknown) =>
  NextResponse.json(body, { status: 404 });

export const conflict = (body: unknown) =>
  NextResponse.json(body, { status: 409 });

export const serverError = (body: unknown) =>
  NextResponse.json(body, { status: 500 });

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export async function parseJsonSafely<T>(
  request: Request,
  errorBody: unknown = { error: "Invalid request body." },
) {
  try {
    return { data: (await request.json()) as T };
  } catch {
    return { response: badRequest(errorBody) };
  }
}
