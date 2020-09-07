declare const stoze: DefaultExport;
export default stoze;

export interface DefaultExport extends Function {
  <T = any>(defaultState?: T, options?: StoreOptions<T>): StoreInfer<T>;
  state<T = any>(defaultValue?: T): State<T>;
  selector<T>(selectors: Function[], combiner: (...args) => T): Selector<T>;
  asyncQueue(promise): AsyncQueue;
}

export type StoreInfer<T> = Store<T>;

export type Selector<T> = (...args: any[]) => T;

export interface Store<T> extends StoreBase<T> {
  loadable: StateLoadableInfer<T>;
  select<TResult>(
    selector?: (
      state: StoreStateInfer<T>,
      loadable?: StateLoadableInfer<T>
    ) => TResult
  ): TResult;
}

export interface StoreBase<T> {
  state: StoreStateInfer<T>;
  dispatch: Dispatcher<T>;
  onDispatch(listener: DispatchListener<T>): RemoveListener;
  onChange(listener: ChangeListener<T>): RemoveListener;
}

export interface StoreOptions<TState> {
  init?: Effect<TState, any>;
}

export interface EffectContext<TState = any> {
  state: StoreStateInfer<TState>;
  cancelled(): boolean;
  cancellable<T>(promise: Promise<T>): Promise<T>;
  cancel(): void;
  delay(ms: number): Task;
  delay<TPayload>(
    ms: number,
    effect: Effect<TState, TPayload>,
    payload?: TPayload
  ): Task;
  delay(ms: number, mutation: Mutation<TState>, payload?: any): Task;
  delay(ms: number, value: any): Task;
  last(): Task;
  latest(): void;
  pipe(actions: Action<TState>[], payload?: any, doneCallback?: Function): Task;
  repeat?(
    effect: Effect<TState, any>,
    condition?: (payload?: TState) => boolean,
    payload?: TState
  ): Task;
  race<T>(
    tasks: T,
    callback?: (
      payload?: AsyncCallbackInfer<T, { type: any; payload: any }>
    ) => any
  ): Task;
  all<T>(tasks: T): Task;
  all<T>(tasks: T, effect: Effect<T, AsyncCallbackInfer<T, any>>): Task;
  all<T>(tasks: T, action: Mutation<T>): Task;

  when(action: Action): Task;
  when(actions: Action[]): Task;
  on<T>(action: Action, callback: Action<T>, payload?: T): Task;
  on<T>(actions: Action[], callback: Action<T>, payload?: T): Task;
  dispatch: Dispatcher<TState>;
}

export interface Loadable<T> {
  value: T;
  state: "loading" | "hasValue" | "hasError";
  error: any;
  loading: boolean;
  hasValue: boolean;
  hasError: boolean;
}

export interface Task<T = any> extends Promise<T> {
  cancel(): void;
  cancelled(): boolean;
  result(): T;
}

export type StoreLoadable<T> = {
  [key in keyof T]: T[key] extends Selector<infer TResult>
    ? Loadable<TResult>
    : Loadable<T[key]>;
};

export type StoreLoadableSelectors<T> = {
  $: {
    [key in keyof T]: T[key] extends Selector<infer TResult>
      ? Selector<Loadable<TResult>>
      : never;
  };
};

export type StateLoadableInfer<T> = StoreLoadableSelectors<T> &
  StoreLoadable<T>;

export type Reducer<TState, TValue, TPayload = any> = (
  value: TValue,
  payload: TPayload,
  state: TState
) => TValue;

export type Dispatcher<TState> = {
  <TPayload>(effect: Effect<TState, TPayload>, payload?: TPayload): Task;
  (
    mutation: Mutation<TState>,
    payload?: Promise<any> | (() => Promise<any>) | any
  ): Task;
};

export type MutationInfer<TState> =
  | { [key in keyof TState]?: Reducer<TState, TState[key]> }
  | { $: PayloadNormalizer<TState> };

export type Mutation<T> = MutationInfer<StoreStateInfer<T>>;

export type Action<TState = any> = Mutation<TState> | Effect<TState, any>;

export type PayloadNormalizer<T> = (payload: any, state: T) => any;

export type Effect<TState, TPayload> =
  | ((payload: TPayload, context: EffectContext<TState>) => any)
  | ((payload: TPayload) => any)
  | Function;

export type AsyncCallbackInfer<TInput, TPayload> = {
  [key in keyof TInput]: TPayload;
};

export type Listener<T> = (args: T) => any;

export type DispatchListener<TState> = Listener<{
  store: Store<TState>;
  action: Action<TState>;
  payload: any;
}>;

export type ChangeListener<TState> = Listener<{
  store: Store<TState>;
  state: TState;
  mutation: Mutation<TState>;
}>;

export type RemoveListener = () => void;

export interface State<T> {
  readonly state: "loading" | "hasValue" | "hasError";
  readonly error: any;
  readonly value: T;
  readonly rawValue: T;
  update(promise: Promise<T>): void;
  update<U>(
    promise: Promise<U>,
    reducer: (prevValue: T, nextValue: U) => T
  ): void;
  update(nextValue: T): void;
  update(reducer: (prevValue?: T) => T): void;
  update<U>(nextValue: U, reducer: (prevValue: T, nextValue: U) => T): void;
}

export interface AsyncQueue {
  readonly state: "processing" | "completed" | "failed";
  readonly completed: boolean;
  readonly error: any;
  add(item: Promise<any>): AsyncQueue;
  add(items: Promise<any>[]): AsyncQueue;
}

export type StoreState<T> = {
  [key in keyof T]: T[key] extends Selector<infer TResult> ? TResult : T[key];
};

export type StoreStateSelectors<T> = {
  $: {
    [key in keyof T]: T[key] extends Selector<infer TResult>
      ? Selector<TResult>
      : never;
  };
};

export type StoreStateInfer<T> = StoreStateSelectors<T> & StoreState<T>;
