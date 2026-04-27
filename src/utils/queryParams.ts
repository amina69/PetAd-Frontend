export function getStatusesFromParams(params: URLSearchParams): string[] {
  return params.getAll("status");
}

export function setStatusesInParams(params: URLSearchParams, statuses: string[]): URLSearchParams {
  const newParams = new URLSearchParams(params);
  newParams.delete("status");
  statuses.forEach(status => {
    newParams.append("status", status);
  });
  return newParams;
}
