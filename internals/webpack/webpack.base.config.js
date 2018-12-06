const path = require('path');
const serverlessWebpack = require('serverless-webpack');
const webpackNodeExternals = require('webpack-node-externals');
const decompress = require('decompress');
// const fs = require('fs-extra-promise');

const sharpLinuxZip = path.join(
  process.cwd(),
  'lib/sharp0.21-node8.10-linux-x64.zip',
);

const nodeModulesDistFolder = path.join(__dirname, 'dist/dependencies/node_modules');

/**
 * Extract zip to output
 * https://github.com/adieuadieu/retinal/blob/master/webpack.config.js
 * https://webpack.js.org/api/compiler-hooks
 * @param {string} archive
 * @param {string} to
 */
function ExtractZipPlugin(archive, to) {
  return {
    apply: compiler => {
      compiler.plugin('emit', async (compilation, callback) => {
        // console.log(`rm ${path.resolve(path.join(__dirname, 'dist/api/node_modules/sharp'))}`);
        // fs.removeSync(path.resolve(path.join(__dirname, 'dist/api/node_modules/sharp')));
        // console.log(`decompress ${path.resolve(archive)} ==> ${path.resolve(to)}`);
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
  plugins: [new ExtractZipPlugin(sharpLinuxZip, nodeModulesDistFolder)],
  mode: options.mode,
  devtool: options.devtool,
});
