const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.(ts|tsx)$/,
                loader: 'ts-loader',
            },
            {
                test: /\.css$/i,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.module\.scss$/,  // match files with .module.scss
                include: path.resolve(__dirname, 'src'),
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]__[local]__[hash:base64:5]'
                            }
                        }
                    },
                    'postcss-loader',
                    'sass-loader'
                ],
            },
            {
                test: /\.scss$/,  // for non-module scss
                exclude: /\.module\.scss$/,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.*', '.js', '.jsx', '.ts', '.tsx', ".scss"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public', 'index.html'),
        }),
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
        port: 3000,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true,
    },
    stats: {
        errorDetails: true,
    },
};
