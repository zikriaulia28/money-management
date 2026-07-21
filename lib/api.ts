import useSWR, { useSWRConfig, mutate } from "swr";

export const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`Fetch ${url} failed: ${r.status}`);
    return r.json();
  });

export { useSWR, useSWRConfig, mutate };
