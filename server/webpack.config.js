const path = require("path");

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@nocta/crdt": path.resolve(__dirname, "../lib"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.json",
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
};
