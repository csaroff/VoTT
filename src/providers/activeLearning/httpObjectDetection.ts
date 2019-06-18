import axios from "axios";
import * as shortid from "shortid";
import * as tf from "@tensorflow/tfjs";
import { ElectronProxyHandler } from "./electronProxyHandler";
import { IRegion, RegionType } from "../../models/applicationState";
import { strings } from "../../common/strings";
import { ObjectDetection, ImageObject, DetectedObject } from "./objectDetection";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { LocalFileSystemProxy} from "../../providers/storage/localFileSystemProxy";

/**
 * Object Dectection loads active learning models and predicts regions
 */
export class HTTPObjectDetection extends ObjectDetection {
    private inferenceUrl: string;

    /**
     * Returns true if the model/session is loaded
     */
    get loaded(): boolean {
        return true;
    }

    /**
     * Dispose the tensors allocated by the model. You should call this when you
     * are done with the model.
     */
    public dispose() {
        console.log('HTTPObjectDetection.dispose not implemented');
    }

    /**
     * Load a TensorFlow.js Object Detection model from file: or http URL.
     * @param modelFolderPath file: or http URL to the model
     */
    public async load(modelFilePath: string) {
        this.inferenceUrl = modelFilePath;
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

        return [];
    }
}
