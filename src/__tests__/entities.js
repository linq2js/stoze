import createEntities from "../createEntities";

const source = [
  { id: 1, title: "item 1", completed: true },
  { id: 2, title: "item 2", completed: false },
];

test("update()", () => {
  const data = createEntities(source);
  expect(data.ids).toEqual([1, 2]);
  expect(data.entities).toEqual({
    1: source[0],
    2: source[1],
  });
  expect(data.get()).toEqual(source);
  // should cache output value
  expect(data.get()).toBe(data.get());
});

test("remove()", () => {
  expect(createEntities(source).remove(1).entities).toEqual({
    2: source[1],
  });

  expect(createEntities(source).remove([1, 1]).entities).toEqual({
    2: source[1],
  });

  expect(createEntities(source).remove([1, 2]).entities).toEqual({});
});

test("update() duplicate", () => {
  expect(
    createEntities(source).update([
      { id: 1, title: "item 3" },
      { id: 1, title: "item 4" },
    ])
  ).toMatchObject({
    ids: [1, 2],
    entities: {
      1: { id: 1, title: "item 4" },
      2: source[1],
    },
  });
});

test("clear()", () => {
  const result = createEntities(source)
    .update([
      { id: 1, title: "item 3" },
      { id: 1, title: "item 4" },
    ])
    .clear();
  expect(result.get()).toEqual([]);
  expect(result.ids).toEqual([]);
  expect(result.entities).toEqual({});
});

test("slice()", () => {
  const result1 = createEntities(source, {
    slice: {
      completed: (entity) => entity.completed,
    },
  });
  const slice1 = result1.get("completed");
  expect(slice1).toEqual([true, false]);
  const slice2 = result1.get("completed");
  expect(slice1).toBe(slice2);

  // try to change title
  const result2 = result1.update({
    id: 1,
    title: "new title",
    completed: true,
  });
  const slice3 = result2.get("completed");
  expect(slice3).toBe(slice1);

  // try to change completed
  const result3 = result2.update({
    id: 1,
    title: "new title",
    completed: false,
  });
  const slice4 = result3.get("completed");
  expect(slice4).toEqual([false, false]);
  // the change in result3 does not affect to result2's slices
  expect(result2.get("completed")).toEqual([true, false]);
});

test("update() with merge flag", () => {
  const result1 = createEntities(source);
  const result2 = result1.update({ id: 1, completed: false }, true);
  expect(result2.entities[1]).toEqual({
    id: 1,
    title: "item 1",
    completed: false,
  });

  // merge without change
  const result3 = result2.update({ id: 1, completed: false }, true);
  expect(result3).toBe(result2);
});
