export default {
  auth: {
    input: { target: './openapi.json', filters: { tags: ['auth'] } },
    output: {
      target: './src/generated/auth.ts',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: { path: './src/transport.ts', name: 'apiTransport' },
        query: { signal: true },
      },
    },
  },
};
