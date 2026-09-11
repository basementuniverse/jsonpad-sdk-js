import * as constants from '../constants';
import { JSONPadError } from '../errors';
import { ResponseMeta } from '../types/response-meta';
import parseResponseMeta from './parse-response-meta';

export default async function request<T = any>(
  token: string,
  method: string,
  path: string,
  parameters?: Record<string, any>,
  body?: any,
  identityGroup?: string,
  identityToken?: string
): Promise<{ data: T | null; meta: ResponseMeta }> {
  const parametersString = parameters
    ? new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(parameters).map(([key, value]) => [
            key,
            value.toString(),
          ])
        ),
      })
    : '';
  const headers: Record<string, string> = {
    [constants.API_TOKEN_HEADER]: token,
    'Content-Type': 'application/json',
  };

  if (identityGroup) {
    headers[constants.IDENTITY_GROUP_HEADER] = identityGroup;
  }

  if (identityToken) {
    headers[constants.IDENTITY_TOKEN_HEADER] = identityToken;
  }

  const response = await fetch(
    `${constants.API_URL}${path}?${parametersString}`,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const meta = parseResponseMeta(response);

  if (!response.ok) {
    throw new JSONPadError(response.status, await response.text(), meta);
  }

  if (response.status === 204) {
    return { data: null, meta };
  }

  return { data: await response.json(), meta };
}
