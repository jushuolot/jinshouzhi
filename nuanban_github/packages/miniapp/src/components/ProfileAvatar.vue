<template>
  <view class="profile-avatar" :class="{ editable }" @tap="onTap">
    <image v-if="displayUrl" :src="displayUrl" class="img" mode="aspectFill" />
    <text v-else class="char">{{ fallbackChar }}</text>
    <view v-if="editable" class="camera-badge">
      <text class="camera-icon">📷</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoleStore } from '../store/role';
import { chooseAndUploadAvatar } from '../utils/avatar';
import { pbErrorMessage } from '../utils/request';

const props = withDefaults(
  defineProps<{
    avatarUrl?: string;
    name?: string;
    size?: 'md' | 'lg';
    editable?: boolean;
  }>(),
  { size: 'lg', editable: true },
);

const emit = defineEmits<{ change: [url: string] }>();

const roleStore = useRoleStore();
const localUrl = ref('');

const displayUrl = computed(
  () => localUrl.value || props.avatarUrl || roleStore.user?.avatarUrl || '',
);

const fallbackChar = computed(() => {
  const n = props.name || roleStore.user?.nickname || '用';
  return n.slice(0, 1);
});

watch(
  () => props.avatarUrl,
  (v) => {
    if (v) localUrl.value = v;
  },
  { immediate: true },
);

async function onTap() {
  if (!props.editable) return;
  try {
    const url = await chooseAndUploadAvatar();
    localUrl.value = url;
    emit('change', url);
    uni.showToast({ title: '头像已更新', icon: 'success' });
  } catch (e) {
    const msg = pbErrorMessage(e);
    if (msg && !msg.includes('cancel')) {
      uni.showToast({ title: msg, icon: 'none' });
    }
  }
}
</script>

<style scoped>
.profile-avatar {
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: var(--nb-primary, #c45c26);
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-avatar.lg {
  width: 100rpx;
  height: 100rpx;
}
.profile-avatar.md {
  width: 80rpx;
  height: 80rpx;
}
.img {
  width: 100%;
  height: 100%;
}
.char {
  color: #fff;
  font-size: 40rpx;
  font-weight: 600;
}
.profile-avatar.md .char {
  font-size: 32rpx;
}
.editable .camera-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-icon {
  font-size: 20rpx;
  line-height: 1;
}
</style>
