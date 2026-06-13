const DEMO = { lat: 31.2304, lng: 121.4737, label: '演示定位（上海）' };

export async function getLocationWithFallback(timeoutMs = 3000) {
  try {
    const loc = await Promise.race([
      new Promise<UniApp.GetLocationSuccess>((resolve, reject) => {
        uni.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('location timeout')), timeoutMs);
      }),
    ]);
    return {
      lat: loc.latitude,
      lng: loc.longitude,
      label: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
      isDemo: false,
    };
  } catch {
    return { ...DEMO, isDemo: true };
  }
}
