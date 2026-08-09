<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import { ListFilter } from "lucide-vue-next";
import { RiCheckLine } from "@remixicon/vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BaseSheet from "@/components/base/pop/BaseSheet.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import { useIsMobile } from "@/composables/breakpoint.hook";

export interface GroupedSelectItem {
  value: string;
  label: string;
  icon?: Component;
  iconClass?: string;
}

export interface GroupedSelectGroup {
  key: string;
  label?: string;
  items: GroupedSelectItem[];
}

const props = defineProps<{
  modelValue?: string | null;
  label: string;
  allLabel: string;
  groups: GroupedSelectGroup[];
  mobileTitle?: string;
  mobileDescription?: string;
  closeLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
}>();

const isMobile = useIsMobile();
const mobileOpen = ref(false);
const dropRef = ref<InstanceType<typeof DropButton> | null>(null);

const items = computed(() => props.groups.flatMap((group) => group.items));
const selected = computed(() =>
  items.value.find((item) => item.value === props.modelValue),
);
const hasSelection = computed(() => Boolean(selected.value));

const select = (value: string | undefined) => {
  emit("update:modelValue", value);
  mobileOpen.value = false;
  dropRef.value?.close();
};
</script>

<template>
  <DropButton
    v-if="!isMobile"
    ref="dropRef"
    content-class="w-64 rounded-xl p-2"
    placement="right-0"
    pop-offset="mt-2"
    bridge-height="h-2"
    trigger-class="w-fit"
  >
    <template #trigger="{ active }">
      <ButtonSecondary
        class="h-10! max-w-44! px-3! text-sm!"
        :is-active="active || hasSelection"
        :text="selected?.label ?? label"
      >
        <component
          :is="selected?.icon ?? ListFilter"
          :class="['h-4 w-4 shrink-0', selected?.iconClass]"
        />
      </ButtonSecondary>
    </template>

    <template #content>
      <div class="flex flex-col gap-1">
        <ButtonSecondary
          class="w-full! justify-start! gap-2.5! px-2.5! py-2!"
          :is-active="!hasSelection"
          :text="allLabel"
          @mousedown.prevent="select(undefined)"
        >
          <ListFilter class="h-4 w-4 shrink-0" />
          <template #suffix>
            <RiCheckLine v-if="!hasSelection" class="h-4 w-4 text-accent" />
          </template>
        </ButtonSecondary>

        <template v-for="group in groups" :key="group.key">
          <div
            v-if="group.label"
            class="mt-1 px-1.5 pb-0.5 text-xs text-fg-soft select-none"
          >
            {{ group.label }}
          </div>
          <ButtonSecondary
            v-for="item in group.items"
            :key="item.value"
            class="w-full! justify-start! gap-2.5! px-2.5! py-2!"
            :is-active="modelValue === item.value"
            :text="item.label"
            @mousedown.prevent="select(item.value)"
          >
            <component
              :is="item.icon"
              :class="['h-4 w-4 shrink-0', item.iconClass]"
            />
            <template #suffix>
              <RiCheckLine
                v-if="modelValue === item.value"
                class="h-4 w-4 text-accent"
              />
            </template>
          </ButtonSecondary>
        </template>
      </div>
    </template>
  </DropButton>

  <template v-else>
    <ButtonSecondary
      class="h-10! max-w-40! px-3! text-sm!"
      :is-active="hasSelection"
      :text="selected?.label ?? label"
      @click="mobileOpen = true"
    >
      <component
        :is="selected?.icon ?? ListFilter"
        :class="['h-4 w-4 shrink-0', selected?.iconClass]"
      />
    </ButtonSecondary>

    <BaseSheet
      v-model="mobileOpen"
      :title="mobileTitle ?? label"
      :description="mobileDescription"
      :close-label="closeLabel"
    >
      <div class="flex flex-col gap-1">
        <ButtonSecondary
          class="min-h-11! w-full! justify-start! gap-2.5! px-3! py-2!"
          :is-active="!hasSelection"
          :text="allLabel"
          @click="select(undefined)"
        >
          <ListFilter class="h-4 w-4 shrink-0" />
          <template #suffix>
            <RiCheckLine v-if="!hasSelection" class="h-4 w-4 text-accent" />
          </template>
        </ButtonSecondary>

        <template v-for="group in groups" :key="group.key">
          <div
            v-if="group.label"
            class="mt-2 px-1.5 pb-0.5 text-sm text-fg-soft select-none"
          >
            {{ group.label }}
          </div>
          <ButtonSecondary
            v-for="item in group.items"
            :key="item.value"
            class="min-h-11! w-full! justify-start! gap-2.5! px-3! py-2!"
            :is-active="modelValue === item.value"
            :text="item.label"
            @click="select(item.value)"
          >
            <component
              :is="item.icon"
              :class="['h-4 w-4 shrink-0', item.iconClass]"
            />
            <template #suffix>
              <RiCheckLine
                v-if="modelValue === item.value"
                class="h-4 w-4 text-accent"
              />
            </template>
          </ButtonSecondary>
        </template>
      </div>
    </BaseSheet>
  </template>
</template>
