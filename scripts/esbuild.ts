import path, { resolve, dirname } from 'path'
import { build, BuildOptions, buildSync } from 'esbuild'
import { cwd } from 'process'
import fs from 'fs'
import ora from 'ora'
import klawSync from 'klaw-sync'
import { parse, init } from 'es-module-lexer'
import vue from 'unplugin-vue/esbuild'

const PACKAGES_PATH = path.resolve(
  __dirname,
  '../src/packages'
)

export const componentEntrys = klawSync(PACKAGES_PATH, {
  nofile: true,
  depthLimit: 0,
}).map((dir) => dir.path + '/index.ts')

// console.log(componentEntrys)

async function run(options?: BuildOptions) {
  await build({
    outdir: `${cwd()}/dist/es`,
    bundle: true,
    entryPoints: componentEntrys,
    plugins: [
      vue({
        sourceMap: false,
        style: {
          isProd: true,
          preprocessLang: 'scss',
          postcssOptions: {
            map: false,
          },
          // preprocessOptions: {
          //   stylus: {
          //     additionalData: `@import '${process.cwd()}/src/styles/index.styl'`,
          //   },
          // },
        },
      }),
      {
        name: 'image-loader',
        setup(build) {
          build.onLoad({ filter: /\.(png|jpg|jpeg|gif)$/ }, async (args) => {
            const buffer = fs.readFileSync(args.path);
            const size = buffer.length;
            // const limit = 8192; // 8KB
            // const limit = 1024; // 8KB

            // if (size <= limit) {
              return {
                contents: buffer,
                loader: 'dataurl',
              };
            // } 
            // else {
            //   return {
            //     contents: buffer,
            //     loader: 'file',
            //   };
            // }
          });
        },
      }
    ],
    // loader: { '.png': 'dataurl' },
    external: [
      'vue',
      'my-library/*',
      '@vue/*',
      '@better-scroll/*',
      'jpeg-js',
      'dayjs'
    ],
    format: 'esm',
    minify: false,
    ...options,
  })
}

/**
 * @deprecated
 */
async function bundle(options?: BuildOptions) {
  await build({
    outfile: `${cwd()}/dist/es/my-library.esm.js`,
    bundle: true,
    entryPoints: [`${cwd()}/src/packages/my-library.ts`],
    plugins: [vue()],
    loader: { '.png': 'dataurl' },
    external: ['vue', 'my-library/*', '@vue/*'],
    format: 'esm',
    minify: true,
    ...options,
  })
}

const spinner = ora('Build... \n').start()

Promise.all([
  run(),
  run({
    format: 'cjs',
    outdir: `${cwd()}/dist/lib`,
  }),
])
  .then(async () => {
    await combineCss()
    await combineDepsCss()
    spinner.succeed('Done !')
  })
  .catch(() => {
    spinner.succeed('Failed !')
  })

async function combineCss() {
  const allCss = klawSync(`${cwd()}/dist/es`, {
    nofile: true,
    depthLimit: 0,
  }).map((dir) => dir.path + '/index.css')

  let content = ''
  for (const css of allCss) {
    if (fs.existsSync(css)) {
      content += await fs.promises.readFile(css, 'utf8')
    }
  }

  // override bundle css
  await Promise.all([
    fs.promises.writeFile(
      `${cwd()}/dist/es/my-library.esm.css`,
      content
    ),
    fs.promises.writeFile(
      `${cwd()}/dist/lib/my-library.umd.css`,
      content
    ),
  ])

  const name = 'my-library.min.css'
  await Promise.all([
    fs.promises.rename(
      `${cwd()}/dist/es/my-library.esm.css`,
      `${cwd()}/dist/es/${name}`
    ),
    fs.promises.rename(
      `${cwd()}/dist/lib/my-library.umd.css`,
      `${cwd()}/dist/lib/${name}`
    ),
  ])
}

async function combineDepsCss() {
  const PATH_RE = /^\.*\//
  const alljs = klawSync(`${cwd()}/dist/es`, {
    nofile: true,
    depthLimit: 0,
  }).map((dir) => dir.path + '/index.js')
  await init
  alljs.forEach((js) => {
    const [imports] = parse(fs.readFileSync(js, 'utf-8'))
    const cssFile = resolve(dirname(js), './index.css')

    if (fs.existsSync(cssFile)) {
      const selfCss = `import './index.css'\n`
      const depsCss = imports
        .flat()
        .map((item) => item.n)
        .filter((n) => !n.endsWith('utils'))
        .filter((n) => PATH_RE.test(n))
        .map((n) => `import '${n}/index.css'`)
        .join('\n')
      const styleFile = resolve(dirname(js), './style.js')

      fs.writeFileSync(styleFile, depsCss + '\n' + selfCss)

      buildSync({
        entryPoints: [styleFile],
        format: 'cjs',
        allowOverwrite: true,
        outfile: resolve(
          dirname(js).replace('/es/', '/lib/'),
          './style.js'
        ),
      })
    }
  })
}
