const HtmlWebPackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: './client/index.js',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: [
                    /node_modules/,
                    /server/
                ],
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader','css-loader']
            },
            {
                test: /\.html$/,
                use: {
                    loader: "html-loader"
                }
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./client/index.html",
            filename: "./index.html"
        })
    ]
};