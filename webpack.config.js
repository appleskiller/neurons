const path = require('path');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

module.exports = {
  performance: {
    hints: false
  },
  entry: {
    app: [
      './demo/src/vendor.ts',
      './demo/src/index.ts',
    ],
  },
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'demo'),
    filename: 'app.bundle.js',
  },
  devtool: 'source-map',
  resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        // '@shujujiang/core': path.resolve(__dirname, '../core/src/'),
        // '@shujujiang/schemas': path.resolve(__dirname, '../schemas/src/'),
    }
  },
  module: {
      rules: [{
          test: /\.tsx?$/,
        //   exclude: /node_modules/,
          loader: 'awesome-typescript-loader'
      }, {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader'],
      }]
  },
  plugins: [
    new HotModuleReplacementPlugin()
  ],
  devServer: {
    // host: 'localhost',
    host: '127.0.0.1',
    port: 8081,
    contentBase: path.resolve(__dirname, './demo'),
    watchContentBase: true,
    progress: true,
    compress: true,
    hot: true,
    open: true,
    historyApiFallback: {
      disableDotRule: true
    },
    watchOptions: {
      ignored: /node_modules/
    },
    overlay: {
      warnings: true,
      errors: true
    }
  }
}