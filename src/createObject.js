export default function createObject(types, ...props) {
  return Object.assign(...props, {
    __type: types
  });
}
