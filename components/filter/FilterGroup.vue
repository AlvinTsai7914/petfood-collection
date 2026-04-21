<script setup lang="ts">
interface Option {
  value: string
  label: string
  count?: number
}

const props = defineProps<{
  title: string
  options: Option[]
  modelValue: string[]
  threshold?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>()

const threshold = computed(() => props.threshold ?? 10)
const expanded = ref(false)

const canCollapse = computed(() => props.options.length > threshold.value)
const visibleOptions = computed(() =>
  expanded.value ? props.options : props.options.slice(0, threshold.value)
)

const isChecked = (v: string) => props.modelValue.includes(v)

const toggle = (v: string, checked: boolean) => {
  emit('update:modelValue', checked
    ? [...props.modelValue, v]
    : props.modelValue.filter(x => x !== v))
}
</script>

<template>
  <section class="py-4">
    <header class="mb-3 flex items-baseline justify-between">
      <h3 class="text-caption font-medium uppercase tracking-widest text-neutral-500">
        {{ title }}
      </h3>
      <span
        v-if="modelValue.length > 0"
        class="font-mono text-caption tabular-nums text-accent"
      >
        {{ modelValue.length }}
      </span>
    </header>

    <ul class="space-y-0.5">
      <li v-for="opt in visibleOptions" :key="opt.value">
        <FilterCheckbox
          :label="opt.label"
          :value="opt.value"
          :count="opt.count"
          :model-value="isChecked(opt.value)"
          @update:model-value="toggle(opt.value, $event)"
        />
      </li>
    </ul>

    <button
      v-if="canCollapse"
      class="mt-2 text-caption text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : `顯示更多 (+${options.length - threshold})` }}
    </button>
  </section>
</template>
