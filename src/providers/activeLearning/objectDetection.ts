import axios from "axios";
import * as shortid from "shortid";
import * as tf from "@tensorflow/tfjs";
import { ElectronProxyHandler } from "./electronProxyHandler";
import { IRegion, RegionType } from "../../models/applicationState";
import { strings } from "../../common/strings";

// tslint:disable-next-line:interface-over-type-literal
export type DetectedObject = {
    bbox: [number, number, number, number];  // [x, y, width, height]
    class: string;
    score: number;
};

/**
 * Defines supported data types supported by Tensorflow JS
 */
export type ImageObject = tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

/**
 * Object Dectection loads active learning models and predicts regions
 */
export abstract class ObjectDetection {
    abstract get loaded(): boolean;

    /**
     * Dispose the tensors allocated by the model. You should call this when you
     * are done with the model.
     */
    public abstract dispose();

    /**
     * Load a TensorFlow.js Object Detection model from file: or http URL.
     * @param modelFolderPath file: or http URL to the model
     */
    public abstract async load(modelFolderPath: string);

    /**
     * Predict Regions from an HTMLImageElement returning list of IRegion.
     * @param image ImageObject to be used for prediction
     * @param predictTag Flag indicates if predict only region bounding box of tag too.
     * @param xRatio Width compression ratio between the HTMLImageElement and the original image.
     * @param yRatio Height compression ratio between the HTMLImageElement and the original image.
     */
    public abstract async predictImage(image: ImageObject, predictTag: boolean, xRatio: number, yRatio: number): Promise<IRegion[]>;

    /**
     * Detect objects for an image returning a list of bounding boxes with
     * associated class and score.
     *
     * @param img The image to detect objects from. Can be a tensor or a DOM
     *     element image, video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations.
     *
     */
    public abstract async detect(img: ImageObject, maxNumBoxes: number): Promise<DetectedObject[]>;
}
