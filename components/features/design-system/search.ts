export function matchesQuery(query: string, ...values: string[]) {
  return values.join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
