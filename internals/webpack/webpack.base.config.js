const path = require('path');
const serverlessWebpack = require('serverless-webpack');
const webpackNodeExternals = require('webpack-node-externals');
const decompress = require('decompress');

const SHARP_VERSION = '0.21.0';
const sharpTarball = path.join(
  __dirname,
  `../../lambda-sharp/tarballs/sharp-${SHARP_VERSION}-aws-lambda-linux-x64-node-6.10.1.tar.gz`,
);

const nodeModulesDistFolder = path.join(__dirname, 'dist/dependencies');

/**
 * Extract zip to output
 * https://github.com/adieuadieu/retinal/blob/master/webpack.config.js
 * https://webpack.js.org/api/compiler-hooks
 * @param {string} archive
 * @param {string} to
 */
function ExtractTarballPlugin(archive, to) {
  return {
    apply: compiler => {
      compiler.plugin('emit', async (compilation, callback) => {
        await decompress(path.resolve(archive), path.resolve(to));
        if (typeof callback === 'function') {
          callback();
        }
      });
    },
  };
}

module.exports = options => ({
  entry: serverlessWebpack.lib.entries,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: '[name]',
    libraryTarget: 'commonjs2',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: { loader: 'babel-loader' },
      }, {
        test: /\.html$/,
        use: [{ loader: 'file-loader', options: { name: '[path][name].[ext]' } }],
      },
    ],
  },
  externals: [webpackNodeExternals()],
  plugins: [new ExtractTarballPlugin(sharpTarball, nodeModulesDistFolder)],
  mode: options.mode,
  devtool: options.devtool,
});
