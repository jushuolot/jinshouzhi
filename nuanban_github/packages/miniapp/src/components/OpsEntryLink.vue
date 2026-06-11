<template>
  <text class="ops-entry" @tap="onTap">{{ label }}</text>
</template>

<script setup lang="ts">
import { openOpsMode } from '../utils/ops-mode';

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: '运营台' },
);

function onTap() {
  openOpsMode();
}
</script>

<style scoped>
.ops-entry {
  color: var(--nb-primary, #c45c26);
  font-size: inherit;
}
</style>
