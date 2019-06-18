import { Tensor, InferenceSession } from "onnxjs-node";
const model = new InferenceSession();

process.on('message', ({ message, modelBinary, inputs }) => {
    console.log('process.on(\'message\')');
    if(message == 'loadModel') {
        console.log('Calling loadModel from child process', message);
        model.loadModel(message);
        // process.send(model.loadModel());
        process.send({ message: 'loadModel' });
    }
    else if(message == 'runModel') {
        console.log('Calling runModel from child process', message);
        process.send({ message: 'runModel', predictions: model.run(message) });
    }
    else {
        console.log('Child process -> none of the above');
    }
});
