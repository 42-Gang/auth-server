import got, { Response } from 'got';
import { HttpClient, HttpRequestOptions } from '../interface/http.client.interface.js';

export const gotClient: HttpClient = {
  async request(options: HttpRequestOptions): Promise<Response> {
    const client = got.extend({
      responseType: 'json',
      timeout: { request: 10000 },
    });

    return client(options.url, {
      method: options.method,
      json: options.body,
      searchParams: options.queryParams,
      headers: options.headers,
    });
  },
};
