const nothing = {};

export default function is(obj) {
  if (obj && typeof obj.__type === "object") {
    return obj.__type;
  }
  return nothing;
}
