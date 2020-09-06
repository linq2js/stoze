import UpdateFilter from "../mutations/UpdateFilter";

export default async function Search(term, { latest, delay, dispatch }) {
  // cancel previous search effect if any
  latest();
  // debounce search effect in 300ms
  await delay(300);
  return dispatch(UpdateFilter, term);
}
