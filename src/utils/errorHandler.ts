import axios from "axios";
import {
  timeoutErrorMessage,
  rateLimitErrorMessage,
  serviceUnavailableErrorMessage,
} from "../consts/errors";

export function isTimeoutError(error: any): boolean {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return true;
    }
    if (error.code === "ETIMEDOUT") {
      return true;
    }
  }

  if (error?.message?.includes("timeout") || error?.message === "Request timeout") {
    return true;
  }

  return false;
}

export function getUserErrorMessage(error: any): string {
  if (isTimeoutError(error)) {
    return timeoutErrorMessage;
  }

  if (axios.isAxiosError(error) && error.response?.status) {
    if (error.response.status === 429) {
      return rateLimitErrorMessage;
    }
    if (error.response.status === 503) {
      return serviceUnavailableErrorMessage;
    }
  }

  return "";
}
