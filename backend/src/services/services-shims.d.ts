// Editor shims for service-local modules to handle path-variant resolution issues.
declare module 'services/redis.client' {
  const client: any;
  export default client;
}

// Generic fallback: any module that ends with 'redis.client' will be typed as any.
declare module '*redis.client' {
  const client: any;
  export default client;
}
