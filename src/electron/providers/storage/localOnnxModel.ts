import { Tensor, InferenceSession } from "onnxjs-node";
import { BrowserWindow } from "electron";
import { fork } from "child_process";

export default class LocalOnnxModel {
    static model: any; // = new InferenceSession();
    // static child = fork('./localOnnxModelWorker');
    constructor(private browserWindow: BrowserWindow) {
        console.log('LocalOnnxModel.constructor');
    }

    private loadModel(modelBinary: Buffer): Promise<any> {
        console.log('LocalOnnxModel.loadModel');
        return LocalOnnxModel.model.loadModel(modelBinary);
    }

    private runModel(inputs: Array<any>): Promise<any> {
        return LocalOnnxModel.model.run(inputs);
    }
    /**
     *
     */
    // private loadModel(modelBinary: Buffer): Promise<any> {
    //     console.log('LocalOnnxModel.loadModel');
    //     return new Promise((resolve, reject) => {
    //         try {
    //             LocalOnnxModel.child.send({
    //                 message: 'loadModel',
    //                 modelBinary: modelBinary
    //             });
    //             LocalOnnxModel.child.on('message', ({ message }) => {
    //                 if(message == 'loadModel')
    //                     resolve();
    //             });
    //             LocalOnnxModel.child.on('error', reject);
    //         }
    //         catch(error) {
    //             console.error(error);
    //             reject(error);
    //         }
    //     });

    //     // return LocalOnnxModel.model.loadModel(modelBinary);
    // }

    /**
     * Run the model over the given inputs, returning the result.
     * @param {InferenceSession} model
     * @param {Array<Tensor>} inputs
     * @returns {Promise} BBoxes from running the model over the inputs.
     */
    // private runModel(inputs: Array<any>): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         try {
    //             LocalOnnxModel.child.send({ message: 'runModel', inputs: inputs });
    //             LocalOnnxModel.child.on('message', ({ message, predictions }) => {
    //                 if(message == 'runModel')
    //                     resolve(predictions);
    //             });
    //         }
    //         catch(error) {
    //             console.error(error);
    //             reject(error);
    //         }
    //     });
    //     // return LocalOnnxModel.model.run(inputs);
    // }
}
