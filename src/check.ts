import stoze, { EffectContext, HistoryData, Mutation } from "./index";

interface State {
  count: number;
  term: string;
  results: string[];
  select(): number;
  history: HistoryData<{ count: number; term: string }>;
}

// const store2 = stoze()

const store = stoze<State>({
  count: 0,
  term: "",
  results: [],
  select() {
    return 1;
  },
  history: undefined,
});

const historyPlugin = stoze.history<State>("history", "results");

const Increase2: Mutation<State> = {
  $async: { name: Promise.reject() },
};

const Increase3: Mutation<State> = {
  $async: [{ key: [1, 2], value: Promise.reject() }],
};

const Increase: Mutation<State> = {
  $payload(payload): number {
    return 100;
  },
  $async(loadable, payload, state) {
    const l = loadable("").state;
    return {};
  },
  count: (value, payload, state) => {
    state.$select.select(11);
    return value + 1 + state.select;
  },
};

store.dispatch(historyPlugin.go, -1);

const IncreaseAsync = (by = 1, { dispatch, state }: EffectContext<State>) => {
  state.$select.select(1, 2, state.select);
  dispatch(Increase);
};

function Cancel() {}

const UpdateResults: Mutation<State> = {
  results: (value, payload) => value.concat(payload),
};

async function SearchApi(term: string) {}

function Search(
  term: string,
  { latest, race, when, dispatch, delay }: EffectContext<State>
) {
  // cancel previous search
  latest();
  return race({
    cancel: when(Cancel),
    async updateResults() {
      await delay(300);
      dispatch(UpdateResults, SearchApi(term));
    },
  });
}

store.dispatch(Increase);
store.dispatch(IncreaseAsync, 2);
store.select((state, loadable) => {
  return {
    p1: state.select,
    p2: state.$select.select(),
    p4: loadable.select,
    p3: loadable.$select.select(1, 2),
    p6: store.state.$select.select(1, 2),
    p7: store.state.select,
    p8: store.loadable.$async("any").error,
    p9: store.state.$async("any1"),
    p10: loadable.$async("aaa").state,
    p11: loadable.$async(["aaa", "aaa"]).state,
  };
});
store.dispatch(Search, "aaa");
const store2 = store.actions({
  increase: {
    count(a) {
      return 1;
    },
  },
});

store2.increase();
const entities = stoze.entities([{ id: 1, title: "hello", completed: false }], {
  slice: {
    completed(entity) {
      return entity.completed;
    },
  },
});
const completedSlice = entities.update({ id: 2 }).get("completed");
console.log(completedSlice, store.state.history.current.count);
