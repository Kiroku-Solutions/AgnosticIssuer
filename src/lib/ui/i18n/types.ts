export type Params = Record<string, string | number>;
export type Leaf = string | ((params: Params) => string);
