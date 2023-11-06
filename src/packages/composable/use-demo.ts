import { ref } from 'vue'

export const useDemo = () => {
  const demo = ref(0)

  return {
    demo
  }
}
