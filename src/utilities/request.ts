import * as constants from '../constants';

export default async function request<T>(
  token: string,
  method: string,
  path: string,
  parameters?: Record<string, any>,
  body?: any,
  identityGroup?: string,
  identityToken?: string
): Promise<T> {
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

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}
