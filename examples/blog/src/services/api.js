function load(url) {
  return fetch(`https://jsonplaceholder.typicode.com/${url}`).then((res) =>
    res.json()
  );
}

function createService(name, url, { detailProps = [] } = {}) {
  let storage;

  function createMethod(handler) {
    return async function () {
      if (!storage) {
        storage = await load(url);
      }
      // fake server busy
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 700)
      );
      return handler(storage, ...arguments);
    };
  }

  function findItemById(list, id) {
    return list.find((item) => item.id === id);
  }

  function sliceList(list, pagination) {
    if (!pagination) return list;
    if (pagination.index) {
      list = list.slice(pagination.index * pagination.size);
    }
    list = list.slice(0, pagination.size);
    return list;
  }

  return {
    name,
    getMany: createMethod((list, { filter, pagination } = {}) => {
      const allItems = list.map((item) => {
        const newItem = { ...item };
        detailProps.forEach((prop) => delete newItem[prop]);
        return newItem;
      });

      let filteredItems = allItems;
      if (filter) {
        const filterEntries = Object.entries(filter);
        if (filterEntries.length) {
          filteredItems = allItems.filter((item) =>
            filterEntries.every(([key, value]) =>
              // use contains operator for string value
              typeof value === "string"
                ? String(item[key]).indexOf(value) !== -1
                : value === item[key]
            )
          );
        }
      }

      return {
        total: filteredItems.length,
        items: sliceList(filteredItems, pagination),
      };
    }),
    getOne: createMethod((list, id) => {
      return findItemById(list, id);
    }),
    update: createMethod((list, id, props) => {
      let item = findItemById(list, id);
      if (!item) {
        item = { id };
        list.push(item);
      }
      Object.assign(item, props);
    }),
    remove: createMethod((list, id) => {
      const index = list.findIndex((item) => item.id === id);
      index !== -1 && list.splice(index, 1);
    }),
  };
}

export const posts = createService("posts", "posts");
export const comments = createService("comments", "comments");
