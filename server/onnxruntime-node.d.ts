declare module "onnxruntime-node" {
  export interface InferenceSession {
    inputNames: readonly string[];
    outputNames: readonly string[];
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
  }
  export const InferenceSession: {
    create(path: string, options?: any): Promise<InferenceSession>;
  };
  export class Tensor {
    constructor(type: string, data: any, dims: number[]);
    data: any;
    dims: number[];
  }
  export const env: any;
  export const listSupportedBackends: any;
  export const registerBackend: any;
  const ort: {
    InferenceSession: typeof InferenceSession;
    Tensor: typeof Tensor;
    [key: string]: any;
  };
  export default ort;
  export = ort;
}
