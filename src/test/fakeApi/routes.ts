// Route definitions for the fake API: `http.get(pattern, resolver)` and so
// on. A pattern is a full URL where `*` matches anything and `:name` one
// path segment, e.g. "*/customers/:customerId/goals".

export type Resolver = (args: {
  request: Request;
  params: Record<string, string>;
}) => Response | Promise<Response>;

export type Route = {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  resolver: Resolver;
};

function compile(path: string) {
  const paramNames: string[] = [];
  const source = path
    .split(/(\*|:\w+)/)
    .map((part) => {
      if (part === "*") return ".*";
      if (part.startsWith(":")) {
        paramNames.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return { pattern: new RegExp(`^${source}$`), paramNames };
}

const route =
  (method: string) =>
  (path: string, resolver: Resolver): Route => ({
    method,
    resolver,
    ...compile(path),
  });

export const http = {
  get: route("GET"),
  post: route("POST"),
  patch: route("PATCH"),
  delete: route("DELETE"),
};
