export function toCategoryDndId(id: string): string {
  return `category:${id}`;
}

export function toCategoryDropId(id: string): string {
  return `category-drop:${id}`;
}

export function toServiceDndId(id: string): string {
  return `service:${id}`;
}

export function parseDndId(
  dndId: string,
):
  | { kind: "category"; id: string }
  | { kind: "category-drop"; id: string }
  | { kind: "service"; id: string }
  | null {
  if (dndId.startsWith("category-drop:")) {
    return { kind: "category-drop", id: dndId.slice("category-drop:".length) };
  }
  if (dndId.startsWith("category:")) {
    return { kind: "category", id: dndId.slice("category:".length) };
  }
  if (dndId.startsWith("service:")) {
    return { kind: "service", id: dndId.slice("service:".length) };
  }
  return null;
}
