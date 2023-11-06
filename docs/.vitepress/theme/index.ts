import DefaultTheme from 'vitepress/theme'
import Demo from '../components/Demo.vue'
import DemoWrapper from '../components/DemoWrapper.vue'
import 'uno.css'
import '@unocss/reset/tailwind.css'
import 'my-library/my-library.min.css'

import type { Theme } from 'vitepress'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // register global components
    app.component('Demo', Demo)
    app.component('DemoWrapper', DemoWrapper)
  },
} as Theme
