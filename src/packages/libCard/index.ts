import type { App } from 'vue'
import LibCard from './index.vue'

LibCard.install = (app: App) => {
  app.component(LibCard.name, LibCard)
}

export { LibCard }
export default LibCard
