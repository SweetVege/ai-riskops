import { NextResponse } from "next/server";

type ApiPayload = Record<string, unknown>;

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

function requestId() {
  return `req-${crypto.randomUUID().slice(0, 8)}`;
}

export function apiOk(payload: ApiPayload = {}) {
  return NextResponse.json({
    success: true,
    ...payload,
    meta: {
      requestId: requestId(),
    },
  });
}

export function apiCreated(payload: ApiPayload = {}) {
  return NextResponse.json(
    {
      success: true,
      ...payload,
      meta: {
        requestId: requestId(),
      },
    },
    { status: 201 },
  );
}

export function apiError(
  status: number,
  errorCode: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode,
      details,
      meta: {
        requestId: requestId(),
      },
    },
    { status },
  );
}
