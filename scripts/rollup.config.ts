import path from 'path'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import vue from 'unplugin-vue/rollup'
import alias from '@rollup/plugin-alias'
import esbuild from 'rollup-plugin-esbuild'
import replace from '@rollup/plugin-replace'

const outPubOptions = {
  globals: {
    vue: 'Vue',
  },
}

const input = 'src/packages/my-library.ts'

const getPlugins = () => [
  replace({
    preventAssignment: true,
    values: {
      'import.meta.env.PROD': 'true',
    },
  }),
  nodeResolve(),
  vue({
    style: {
      // preprocessLang: 'scss',
      // preprocessOptions: {
      //   stylus: {
      //     additionalData: `@import '${process.cwd()}/src/styles/index.scss'`,
      //   },
      // },
    },
  }),
  alias({
    entries: [
      {
        find: /^(my-library\/)(.*)/,
        replacement: `${path.resolve(
          __dirname,
          '../src/packages'
        )}/$2/index.ts`,
      },
    ],
  }),
  esbuild({
    minify: false,
  }),
  // genCss(),
  postcss({
    extract: true,
  }),
]

const configs = []

configs.push({
  input,
  output: {
    file: `dist/es/my-library.esm.js`,
    format: 'es',
    ...outPubOptions,
  },
  plugins: getPlugins(),
  external(id) {
    const reg = /^vue/.test(id) || /^@vue/.test(id) || /\.(png|jpg|jpeg|gif)$/.test(id) || /^dayjs/.test(id)
    return reg
  },
})

configs.push({
  input,
  output: {
    file: `dist/lib/my-library.umd.js`,
    format: 'umd',
    name: `my-library`,
    ...outPubOptions,
  },
  plugins: getPlugins(),
  external(id) {
    const reg =
      /^vue/.test(id) ||
      /^@vue/.test(id) ||
      /^jpeg-js/.test(id) ||
      /\.(png|jpg|jpeg|gif)$/.test(id) ||
      /^dayjs/.test(id)
    return reg
  },
})

// configs.push({
//   input: 'src/packages/ui.ts',
//   output: {
//     file: `ui.js`,
//     format: 'es',
//     name: `ui`,
//     ...outPubOptions,
//   },
//   plugins: getPlugins(),
//   external(id) {
//     const reg =
//       /^vue/.test(id) ||
//       /^@vue/.test(id) ||
//       /^jpeg-js/.test(id)
//     return reg
//   },
// })

// configs.push({
//   input: 'src/packages/core.ts',
//   output: {
//     file: `core.js`,
//     format: 'es',
//     name: `core`,
//     ...outPubOptions,
//   },
//   plugins: getPlugins(),
//   external(id) {
//     const reg =
//       /^vue/.test(id) ||
//       /^@vue/.test(id) ||
//       /^jpeg-js/.test(id)
//     return reg
//   },
// })

export default configs
