export async function retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 500) : Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}
