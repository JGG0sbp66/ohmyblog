<!-- src/views/main/pages/NotFound.page.vue -->
<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

const router = useRouter();
const { t } = useLang();
</script>

<template>
  <!-- 统一的 404 页面：全局路由未匹配与文章不存在均落到这里 -->
  <div
    class="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center onload-animation"
  >
    <!-- 大号 404 数字，使用品牌色，随主题色相联动 -->
    <p
      class="text-8xl font-black text-accent/80 select-none leading-none"
      aria-hidden="true"
    >
      404
    </p>

    <div class="flex flex-col gap-2">
      <h1 class="text-lg font-bold text-fg">
        {{ t("views.main.notFound.title") }}
      </h1>
      <p class="text-sm text-fg-muted">
        {{ t("views.main.notFound.description") }}
      </p>
    </div>

    <div class="flex items-center gap-3">
      <ButtonPrimary
        :text="t('views.main.notFound.backHome')"
        @click="router.push({ name: 'home' })"
      />
      <ButtonSecondary
        :text="t('views.main.notFound.backPrev')"
        @click="router.back()"
      >
        <ArrowLeft class="w-4 h-4" />
      </ButtonSecondary>
    </div>
  </div>
</template>
