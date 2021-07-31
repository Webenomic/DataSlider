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
            banner: `/*\n    Webenomic Data-Slider v` + version +`\n\thttps://webenomic.com\n\t(c) ` + new Date().getFullYear() + ` Webenomic LLC\n\tReleased under the MIT License\n*/`
        },
    ],
    plugins: [typescript(),commonjs()],
};