import { IpcRendererProxy } from "../../common/ipcRendererProxy";
// import { Tensor, InferenceSession } from "onnxjs";

const PROXY_NAME = "LocalOnnxModel";

export class LocalOnnxModelProxy {
    public static loadModel(modelBinary: Buffer): Promise<any> {
        console.log('LocalOnnxModelProxy.loadModel');
        return IpcRendererProxy.send(`${PROXY_NAME}:loadModel`, [modelBinary]);
    }

    public static runModel(inputs: Array<any>): Promise<any> {
        console.log('LocalOnnxModelProxy.runModel');
        return IpcRendererProxy.send(`${PROXY_NAME}:runModel`, [inputs]);
    }
}
