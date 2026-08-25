/** Adapt a TanStack server function to a plain (data) => Promise call, e.g. for useMutation. */
export function withData<TData, TResult>(fn: (opts: { data: TData }) => Promise<TResult>) {
  return (data: TData) => fn({ data });
}
