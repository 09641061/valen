import type { DragEndEvent, DragOverEvent, DragStartEvent, DroppableContainer } from "@dnd-kit/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions";
import type { CategoryDto, ServiceDto } from "../schemas";
import { catalogCollisionDetection } from "./catalog-dnd-helpers";
import { useCatalogDnd } from "./useCatalogDnd";

vi.mock("../actions", () => ({
  moveCategoryAction: vi.fn(),
  moveServiceAction: vi.fn(),
}));

const CAT_A = "11111111-1111-4111-8111-111111111111";
const CAT_B = "22222222-2222-4222-8222-222222222222";
const CAT_EMPTY = "33333333-3333-4333-8333-333333333333";
const SVC_1 = "aaaa1111-1111-4111-8111-111111111111";
const SVC_2 = "aaaa2222-2222-4222-8222-222222222222";
const SVC_3 = "bbbb1111-1111-4111-8111-111111111111";

function makeService(
  id: string,
  categoryId: string,
  name: string,
  sortOrder: number,
): ServiceDto {
  return {
    id,
    category_id: categoryId,
    name,
    duration_minutes: 30,
    price_minor_units: 2000,
    sort_order: sortOrder,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function makeCategories(): CategoryDto[] {
  return [
    {
      id: CAT_A,
      name: "Hair",
      sort_order: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      services: [
        makeService(SVC_1, CAT_A, "Cut", 1),
        makeService(SVC_2, CAT_A, "Wash", 2),
      ],
    },
    {
      id: CAT_B,
      name: "Beard",
      sort_order: 2,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      services: [makeService(SVC_3, CAT_B, "Trim", 1)],
    },
    {
      id: CAT_EMPTY,
      name: "Spa",
      sort_order: 3,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      services: [],
    },
  ];
}

function makeHook(categories = makeCategories()) {
  const addOptimistic = vi.fn();
  const onError = vi.fn();
  const onSuccess = vi.fn();
  const hook = renderHook(() =>
    useCatalogDnd({
      categories,
      isFiltering: false,
      addOptimistic,
      onError,
      onSuccess,
    }),
  );
  return { ...hook, addOptimistic, onError, onSuccess };
}

describe("catalogCollisionDetection", () => {
  const makeContainer = (id: string, top: number, bottom: number) =>
    ({
      id, key: id, disabled: false, node: { current: null }, data: { current: {} },
      rect: { current: { top, left: 0, width: 300, height: bottom - top, bottom, right: 300 } },
    }) as unknown as DroppableContainer;

  it("restricts category drags to category containers only", () => {
    const rect = { top: 0, left: 0, width: 300, height: 100, bottom: 100, right: 300 };
    const droppableContainers = [
      makeContainer(`category:${CAT_A}`, 0, 100),
      makeContainer(`category-drop:${CAT_B}`, 110, 200),
      makeContainer(`service:${SVC_3}`, 120, 160),
      makeContainer(`category:${CAT_B}`, 110, 220),
    ];
    const droppableRects = new Map(droppableContainers.map((c) => [c.id, c.rect.current])) as never;
    const hits = catalogCollisionDetection({
      active: { id: `category:${CAT_A}`, data: { current: {} }, rect: { current: { initial: rect, translated: rect } } } as never,
      collisionRect: { top: 120, left: 0, width: 300, height: 50, bottom: 170, right: 300 },
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 150, y: 140 },
    });
    expect(hits.every((h) => String(h.id).startsWith("category:"))).toBe(true);
    expect(hits[0]?.id).toBe(`category:${CAT_B}`);
  });

  it("prefers service over category-drop and ignores category containers when dragging a service", () => {
    const rect = { top: 120, left: 0, width: 300, height: 40, bottom: 160, right: 300 };
    const droppableContainers = [
      makeContainer(`category:${CAT_B}`, 100, 250),
      makeContainer(`category-drop:${CAT_B}`, 110, 250),
      makeContainer(`service:${SVC_3}`, 120, 160),
    ];
    const droppableRects = new Map(droppableContainers.map((c) => [c.id, c.rect.current])) as never;
    const hits = catalogCollisionDetection({
      active: { id: `service:${SVC_1}`, data: { current: {} }, rect: { current: { initial: rect, translated: rect } } } as never,
      collisionRect: rect,
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 150, y: 140 },
    });
    expect(hits.map((h) => h.id)).toEqual([`service:${SVC_3}`]);
  });
});

