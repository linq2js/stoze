import createAsyncQueue from "../createAsyncQueue";

const delay = (ms, value) =>
  new Promise((resolve) => setTimeout(resolve, ms, value));

test("single promise", async () => {
  const queue = createAsyncQueue(delay(10));
  expect(queue.state).toBe("processing");
  await delay(15);
  expect(queue.state).toBe("completed");
});

test("multiple promises", async () => {
  const queue = createAsyncQueue([delay(5), delay(15)]);
  expect(queue.state).toBe("processing");
  await delay(10);
  expect(queue.state).toBe("processing");
  await delay(10);
  expect(queue.state).toBe("completed");
});

test("immutable", async () => {
  const queue1 = createAsyncQueue();
  const queue2 = queue1.add(delay(10));
  expect(queue1.state).toBe("completed");
  expect(queue2.state).toBe("processing");
  await delay(15);
  expect(queue1.state).toBe("completed");
  expect(queue2.state).toBe("completed");
});

test("error throwing", async () => {
  const queue = createAsyncQueue(delay(10));
  expect(() => queue.completed).toThrowError();
  await delay(15);
  expect(queue.completed).toBe(true);
  expect(queue.error).toBeUndefined();
});

test("rejected", async () => {
  const queue = createAsyncQueue([delay(10), Promise.reject("invalid")]);

  await delay(15);
  expect(() => queue.completed).toThrowError();
  expect(queue.error).toBe("invalid");
  expect(queue.state).toBe("failed");
});
