import { defineComponent, h } from 'vue';

/** H5 原生 input（render 直出，避免 uni-app 编译成 uni-input） */
export const H5NativeInput = defineComponent({
  name: 'H5NativeInput',
  props: {
    modelValue: { type: String, default: '' },
    type: { type: String as () => 'text' | 'tel' | 'number', default: 'text' },
    placeholder: { type: String, default: '' },
    maxlength: { type: [String, Number], default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const htmlType = props.type === 'tel' || props.type === 'number' ? 'text' : props.type;
      const inputMode = props.type === 'tel' ? 'tel' : props.type === 'number' ? 'numeric' : undefined;
      return h('input', {
        class: 'input nb-input h5-native-field',
        type: htmlType,
        inputMode,
        value: props.modelValue,
        placeholder: props.placeholder,
        maxlength: props.maxlength,
        onInput: (e: Event) => {
          emit('update:modelValue', (e.target as HTMLInputElement).value);
        },
      });
    };
  },
});
