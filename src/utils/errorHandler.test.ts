import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { isTimeoutError, getUserErrorMessage } from "./errorHandler";
import {
  timeoutErrorMessage,
  rateLimitErrorMessage,
  serviceUnavailableErrorMessage,
} from "../consts/errors";

function makeAxiosError(
  code?: string,
  status?: number,
  message = "Request failed",
): AxiosError {
  const error = new AxiosError(message, code);
  if (status) {
    error.response = {
      status,
      data: {},
      headers: {},
      statusText: "",
      config: {} as any,
    };
  }
  return error;
}

describe("isTimeoutError", () => {
  it("detects ECONNABORTED", () => {
    expect(isTimeoutError(makeAxiosError("ECONNABORTED"))).toBe(true);
  });

  it("detects ETIMEDOUT", () => {
    expect(isTimeoutError(makeAxiosError("ETIMEDOUT"))).toBe(true);
  });

  it("detects timeout in message", () => {
    expect(
      isTimeoutError(makeAxiosError(undefined, undefined, "timeout of 50000ms exceeded")),
    ).toBe(true);
  });

  it("detects generic timeout error", () => {
    expect(isTimeoutError(new Error("Request timeout"))).toBe(true);
  });

  it("returns false for non-timeout errors", () => {
    expect(isTimeoutError(makeAxiosError("ERR_NETWORK"))).toBe(false);
    expect(isTimeoutError(new Error("Something broke"))).toBe(false);
  });
});

describe("getUserErrorMessage", () => {
  it("returns timeout message for timeout errors", () => {
    expect(getUserErrorMessage(makeAxiosError("ECONNABORTED"))).toBe(
      timeoutErrorMessage,
    );
  });

  it("returns rate limit message for 429", () => {
    expect(getUserErrorMessage(makeAxiosError(undefined, 429))).toBe(
      rateLimitErrorMessage,
    );
  });

  it("returns service unavailable message for 503", () => {
    expect(getUserErrorMessage(makeAxiosError(undefined, 503))).toBe(
      serviceUnavailableErrorMessage,
    );
  });

  it("returns empty string for unknown errors", () => {
    expect(getUserErrorMessage(new Error("unknown"))).toBe("");
    expect(getUserErrorMessage(makeAxiosError(undefined, 500))).toBe("");
  });

  it("prioritizes timeout over status code", () => {
    // axios timeout sets ECONNABORTED even if there's no response
    expect(getUserErrorMessage(makeAxiosError("ECONNABORTED", 503))).toBe(
      timeoutErrorMessage,
    );
  });
});
