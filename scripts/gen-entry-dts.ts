/**
 * todo
 * 生成 bundle 的入口文件
 * 1. 读取 packages/index.ts 拿到导出 （es-module-lexer）
 * 2. 生成一个 entry.ts
 */
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import klawSync from 'klaw-sync'
import { init, parse } from 'es-module-lexer'

import pkg from '../package.json'

const CWD = process.cwd()
const PACKAGES_PATH = path.resolve(
  __dirname,
  '../src/packages'
)

const componentEntrys = klawSync(PACKAGES_PATH, {
  nofile: true,
  depthLimit: 0,
})
  .filter(
    (dir) =>
      !dir.path.endsWith('utils') &&
      !dir.path.endsWith('directives') &&
      !dir.path.endsWith('locale') &&
      !dir.path.endsWith('composable') &&
      !dir.path.endsWith('library')
  )
  .map((dir) =>
    /^win/.test(process.platform)
      ? path
          .join(dir.path, '/index.ts')
          .split(path.sep)
          .join(path.posix.sep)
      : path.join(dir.path, '/index.ts')
  )

export async function parseComponentExports() {
  let str = ''
  const componentNames = []
  const version = pkg.version

  await init
  str += `import type { App } from 'vue'\n`

  /**
   * 遍历组件
   */
  for (const comp of componentEntrys) {
    const code = fs.readFileSync(comp, {
      encoding: 'utf-8',
    })
    // const [_, exports] = parse(code)

    const NAME_RE = /(\w+)\.(install)/
    const matchs = code.match(NAME_RE)

    // console.log(comp)
    // console.log(CWD)

    const packagesPath = path.resolve(CWD, `./src/packages`)
    const comResolve = path.resolve(comp)
    // console.log(packagesPath)
    // console.log(comResolve)
    const afterProcessPath = comResolve
    .replace(/\.ts$/, '')
    .replace(packagesPath, '.')
    .replace(/\\/g, '/')

    str += `import ${matchs[1]} from '${afterProcessPath}'\n`
    componentNames.push(matchs[1])
  }
  str += '\n'
  
  if (fs.existsSync(path.resolve(PACKAGES_PATH, './composable'))) {
    str += `export * from './composable/index'\n`
  }

  str += `const components = [${componentNames.join(
    ', '
  )}]\n`

  /**
   * export default
   */
  str += `const version = '${version}'\n`
  str += `
    const install = (app: App) => {
      components.forEach((component) => {
        component.name && app.component(component.name, component)
      })
    }\n
  `
  /**
   * export const
   */
  str += `export { ${componentNames.join(', ')} }\n`

  str += `export default { version, install }\n`

  return str
}

async function writeEntry() {
  fs.writeFileSync(
    `${CWD}/src/packages/my-library.ts`,
    await parseComponentExports()
  )

  // fs.writeFileSync(
  //   `${CWD}/src/packages/ui.ts`,
  //   `
  //   export * from './my-library'

  //   `
  // )

  // fs.writeFileSync(
  //   `${CWD}/src/packages/core.ts`,
  //   `
  //   export * from './composable'

  //   `
  // )
  /**
   * 格式化
   */
  spawn(
    /^win/.test(process.platform) ? 'eslint.cmd' : 'eslint',
    ['./src/packages/my-library.ts', '--fix']
  ).on('error', function (err) {
    throw err
  })
}

writeEntry()
