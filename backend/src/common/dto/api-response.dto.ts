export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;

  static ok<T>(data: T, message = 'Success'): ApiResponse<T> {
    return { success: true, message, data };
  }

  static fail(message: string, error?: string): ApiResponse<any> {
    return { success: false, message, error };
  }
}
