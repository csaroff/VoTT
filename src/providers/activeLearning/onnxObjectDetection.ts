import axios from "axios";
import * as shortid from "shortid";
import * as tf from "@tensorflow/tfjs";
// import { Tensor, InferenceSession } from "onnxjs"
import { ElectronProxyHandler } from "./electronProxyHandler";
import { IRegion, RegionType } from "../../models/applicationState";
import { strings } from "../../common/strings";
import { ObjectDetection, ImageObject, DetectedObject } from "./objectDetection";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { LocalFileSystemProxy} from "../../providers/storage/localFileSystemProxy";
import { LocalOnnxModelProxy} from "../../providers/storage/localOnnxModelProxy";

const PROXY_NAME = "LocalFileSystem";

const sigmoid = (t) => 1 / (1 + Math.pow(Math.E, -t));
const softmax = (list) => {
    const denominator = list.map((y) => Math.exp(y)).reduce((a, b) => a + b);
    return list.map((value,index) => Math.exp(value) / denominator);
}

const labels = [
  "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat",
  "chair", "cow", "diningtable", "dog", "horse", "motorbike", "person",
  "pottedplant", "sheep", "sofa", "train", "tvmonitor"
]

/**
 * Object Dectection loads active learning models and predicts regions
 */
export class OnnxObjectDetection extends ObjectDetection {
    // private model: InferenceSession = new InferenceSession();
    private modelLoaded: boolean = false;
    private modelLoading: boolean = false;

    // private jsonClasses: JSON;

    /**
     * Returns true if the model/session is loaded
     */
    get loaded(): boolean {
        return this.modelLoaded;
    }

    /**
     * Dispose the tensors allocated by the model. You should call this when you
     * are done with the model.
     */
    public dispose() {
        console.log('OnnxObjectDetection.dispose not implemented');
        // if (this.model) {
        //     this.model.dispose();
        // }
    }

