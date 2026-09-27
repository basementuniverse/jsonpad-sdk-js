import * as constants from '../constants';
import { errorFromResponse } from '../errors';
import { ResponseMeta } from '../types/response-meta';
import parseResponseMeta from './parse-response-meta';

export type FullResponse<T> = {
  data: T | null;
  meta: ResponseMeta;
  status: number;
  headers: Headers;
};

/**
 * Send a request and return everything about the response: its data, meta,
 * status and headers. A null token sends no token at all (a public flow)
 */
export async function requestWithResponse<T = any>(
  token: string | null,
  method: string,
  path: string,
  parameters?: Record<string, any>,
  body?: any,
  identityGroup?: string,
  identityToken?: string,
  apiUrl: string = constants.API_URL,
  extraHeaders?: Record<string, string>
): Promise<FullResponse<T>> {
  // Array values become repeated parameters, e.g. { tagged: ['a', 'b'] } becomes
  // ?tagged=a&tagged=b
  // Dates are sent as ISO 8601 strings, which is the format the API validates
  const parametersString = parameters
    ? new URLSearchParams(
        Object.entries(parameters)
          .filter(([, value]) => value !== undefined)
          .flatMap(([key, value]) =>
            (Array.isArray(value) ? value : [value]).map(v => [
              key,
              v instanceof Date ? v.toISOString() : v.toString(),
            ])
          )
      )
    : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token !== null) {
    headers[constants.API_TOKEN_HEADER] = token;
  }

  if (identityGroup) {
    headers[constants.IDENTITY_GROUP_HEADER] = identityGroup;
  }

  if (identityToken) {
    headers[constants.IDENTITY_TOKEN_HEADER] = identityToken;
  }

  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    if (value !== undefined) {
      headers[name] = value;
    }
  }

  const response = await fetch(`${apiUrl}${path}?${parametersString}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const meta = parseResponseMeta(response);

  if (!response.ok) {
    throw errorFromResponse(
      response.status,
      await response.text(),
      meta,
      response.headers
    );
  }

  const text = response.status === 204 ? '' : await response.text();

  return {
    data: text ? JSON.parse(text) : null,
    meta,
    status: response.status,
    headers: response.headers,
  };
}

export default async function request<T = any>(
  token: string,
  method: string,
  path: string,
  parameters?: Record<string, any>,
  body?: any,
  identityGroup?: string,
  identityToken?: string,
  apiUrl: string = constants.API_URL,
  extraHeaders?: Record<string, string>
): Promise<{ data: T | null; meta: ResponseMeta }> {
  const { data, meta } = await requestWithResponse<T>(
    token,
    method,
    path,
    parameters,
    body,
    identityGroup,
    identityToken,
    apiUrl,
    extraHeaders
  );

  return { data, meta };
}
