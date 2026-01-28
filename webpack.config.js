const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  // Main process configuration
  {
    mode: 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
    // Do not bundle native modules used by the main process
    externals: {
      'better-sqlite3': 'commonjs2 better-sqlite3',
      bindings: 'commonjs2 bindings'
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  // Preload script configuration
  {
    mode: 'development',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js',
    },
  },
  // Renderer process configuration
  {
    mode: 'development',
    entry: './src/renderer/renderer.tsx',
    target: 'electron-renderer',
    devtool: 'inline-source-map', // Use inline-source-map instead of eval to avoid CSP unsafe-eval issues
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'renderer.js',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/renderer/project-selection.html', to: 'project-selection.html' },
          { from: 'src/renderer/project-selection.js', to: 'project-selection.js' }
        ]
      })
    ],
  },
];
