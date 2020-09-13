declare const stoze: DefaultExport;
declare const DEV: DevExports;
export default stoze;

export interface DefaultExport extends Function {
  <TState = any>(state?: TState, options?: StoreOptions<TState>): Store<TState>;
  selector<T>(selectors: Function[], combiner: (...args) => T): Selector<T>;
  entities<
    TEntity,
    TId extends string | number,
    TSlice extends { [key: string]: (entity: TEntity) => any }
  >(
    initial?: TEntity[],
    options?: {
      selectId?(entity: TEntity): TId;
      slice?: TSlice;
      equal?: EqualityComparer<any>;
    }
  ): Entities<TEntity, TId, TSlice>;
  history<TState = any>(
    dataProp: keyof TState,
    entryProps: (keyof TState)[],
    options?: HistoryOptions
  ): HistoryPlugin<TState>;
  history<TState = any>(
    dataProp: keyof TState,
    entryProp: keyof TState,
    options?: HistoryOptions
  ): HistoryPlugin<TState>;
}

export interface HistoryOptions {
  ignoreInitialState?: boolean;
}

export type Plugin<TState> = (store: Store<TState>) => any;

export type EqualityComparer<T> = (a: T, b: T) => boolean;

export interface HistoryData<TEntry = HistoryEntry> {
  index: number;
  length: number;
  current: TEntry;
  next: TEntry;
  prev: TEntry;
  prevEntries: TEntry[];
  nextEntries: TEntry[];
}

export interface HistoryEntry {
  [key: string]: any;
}

export interface HistoryPlugin<TState = any, TEntry = HistoryEntry>
  extends Plugin<TState> {
  select(state: TState): HistoryData<TEntry>;
  go: Effect<TState, number>;
  back: Effect<TState, void>;
  forward: Effect<TState, void>;
}

export interface Entities<TEntity, TId, TSlice> {
  get(): TEntity[];
  get<TName extends keyof TSlice>(
    sliceName: TName
  ): SliceResultInfer<TEntity, TSlice[TName]>;
  ids: TId[];
  entities: { [key: TId]: TEntity };
  update(entity: Partial<TEntity>, merge?: boolean): this;
  update(entities: Partial<TEntity>[], merge?: boolean): this;
  remove(id: TId): this;
  remove(ids: TId[]): this;
}

export type SliceResultInfer<TEntity, TSelector> = TSelector extends (
  entity?: TEntity
) => infer TResult
  ? TResult[]
  : never;

export interface DevExports {
  registerStore(name: string, store: Store<any>): void;
  onStoreUpdate(
    name: string | string[],
    handler: (args: { name: string; next: Store<any>; prev: Store<any> }) => any
  ): void;
}

export type Selector<T> = (...args: any[]) => T;

export interface Store<TState> extends StoreBase<TState> {
  readonly loadable: StateLoadableInfer<TState>;
  select<TResult>(
    selector?: (
      state: StoreStateInfer<TState>,
      loadable?: StateLoadableInfer<TState>
    ) => TResult
  ): TResult;
  actions<
    TActions extends { [key: string]: Mutation<TState> | Effect<TState, any> }
  >(
    actions: TActions
  ): StoreActionsInfer<this, TActions>;
}

export type StoreActionsInfer<TStore, TActions> = TStore &
  { [key in keyof TActions]: (payload?: any) => Task };

export interface StoreBase<TState> {
  readonly state: StoreStateInfer<TState>;
  readonly loading: boolean;
  dispatch: Dispatcher<TState>;
  onDispatch(
    actions: ActionType[],
    listener: DispatchListener<TState>
  ): RemoveListener;
  onDispatch(
    action: ActionType,
    listener: DispatchListener<TState>
  ): RemoveListener;
  onDispatch(listener: DispatchListener<TState>): RemoveListener;
  onChange<TResult>(
    selector: (state: TState) => TResult,
    listener: ValueChangeListener<TState, TResult>
  ): RemoveListener;
  onChange(listener: StateChangeListener<TState>): RemoveListener;
  onError(listener: ErrorListener<TState>): RemoveListener;
  transaction<TResult>(
    fn: (transaction?: Transaction<TState>) => TResult
  ): TResult;
  transaction(): Transaction<TState>;
}

