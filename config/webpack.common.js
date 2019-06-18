const path = require("path");
const fs = require('fs');
const BUILD_DIR = path.resolve(__dirname, "../build/");

if (!fs.existsSync('build')){
  fs.mkdirSync('build');
}

console.log(fs.readdirSync('./node_modules/onnxjs/dist/'));

fs.createReadStream('./node_modules/onnxjs/dist/onnx-wasm.wasm').pipe(fs.createWriteStream('build/onnx-wasm.wasm'));
fs.createReadStream('./node_modules/onnxjs/dist/onnx-worker.js').pipe(fs.createWriteStream('build/onnx-worker.js'));

module.exports = {
    node: {
        __dirname: false,
        fs: "empty",
    },
    target: "electron-main",
    entry: "./src/electron/main.ts",
    module: {
        rules: [
            {
                test: /\.ts?$/,
                // use: 'awesome-typescript-loader',
                use: [{
                    // loader: "awesome-typescript-loader",
                    loader: "ts-loader",
                    options: {
                        compilerOptions: {
                            noEmit: false
                        }
                    }
                }],
                // include: __dirname,
                // exclude: /node_modules/
            },
            {
                test: /\.node?$/,
                // use: 'awesome-typescript-loader',
                use: [{
                    loader: 'node-loader',
                    // loader: "ts-loader",
                    options: {
                        compilerOptions: {
                            noEmit: false
                        }
                    }
                }],
                // exclude: /node_modules/
            },
            {
                test: /worker\.js$/,
                use: {
                    loader: 'worker-loader',
                    options: { inline: true, fallback: false }
                }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".node"]
    },
    output: {
        filename: "main.js",
        path: BUILD_DIR
        // path: path.resolve(__dirname, "../build")
    }
};
