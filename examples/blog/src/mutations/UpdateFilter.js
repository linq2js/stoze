export default {
  filter(value, payload) {
    // is post id
    if (/^#\d+$/.test(payload)) {
      return { id: parseInt(payload.substr(1), 10) };
    }
    return { body: payload };
  },
};
