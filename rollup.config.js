import minify from 'rollup-plugin-babel-minify';

const outFolder = 'dist';

export default [
  {
    input: 'src/rough-painter.js',
    output: {
      file: `${outFolder}/rough-painter.bundled.js`,
      format: 'iife'
    },
    plugins: [minify({ comments: false })]
  }
];