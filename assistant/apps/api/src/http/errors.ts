import type { FastifyReply } from "fastify";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function sendError(reply: FastifyReply, error: unknown) {
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send(fail(error.code, error.message));
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    const statusCode = (error as { statusCode: number }).statusCode;
    const message = error instanceof Error ? error.message : "Request failed";
    const code = statusCode === 429 ? "RATE_LIMITED" : "REQUEST_ERROR";
    return reply.status(statusCode).send(fail(code, message));
  }

  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send(
        fail("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid input"),
      );
  }

  reply.log.error(error);
  return reply
    .status(500)
    .send(fail("INTERNAL_ERROR", "Internal server error"));
}

export function fail(code: string, message: string): { success: false; error: { code: string; message: string } } {
  return { success: false, error: { code, message } };
}
