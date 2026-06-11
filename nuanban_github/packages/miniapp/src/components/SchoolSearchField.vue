<template>
  <view class="school-field">
    <input
      v-model="query"
      class="input nb-input"
      placeholder="搜索并选择学校"
      @input="onInput"
      @focus="open = true"
      @blur="onBlur"
    />
    <view v-if="open && suggestions.length" class="dropdown">
      <view
        v-for="name in suggestions"
        :key="name"
        class="option"
        :class="{ active: name === modelValue }"
        @tap="select(name)"
      >
        <text>{{ name }}</text>
      </view>
    </view>
    <text v-if="modelValue && valid" class="picked">已选：{{ modelValue }}</text>
    <text v-else-if="touched && !valid" class="err">请从列表中选择有效学校</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { isKnownSchool, searchKnownSchools } from '../utils/known-schools';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const query = ref('');
const open = ref(false);
const touched = ref(false);

const valid = computed(() => isKnownSchool(props.modelValue));
const suggestions = computed(() => searchKnownSchools(query.value, 10));

watch(
  () => props.modelValue,
  (v) => {
    if (v && !query.value) query.value = v;
  },
  { immediate: true },
);

function onInput() {
  open.value = true;
  touched.value = true;
  if (props.modelValue && query.value !== props.modelValue) {
    emit('update:modelValue', '');
  }
}

function onBlur() {
  setTimeout(() => {
    open.value = false;
    if (query.value.trim() && !isKnownSchool(query.value)) {
      const exact = suggestions.value.find((s) => s === query.value.trim());
      if (exact) emit('update:modelValue', exact);
      else query.value = props.modelValue || '';
    }
    touched.value = true;
  }, 200);
}

function select(name: string) {
  query.value = name;
  emit('update:modelValue', name);
  open.value = false;
  touched.value = true;
}
</script>

<style scoped>
.school-field {
  position: relative;
}
.input {
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
}
.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 8rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  z-index: 20;
  max-height: 360rpx;
  overflow-y: auto;
}
.option {
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.option.active {
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
}
.picked {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #2a9d8f;
}
.err {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #c45c26;
}
</style>
