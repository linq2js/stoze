import createTask from "./createTask";

export const doneTask = createTask((callback) => callback(undefined));

export default function createTaskGroup(tasks) {
  if (tasks.length === 0) return doneTask;
  if (tasks.length === 1) return tasks[0];
  return createTask((callback, { onCancel, onDispose }) => {
    let doneCount = 0;
    onCancel(() => {
      tasks.forEach((subTask) => subTask.cancel());
    });
    tasks.forEach((task) => {
      onDispose(task.onError((error) => callback(undefined, error)));
      onDispose(
        task.onSuccess(() => {
          doneCount++;
          if (doneCount === tasks.length) {
            callback();
          }
        })
      );
    });
  });
}
