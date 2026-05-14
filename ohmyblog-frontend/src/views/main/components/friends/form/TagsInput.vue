<!-- src/views/main/components/friends/form/TagsInput.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { X } from "lucide-vue-next";
import BaseInputWrapper from "@/components/base/input/BaseInputWrapper.vue";
import FieldLabel from "@/components/base/input/FieldLabel.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    label?: string;
    placeholder?: string;
    /** 最多标签数，来自后端 DTO maxItems */
    maxTags?: number;
    /** 单个标签最大字符数，来自后端 DTO items.maxLength */
    maxTagLength?: number;
  }>(),
  { modelValue: () => [], maxTags: 3, maxTagLength: 20 },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string[]): void;
}>();

const inputVal = ref("");

const charRemaining = computed(
  () => props.maxTagLength - inputVal.value.length,
);
const isOverLimit = computed(() => charRemaining.value < 0);

const addTag = () => {
  const raw = inputVal.value.trim().replace(/^#/, "");
  if (!raw) return;
  if ((props.modelValue ?? []).length >= props.maxTags) return;
  if (raw.length > props.maxTagLength) return;
  if ((props.modelValue ?? []).includes(raw)) {
    inputVal.value = "";
    return;
  }
  emit("update:modelValue", [...(props.modelValue ?? []), raw]);
  inputVal.value = "";
};

const removeTag = (tag: string) => {
  emit(
    "update:modelValue",
    (props.modelValue ?? []).filter((t) => t !== tag),
  );
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    addTag();
  }
  if (
    e.key === "Backspace" &&
    !inputVal.value &&
    (props.modelValue ?? []).length > 0
  ) {
    const tags = props.modelValue ?? [];
    emit("update:modelValue", tags.slice(0, -1));
  }
};
</script>

<template>
  <div class="flex flex-col w-full text-left">
    <FieldLabel v-if="label" :label="label" class="mb-2 px-1" />
    <BaseInputWrapper>
      <!-- 已添加的标签 + 输入框 -->
      <div class="flex flex-wrap gap-1.5 items-center px-3 py-2 flex-1 min-w-0">
        <span
          v-for="tag in modelValue"
          :key="tag"
          class="flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium"
        >
          #{{ tag }}
          <button
            type="button"
            class="ml-0.5 opacity-60 hover:opacity-100"
            @click="removeTag(tag)"
          >
            <X class="w-2.5 h-2.5" />
          </button>
        </span>
        <input
          v-if="(modelValue ?? []).length < maxTags"
          v-model="inputVal"
          type="text"
          :maxlength="maxTagLength"
          :placeholder="placeholder"
          class="flex-1 min-w-20 bg-transparent outline-none text-sm font-medium placeholder:text-fg-soft py-0.5"
          @keydown="onKeydown"
          @blur="addTag"
        />
      </div>
    </BaseInputWrapper>

    <!-- 底部：字数计数（左）+ 标签数（右） -->
    <div class="mt-1 px-1 flex justify-between text-[10px]">
      <span :class="isOverLimit ? 'text-red-500' : 'text-fg-subtle/50'">
        {{ inputVal.length }} / {{ maxTagLength }}
      </span>
      <span class="text-fg-subtle/50">
        {{ (modelValue ?? []).length }} / {{ maxTags }}
      </span>
    </div>
  </div>
</template>
