const path = require('path');
const webpack = require('webpack');

module.exports = {
  babel: {
    presets: [
      '@babel/preset-react',
      ['@babel/preset-env', { 
        targets: { 
          node: 'current',
          browsers: ['>0.2%', 'not dead', 'not op_mini all']
        } 
      }]
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true
      }],
      ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
    ]
  },
  webpack: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@styles': path.resolve(__dirname, 'src/styles')
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      })
    ]
  },
  style: {
    postcss: {
      plugins: [require('autoprefixer')]
    }
  }
}; 