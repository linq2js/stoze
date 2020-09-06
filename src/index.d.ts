declare const stoze: DefaultExport;
export default stoze;

export interface DefaultExport extends Function {
  <T = any>(defaultState?: T, options?: StoreOptions<T>): StoreInfer<T>;
  state<T = any>(defaultValue?: T): State<T>;
  selector<T>(
    selectors: Function[],
    combiner: (...args) => T
  ): (...args: any[]) => T;
}

export type StoreInfer<T> = Store<StoreStateInfer<T>>;

export interface Store<T> {
  state: T;
  loadable: StateLoadable<T>;
  select<TResult>(
    selector?: (state: T, loadable?: StateLoadable<T>) => TResult
  ): TResult;
  dispatch: Dispatcher<T>;
  onDispatch(listener: DispatchListener<T>): RemoveListener;
  onChange(listener: ChangeListener<T>): RemoveListener;
}

export interface StoreOptions<TState> {
  init?: Effect<TState, any>;
}

export interface EffectContext<TState = any> {
  state: TState;
  cancelled(): boolean;
  cancellable<T>(promise: Promise<T>): Promise<T>;
  cancel(): void;
  delay(ms: number): Task;
  delay<TPayload>(
    ms: number,
    effect: Effect<TState, TPayload>,
    payload?: TPayload
  ): Task;
  delay(ms: number, mutation: MutationInfer<TState>, payload?: any): Task;
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
  all<T>(tasks: T, action: MutationInfer<T>): Task;

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

export interface State<T> {
  value: T;
  reset(): void;
}

export interface Task<T = any> extends Promise<T> {
  cancel(): void;
  cancelled(): boolean;
  result(): T;
}

export type StateLoadable<T> = { [key in keyof T]: Loadable<T[key]> };

export type Reducer<TState, TValue, TPayload = any> = (
  value: TValue,
  payload: TPayload,
  state: TState
) => TValue;

export type Dispatcher<TState> = {
  <TPayload>(effect: Effect<TState, TPayload>, payload?: TPayload): Task;
  (
    mutation: MutationInfer<TState>,
    payload?: Promise<any> | (() => Promise<any>) | any
  ): Task;
};

export type Mutation<TState> =
  | { [key in keyof TState]?: Reducer<TState, TState[key]> }
  | { $: PayloadNormalizer<TState> };

export type MutationInfer<T> = Mutation<StoreStateInfer<T>>;

export type ActionTuple<TState = any> = [Action<TState>, ...any[]];

export type Action<TState = any> = MutationInfer<TState> | Effect<TState, any>;

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
  mutation: MutationInfer<TState>;
}>;

export type RemoveListener = () => void;

export interface State<T> {
  state: "loading" | "hasValue" | "hasError";
  error: any;
  value: T;
  rawValue: T;
  update(promise: Promise<T>): void;
  update<U>(
    promise: Promise<U>,
    reducer: (prevValue: T, nextValue: U) => T
  ): void;

  update(nextValue: T): void;
  update<U>(nextValue: U, reducer: (prevValue: T, nextValue: U) => T): void;
}

export type StoreStateInfer<T> = {
  [key in keyof T]: T[key] extends (state?: StoreStateInfer<T>) => infer TValue
    ? TValue
    : T[key];
};
