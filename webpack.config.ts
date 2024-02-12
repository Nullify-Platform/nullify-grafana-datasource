// Extended webpack config from Grafana base webpack config
// https://grafana.com/developers/plugin-tools/create-a-plugin/extend-a-plugin/extend-configurations#extend-the-webpack-config

import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    // Add custom config here...
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          // Add your new patterns here
          { from: '../INSTALL.md', to: '.', force: true },
        ],
      }),
    ],
  });
};

export default config;