    /**
     * Load a TensorFlow.js Object Detection model from file: or http URL.
     * @param modelFolderPath file: or http URL to the model
     */
    public async load(modelFilePath: string) {
        console.log('Line 31');
        try {
            console.log('Line 33');
            if(!this.modelLoading) {
                this.modelLoading = true;
                console.log('Line 35', modelFilePath);
                // console.log('this.model', this.model);
                // console.log('this.model.loadModel', this.model.loadModel);
                const modelBinary: Buffer = await IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, [modelFilePath]);
                console.log('line 54', modelBinary);
                // await LocalOnnxModelProxy.loadModel(modelBinary);
                // await this.model.loadModel(modelBinary);
                // console.log('Loaded session line 35');

                // // Warmup the model
                // const inputs = [new Tensor(new Float32Array(1 * 3 * 416 * 416), "float32", [1, 3, 416, 416])];
                // const outputMap = await this.model.run(inputs);
                // // const outputMap = await LocalOnnxModelProxy.loadModel(modelBinary);
                // const outputTensor = outputMap.values().next().value;
                // console.log('Warmed up model', outputTensor);

                this.modelLoaded = true;
            }
            this.modelLoading = false;
        } catch (err) {
            this.modelLoaded = false;
            console.error('err', err);
            throw err;
        }
    }

    /**
     * Predict Regions from an HTMLImageElement returning list of IRegion.
     * @param image ImageObject to be used for prediction
     * @param predictTag Flag indicates if predict only region bounding box of tag too.
     * @param xRatio Width compression ratio between the HTMLImageElement and the original image.
     * @param yRatio Height compression ratio between the HTMLImageElement and the original image.
     */
    public async predictImage(image: ImageObject, predictTag: boolean, xRatio: number, yRatio: number)
        : Promise<IRegion[]> {
        const regions: IRegion[] = [];

        const predictions = await this.detect(image);
        predictions.forEach((prediction) => {
            const left = Math.max(0, prediction.bbox[0] * xRatio);
            const top = Math.max(0, prediction.bbox[1] * yRatio);
            const width = Math.max(0, prediction.bbox[2] * xRatio);
            const height = Math.max(0, prediction.bbox[3] * yRatio);

            regions.push({
                id: shortid.generate(),
                type: RegionType.Rectangle,
                tags: predictTag ? [prediction.class] : [],
                boundingBox: {
                    left,
                    top,
                    width,
                    height,
                },
                points: [{
                    x: left,
                    y: top,
                },
                {
                    x: left + width,
                    y: top,
                },
                {
                    x: left + width,
                    y: top + height,
                },
                {
                    x: left,
                    y: top + height,
                }],
            });
        });

        return regions;
    }

    /**
     * Detect objects for an image returning a list of bounding boxes with
     * associated class and score.
     *
     * @param img The image to detect objects from. Can be a tensor or a DOM
     *     element image, video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations. Defaults to 20.
     *
     */
    public async detect(img: ImageObject, maxNumBoxes: number = 20): Promise<DetectedObject[]> {
        try {
            // const bbxs = await axios.get('http://localhost:5000/');
            // const batched = tf.tidy(() => {
            //     img = tf.browser.fromPixels(img as HTMLCanvasElement)
            //     return tf.transpose(img.expandDims(0), [0, 3, 1, 2]);
            // });
            // console.log(batched);
            console.log('canvas width, height', (img as HTMLCanvasElement).width, (img as HTMLCanvasElement).height);
            const response = await axios.post('http://localhost:5000/analyze', {
                image: (img as HTMLCanvasElement).toDataURL()
            });
            const bbxs = response.data.result.map((box) => { box.score = 1.0; return box });
            console.log('bbxs', bbxs);
            return bbxs;
        }
        catch(error) {
            console.error('line 159', error);
            console.error('line 160', JSON.stringify(error));
        }
        // if (this.model) {
        //     return this.infer(img, maxNumBoxes);
        // }

        return [];
    }

    /**
     * Infers through the model.
     *
     * @param img The image to classify. Can be a tensor or a DOM element image,
     * video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations. Defaults to 20.
     */
    // private async infer(img: ImageObject, maxNumBoxes: number = 20): Promise<DetectedObject[]> {
    //     console.log('OnnxObjectDetection.infer not implemented');
    //     console.log(img);
    //     console.log('typeof img', img.constructor.name);
    //     try {
    //         const batched = tf.tidy(() => {
    //             console.log('line 157');
    //             if (!(img instanceof tf.tensor)) {
    //                 img = tf.browser.frompixels(img)
    //             }
    //             console.log('line 160');
    //             // reshape to a single-element batch so we can pass it to executeasync.
    //             // let result = img.expanddims(0);
    //             return tf.transpose(tf.image.resizenearestneighbor(img, [416, 416]).expanddims(0), [0, 3, 1, 2]);
    //         });
    //         console.log('line 163')
    //         const height = batched.shape[2];
    //         const width = batched.shape[3];
    //         console.log('line 165', batched.dtype);
    //         console.log('line 170', batched.asType('float32').dtype);
    //         console.log('line 171', (await batched.asType('float32').data()).constructor.name);
    //         // const inputs = new Tensor(await batched.asType('float32').data(), 'float32', batched.shape);
    //         const inputs = new Tensor(await Float32Array.from(await batched.data()), 'float32', batched.shape);
    //         // model returns two tensors:
    //         // 1. box classification score with shape of [1, 1917, 90]
    //         // 2. box location with shape of [1, 1917, 1, 4]
    //         // where 1917 is the number of box detectors, 90 is the number of classes.
    //         // and 4 is the four coordinates of the box.
    //         console.log('line 174');
    //         // const outputMap = await LocalOnnxModelProxy.runModel([inputs]);
    //         const outputMap = await this.model.run([inputs]);

    //         console.log('line 176');
    //         const outputTensor = outputMap.values().next().value;

    //         console.log('outputMap', outputMap);
    //         console.log('outputTensor', outputTensor);

    //         const detections: DetectedObject[] = this.pascalYoloV2Postprocess(outputTensor);

    //         const prevBackend = tf.getBackend();
    //         // run post process in cpu
    //         tf.setBackend("cpu");
    //         const indexTensor = tf.tidy(() => {
    //             const jsBoxes = detections.map((d) => d.bbox);
    //             console.log('shape', jsBoxes.length, jsBoxes[0].length);
    //             const boxes = tf.tensor2d(detections.map((d) => d.bbox));
    //             return tf.image.nonMaxSuppression(boxes, detections.map((d) => d.score), maxNumBoxes, 0.5, 0.5);
    //         });

    //         const indexes = indexTensor.dataSync() as Float32Array;
    //         tf.dispose(indexTensor);

    //         tf.setBackend(prevBackend);
    //         const result: DetectedObject[] = Array.from(indexes).map((i) => detections[i]);
    //         return result;

    //     }
    //     catch(e) {
    //         console.error(e);
    //         throw e;
    //     }

    //     return null;


    //     // const scores = result[0].dataSync() as Float32Array;
    //     // const boxes = result[1].dataSync() as Float32Array;

    //     // // clean the webgl tensors
    //     // batched.dispose();
    //     // tf.dispose(result);

    //     // const [maxScores, classes] = this.calculateMaxScores(scores, result[0].shape[1], result[0].shape[2]);

    //     // const prevBackend = tf.getBackend();
    //     // // run post process in cpu
    //     // tf.setBackend("cpu");
    //     // const indexTensor = tf.tidy(() => {
    //     //     const boxes2 = tf.tensor2d(boxes, [result[1].shape[1], result[1].shape[3]]);
    //     //     return tf.image.nonMaxSuppression(boxes2, maxScores, maxNumBoxes, 0.5, 0.5);
    //     // });

    //     // const indexes = indexTensor.dataSync() as Float32Array;
    //     // indexTensor.dispose();

    //     // // restore previous backend
    //     // tf.setBackend(prevBackend);

    //     // return this.buildDetectedObjects(width, height, boxes, maxScores, indexes, classes);
    // }

    // http://machinethink.net/blog/object-detection-with-yolo/
    // private pascalYoloV2Postprocess(modelOutput: Tensor, confThresh: number = 0.3): DetectedObject[] {
    //     // YOLO v2 outputs an array (125 x 13 x 13).
    //     // This effectively splits the image into 13x13=169 different grid cells.
    //     // Each grid cell predicts 5 bouding boxes.  Each bounding box prediction
    //     // is a length 25 array containing: x, y, width, height, confidence score,
    //     // ...probability of each class).
    //     const [one, gcyLen, gcxLen, bbxPredsLen] = modelOutput.dims
    //     const anchors: Array<number> = [1.08, 1.19, 3.42, 4.41, 6.63, 11.38, 9.42, 5.11, 16.62, 10.52];
    //     const predictions: DetectedObject[] = [];


    //     for(let cy = 0; cy < gcyLen; cy++) {
    //         for(let cx = 0; cx < gcxLen; cx++) {
    //             for(let b = 0; b < bbxPredsLen; b++) {
    //                 const channel = b * (bbxPredsLen / 5);
    //                 // const offset = tensor.data;
    //                 const offset = (channel, x, y) => channel;
    //                 console.log('modelOutput', modelOutput);
    //                 const tx: number = modelOutput.get([1, channel, cx, cy]) as number;
    //                 const ty: number = modelOutput.get([1, channel + 1, cx, cy]) as number;
    //                 const tw: number = modelOutput.get([1, channel + 2, cx, cy]) as number;
    //                 const th: number = modelOutput.get([1, channel + 3, cx, cy]) as number;
    //                 const tc: number = modelOutput.get([1, channel + 4, cx, cy]) as number;
    //                 const x: number = (cx + sigmoid(tx)) * 32;
    //                 const y: number = (cy + sigmoid(ty)) * 32;
    //                 const w: number = Math.exp(tw) * anchors[2*b] * 32;
    //                 const h: number = Math.exp(th) * anchors[2*b + 1] * 32;
    //                 const confidence: number = sigmoid(tc);
    //                 let classes = []; // [Float](repeating: 0, count: numClasses)
    //                 for(let c = 0; c < bbxPredsLen - 5; c++) {
    //                     classes[c] = modelOutput.get([1, channel + 5 + c, cx, cy]);
    //                 }
    //                 classes = softmax(classes)

    //                 const bestClassScore = classes.reduce((a, b) => Math.max(a, b));
    //                 const detectedClass = classes.indexOf(bestClassScore);

    //                 // Combine the confidence score for the bounding box, which tells us
    //                 // how likely it is that there is an object in this box (but not what
    //                 // kind of object it is), with the largest class prediction, which
    //                 // tells us what kind of object it detected (but not where).
    //                 let confidenceInClass = bestClassScore * confidence

    //                 if(confidenceInClass > confThresh) {
    //                     const prediction: DetectedObject = {
    //                         bbox: [x - w / 2, y - h / 2, w, h],
    //                         class: labels[detectedClass],
    //                         score: confidenceInClass
    //                     }
    //                     predictions.push(prediction);
    //                 }

    //             }
    //         }
    //     }
    //     return null;
    // }

    // private buildDetectedObjects(
    //     width: number, height: number, boxes: Float32Array, scores: number[],
    //     indexes: Float32Array, classes: number[]): DetectedObject[] {
    //     const count = indexes.length;
    //     const objects: DetectedObject[] = [];

    //     for (let i = 0; i < count; i++) {
    //         const bbox = [];
    //         for (let j = 0; j < 4; j++) {
    //             bbox[j] = boxes[indexes[i] * 4 + j];
    //         }
    //         const minY = bbox[0] * height;
    //         const minX = bbox[1] * width;
    //         const maxY = bbox[2] * height;
    //         const maxX = bbox[3] * width;
    //         bbox[0] = minX;
    //         bbox[1] = minY;
    //         bbox[2] = maxX - minX;
    //         bbox[3] = maxY - minY;
    //         objects.push({
    //             bbox: bbox as [number, number, number, number],
    //             class: this.getClass(i, indexes, classes),
    //             score: scores[indexes[i]],
    //         });
    //     }

    //     return objects;
    // }

    // private getClass(index: number, indexes: Float32Array, classes: number[]): string {
    //     if (this.jsonClasses && index < indexes.length && indexes[index] < classes.length) {
    //         const classId = classes[indexes[index]];
    //         const classObject = this.jsonClasses[classId];

    //         return classObject ? classObject.displayName : strings.tags.warnings.unknownTagName;
    //     }

    //     return "";
    // }

    private calculateMaxScores(
        scores: Float32Array, numBoxes: number,
        numClasses: number): [number[], number[]] {
        const maxes = [];
        const classes = [];
        for (let i = 0; i < numBoxes; i++) {
            let max = Number.MIN_VALUE;
            let index = -1;
            for (let j = 0; j < numClasses; j++) {
                if (scores[i * numClasses + j] > max) {
                    max = scores[i * numClasses + j];
                    index = j;
                }
            }
            maxes[i] = max;
            classes[i] = index;
        }
        return [maxes, classes];
    }
}
