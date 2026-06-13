/** uni-app input/textarea 事件取值（H5 与小程序统一） */
export function uniInputValue(e: unknown): string {
  if (typeof e === 'string') return e;
  const ev = e as {
    detail?: { value?: string };
    target?: { value?: string };
  };
  if (ev.detail?.value != null) return String(ev.detail.value);
  if (ev.target?.value != null) return String(ev.target.value);
  const inputEvent = e as InputEvent;
  if (inputEvent?.target && 'value' in inputEvent.target) {
    return String((inputEvent.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
  return '';
}
