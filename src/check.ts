import stoze, { Effect, EffectContext, MutationInfer } from "./index";

interface State {
  count: number;
  term: string;
  results: string[];
  select(): number;
}

// const store2 = stoze()

const store = stoze<State>({
  count: 0,
  term: "",
  results: [],
  select() {
    return 1;
  },
});

const Increase: MutationInfer<State> = {
  count: (value, payload, state) => value + 1 + state.select,
};

const IncreaseAsync = (by = 1, { dispatch }: EffectContext<State>) => {
  dispatch(Increase);
};

function Cancel() {}

const UpdateResults: MutationInfer<State> = {
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
store.select((state, loadable) => {});
store.dispatch(Search, "aaa");
