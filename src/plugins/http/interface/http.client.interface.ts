export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  queryParams?: URLSearchParams;
  headers?: Record<string, string>;
}

export interface HttpClient {
  request(options: HttpRequestOptions): Promise<unknown>;
}
