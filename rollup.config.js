import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import {version} from './package.json';

export default {
    input: 'src/data-slider.ts',
    output: [
        {
            file: 'dist/data-slider.js',
            format: 'umd',
            name: 'Webenomic Data-Slider',
            exports: 'named',
            banner: `/** @license \n Webenomic Data-Slider v${version} | Copyright (c) ${new Date().getFullYear()} | Ben Silverman, Webenomic LLC | MIT Licensed \n**/`
        },
    ],
    plugins: [typescript(),commonjs()],
};