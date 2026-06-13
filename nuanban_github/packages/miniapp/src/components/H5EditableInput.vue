<template>
  <input
    :value="modelValue"
    class="input nb-input"
    :type="type"
    :placeholder="placeholder"
    :maxlength="maxlength"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { uniInputValue } from '../utils/uni-input';

withDefaults(
  defineProps<{
    modelValue?: string;
    type?: 'text' | 'tel' | 'number';
    placeholder?: string;
    maxlength?: number | string;
  }>(),
  { modelValue: '', type: 'text', placeholder: '' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function onInput(e: unknown) {
  emit('update:modelValue', uniInputValue(e));
}
</script>