describe("useCatalogDnd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reorders services within the same category on drag end", async () => {
    vi.mocked(actions.moveServiceAction).mockResolvedValue({
      ok: true,
      data: makeService(SVC_1, CAT_A, "Cut", 2),
    });
    const { result, addOptimistic, onSuccess } = makeHook();

    act(() => result.current.handleDragStart({ active: { id: `service:${SVC_1}` } } as DragStartEvent));
    act(() => result.current.handleDragOver({ active: { id: `service:${SVC_1}` }, over: { id: `service:${SVC_2}` } } as DragOverEvent));
    expect(result.current.displayCategories[0].services.map((s) => s.id)).toEqual([SVC_1, SVC_2]);

    act(() => result.current.handleDragEnd({ active: { id: `service:${SVC_1}` }, over: { id: `service:${SVC_2}` } } as DragEndEvent));

    await waitFor(() => {
      expect(actions.moveServiceAction).toHaveBeenCalledWith({
        id: SVC_1,
        category_id: CAT_A,
        sort_order: 2,
      });
    });
    expect(addOptimistic).toHaveBeenCalledWith({
      type: "move-service",
      serviceId: SVC_1,
      targetCategoryId: CAT_A,
      targetSortOrder: 2,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("moves a service into an empty category with live preview and persistence", async () => {
    vi.mocked(actions.moveServiceAction).mockResolvedValue({
      ok: true,
      data: makeService(SVC_1, CAT_EMPTY, "Cut", 1),
    });
    const { result, onSuccess } = makeHook();

    act(() => result.current.handleDragStart({ active: { id: `service:${SVC_1}` } } as DragStartEvent));
    act(() => result.current.handleDragOver({ active: { id: `service:${SVC_1}` }, over: { id: `category-drop:${CAT_EMPTY}` } } as DragOverEvent));

    expect(result.current.activeDragCategoryId).toBe(CAT_EMPTY);
    expect(result.current.displayCategories[2].services.map((s) => s.id)).toEqual([SVC_1]);

    act(() => result.current.handleDragEnd({ active: { id: `service:${SVC_1}` }, over: { id: `category-drop:${CAT_EMPTY}` } } as DragEndEvent));

    await waitFor(() => {
      expect(actions.moveServiceAction).toHaveBeenCalledWith({
        id: SVC_1,
        category_id: CAT_EMPTY,
        sort_order: 1,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("moves a service into a non-empty category with onDragOver preview and onDragEnd persistence", async () => {
    vi.mocked(actions.moveServiceAction).mockResolvedValue({
      ok: true,
      data: makeService(SVC_1, CAT_B, "Cut", 1),
    });
    const { result, onSuccess } = makeHook();

    act(() => result.current.handleDragStart({ active: { id: `service:${SVC_1}` } } as DragStartEvent));
    act(() => result.current.handleDragOver({ active: { id: `service:${SVC_1}` }, over: { id: `service:${SVC_3}` } } as DragOverEvent));

    expect(result.current.activeDragCategoryId).toBe(CAT_B);
    expect(result.current.displayCategories[0].services.map((s) => s.id)).toEqual([SVC_2]);
    expect(result.current.displayCategories[1].services.map((s) => s.id)).toEqual([SVC_1, SVC_3]);

    act(() => result.current.handleDragEnd({ active: { id: `service:${SVC_1}` }, over: { id: `service:${SVC_1}` } } as DragEndEvent));

    await waitFor(() => {
      expect(actions.moveServiceAction).toHaveBeenCalledWith({
        id: SVC_1,
        category_id: CAT_B,
        sort_order: 1,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("rolls back preview to pre-drag snapshot on drag cancel", () => {
    const { result } = makeHook();

    act(() => result.current.handleDragStart({ active: { id: `service:${SVC_1}` } } as DragStartEvent));
    act(() => result.current.handleDragOver({ active: { id: `service:${SVC_1}` }, over: { id: `service:${SVC_3}` } } as DragOverEvent));
    expect(result.current.displayCategories[1].services.map((s) => s.id)).toEqual([SVC_1, SVC_3]);

    act(() => result.current.handleDragCancel());

    expect(result.current.activeDragCategoryId).toBeNull();
    expect(result.current.displayCategories[0].services.map((s) => s.id)).toEqual([SVC_1, SVC_2]);
    expect(result.current.displayCategories[1].services.map((s) => s.id)).toEqual([SVC_3]);
    expect(actions.moveServiceAction).not.toHaveBeenCalled();
  });
});
