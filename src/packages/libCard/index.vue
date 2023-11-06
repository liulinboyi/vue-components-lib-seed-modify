<template>
  <div>
    <button class="default">
      click
    </button>
    <div>{{ demo }}</div>
    <img :src="img">
    <div>{{ dayJs(new Date().valueOf()).format('YYYY-MM-DD HH:mm:ss') }}</div>
  </div>
</template>

<script lang="ts" setup>
import img from '../../assets/logo.png'
import dayJs from 'dayjs'
import { useDemo } from '../composable/index'
import { ref } from 'vue';

const { demo } = useDemo()

withDefaults(defineProps<{
  type?: 'default' | 'primary'
}>(), {
  type: 'default'
})

defineOptions({
  name: 'LibCard'
})
</script>
<style lang="scss">
@import './button.scss';
// .demo {
//     background: red;
//     background: url(../../assets/logo.png);
// }
</style>
