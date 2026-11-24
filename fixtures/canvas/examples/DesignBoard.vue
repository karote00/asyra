<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { mountDesign } from './mount-design'

const host = ref<HTMLDivElement | null>(null)
let dispose: (() => void) | undefined

onMounted(() => {
  if (host.value) dispose = mountDesign(host.value)
})
onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="host" style="height: 480px"></div>
</template>
