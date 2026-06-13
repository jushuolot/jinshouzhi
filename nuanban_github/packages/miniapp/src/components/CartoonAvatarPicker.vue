<template>
  <view class="cartoon-picker" :class="{ compact }">
    <view class="current" @tap="toggleOpen">
      <image :src="currentUrl" class="current-img" mode="aspectFill" />
      <view v-if="editable" class="edit-badge">
        <text class="edit-icon">选</text>
      </view>
    </view>
    <view v-if="editable && open" class="panel">
      <view class="grid">
        <view
          v-for="item in CARTOON_AVATARS"
          :key="item.id"
          class="option"
          :class="{ active: !useCustom && item.id === selectedId }"
          @tap="pick(item.id)"
        >
          <image :src="item.url" class="option-img" mode="aspectFill" />
        </view>
      </view>
      <button class="upload-btn" size="mini" @tap="pickCustom">上传自定义头像</button>
    </view>
    <text v-if="editable && !open" class="tap-hint">点击选择预设或上传自定义</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CARTOON_AVATARS, defaultCartoonAvatarId, resolveCartoonAvatarUrl } from '../utils/cartoon-avatars';
import { pickCustomCartoonAvatar } from '../utils/cartoon-avatar-upload';

const props = withDefaults(
  defineProps<{
    avatarId?: string;
    customUrl?: string;
    name?: string;
    editable?: boolean;
    compact?: boolean;
  }>(),
  { editable: true, compact: false },
);

const emit = defineEmits<{
  change: [avatarId: string];
  customChange: [url: string];
}>();

const open = ref(false);
const selectedId = ref('');
const useCustom = ref(false);
const customPreview = ref('');

const currentUrl = computed(() => {
  if (useCustom.value && customPreview.value) return customPreview.value;
  if (props.customUrl && useCustom.value) return props.customUrl;
  return resolveCartoonAvatarUrl(selectedId.value, props.customUrl);
});

watch(
  () => [props.avatarId, props.customUrl, props.name] as const,
  ([id, custom, name]) => {
    if (custom) {
      useCustom.value = true;
      customPreview.value = custom;
      selectedId.value = id || '';
      return;
    }
    useCustom.value = false;
    customPreview.value = '';
    selectedId.value = id || defaultCartoonAvatarId(name || '');
  },
  { immediate: true },
);

function toggleOpen() {
  if (!props.editable) return;
  open.value = !open.value;
}

function pick(id: string) {
  useCustom.value = false;
  customPreview.value = '';
  selectedId.value = id;
  open.value = false;
  emit('change', id);
  emit('customChange', '');
}

async function pickCustom() {
  try {
    const pick = await pickCustomCartoonAvatar();
    useCustom.value = true;
    customPreview.value = pick.previewUrl;
    open.value = false;
    emit('change', '');
    emit('customChange', pick.previewUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg && !/cancel|取消/i.test(msg)) {
      uni.showToast({ title: '选择图片失败', icon: 'none' });
    }
  }
}
</script>

<style scoped>
.cartoon-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cartoon-picker.compact {
  align-items: flex-start;
}
.current {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}
.current-img {
  width: 140rpx;
  height: 140rpx;
  display: block;
}
.compact .current-img {
  width: 120rpx;
  height: 120rpx;
}
.edit-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx 0 0 0;
  background: rgba(0, 0, 0, 0.55);
}
.edit-icon {
  font-size: 20rpx;
  color: #fff;
  line-height: 1;
}
.panel {
  width: 100%;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  background: var(--nb-surface, #fff);
  border-radius: 12rpx;
  box-sizing: border-box;
}
.option {
  width: calc(25% - 10rpx);
}
.option.active .option-img {
  box-shadow: 0 0 0 4rpx var(--nb-primary, #c45c26);
}
.option-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16rpx;
  background: #f5f5f5;
}
.upload-btn {
  margin-top: 12rpx;
  background: var(--nb-primary-soft, #fff5ef);
  color: var(--nb-primary, #c45c26);
}
.tap-hint {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #aaa);
}
</style>
