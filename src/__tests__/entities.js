import createEntities from "../createEntities";

const source = [
  { id: 1, title: "item 1" },
  { id: 2, title: "item 2" },
];

test("add()", () => {
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
});

test("add() duplicate", () => {
  expect(
    createEntities(source).add([
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

test("reset()", () => {
  const result = createEntities(source)
    .add([
      { id: 1, title: "item 3" },
      { id: 1, title: "item 4" },
    ])
    .reset();
  expect(result.get()).toBe(source);
  expect(result.ids).toEqual([1, 2]);
});

test("clear()", () => {
  const result = createEntities(source)
    .add([
      { id: 1, title: "item 3" },
      { id: 1, title: "item 4" },
    ])
    .clear();
  expect(result.get()).toEqual([]);
  expect(result.ids).toEqual([]);
  expect(result.entities).toEqual({});
});
