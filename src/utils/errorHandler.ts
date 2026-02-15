import axios from "axios";
import { timeoutErrorMessage } from "../consts/errors";

/**
 * Проверяет, является ли ошибка ошибкой таймаута
 */
export function isTimeoutError(error: any): boolean {
  if (axios.isAxiosError(error)) {
    // Axios timeout
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return true;
    }
    // Network timeout
    if (error.code === "ETIMEDOUT") {
      return true;
    }
  }
  
  // Fetch timeout
  if (error?.message?.includes("timeout") || error?.message === "Request timeout") {
    return true;
  }

  return false;
}

/**
 * Получает сообщение об ошибке для пользователя
 */
export function getUserErrorMessage(error: any): string {
  if (isTimeoutError(error)) {
    return timeoutErrorMessage;
  }
  
  // Для других ошибок можно добавить дополнительные проверки
  return "";
}