export interface Transaction<TState> {
  readonly state: TState;
  readonly parent: Transaction<TState>;
  readonly done: boolean;
  readonly rolledBack: boolean;
  readonly committed: boolean;
  commit(): void;
  rollback(): void;
}

export interface StoreOptions<TState> {
  init?: Effect<TState, StateUpdater<TState>>;
  plugins?: Plugin<TState>[];
  onDispatch?:
    | [ActionType, DispatchListener<TState>]
    | DispatchListener<TState>;
  onChange?:
    | [selector: (state: TState) => any, ValueChangeListener<TState, any>]
    | StateChangeListener<TState>;
}

export type StateUpdater<TState> = (state: TState) => void;

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

  when(action: ActionType): Task;
  when(actions: ActionType[]): Task;
  on<T>(action: ActionType, callback: Action<T>, payload?: T): Task;
  on<T>(actions: ActionType[], callback: Action<T>, payload?: T): Task;
  dispatch: Dispatcher<TState>;
}

export type ActionType = "*" | string | Action;

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

export type StoreLoadableExtraProps<T> = {
  $select: {
    [key in keyof T]: T[key] extends Selector<infer TResult>
      ? Selector<Loadable<TResult>>
      : never;
  };
  $async(key: string | any[], defaultValue?: any): Loadable<any>;
};

export type StateLoadableInfer<T> = StoreLoadableExtraProps<T> &
  StoreLoadable<T>;

export type Reducer<TState, TValue, TPayload = any> = (
  value: TValue,
  payload: TPayload,
  state: StoreStateInfer<TState>
) => TValue;

export type Dispatcher<TState> = {
  <TPayload>(effect: Effect<TState, TPayload>, payload?: TPayload): Task;
  (
    mutation: Mutation<TState>,
    payload?: Promise<any> | (() => Promise<any>) | any
  ): Task;
};

export type MutationInfer<TState> =
  | {
      $payload: PayloadNormalizer<TState>;
    }
  | {
      $async:
        | AsyncReducer<TState>
        | { [key: string]: Promise<any> | undefined | null | any }
        | {
            key: string | any[];
            value: Promise<any> | undefined | null | any;
          }[];
    }
  | {
      [key in keyof TState]?: Reducer<TState, TState[key]>;
    };

export type Mutation<TState> = MutationInfer<TState>;

export type Action<TState = any> = Mutation<TState> | Effect<TState, any>;

export type PayloadNormalizer<TState, TPayload = any> = (
  payload?: TPayload,
  state?: TState
) => any;

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

export type StateChangeListener<TState> = Listener<{
  store: Store<TState>;
  state: TState;
  init: boolean;
  mutation: Mutation<TState>;
}>;

export type ValueChangeListener<TState, TValue> = Listener<{
  store: Store<TState>;
  state: TState;
  value: TValue;
  init: boolean;
  mutation: Mutation<TState>;
}>;

export type ErrorListener<TState> = Listener<{
  store: Store<TState>;
  error: any;
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

export type StoreStateExtraProps<T> = {
  $select: {
    [key in keyof T]: T[key] extends Selector<infer TResult>
      ? Selector<TResult>
      : never;
  };
  $async(key: string | any[], defaultValue?: any): any;
};

export interface AsyncState {
  [key: string]: any;
}

export type AsyncReducer<TState, TPayload = any> = (
  loadable: (key: string) => Loadable<any>,
  payload?: TPayload,
  state: TState
) => AsyncState;

export type StoreStateInfer<T> = StoreStateExtraProps<T> & StoreState<T>;
