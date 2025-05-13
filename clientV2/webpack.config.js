const path = require("path")

module.exports = {
	entry: "./src/index.ts",
	devtool: "inline-source-map",
	module: {
		rules: [
			{
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js"],
		modules: [
			path.resolve(__dirname, "src"),
			path.resolve(__dirname, "node_modules"),
		],
	},
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
	},
	watch: true,
}
