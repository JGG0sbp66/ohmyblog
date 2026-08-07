<!-- src/views/main/pages/NotFound.page.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useTyping } from "@/composables/typing.hook";
import BaseCard from "@/components/base/card/BaseCard.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Stamp from "@/components/common/item/Stamp.vue";

const router = useRouter();
const { t, tm, rt, locale } = useLang();

// --- 随机档案编号（A-Z + 0-9，4 位） ---
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const archiveCode = Array.from(
  { length: 4 },
  () => CHARS[Math.floor(Math.random() * CHARS.length)],
).join("");

// --- 幽灵文案池 ---
/** 语言包里 ghosts 是对象数组，t 取不到，需用 tm 拿原始节点再逐个 rt 解析 */
const ghosts = computed(() => {
  const raw = tm("views.main.notFound.ghosts") as {
    title: string;
    body: string;
  }[];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({ title: rt(item.title), body: rt(item.body) }));
});

// 进入页面时随机锁定一组：切换语言只换语种，不换内容
const ghostIndex = Math.floor(Math.random() * ghosts.value.length);
const ghost = computed(() => ghosts.value[ghostIndex]);

// --- 来源行 ---
/** 与文案组各自独立随机，组合数更多；纯字符串数组，rt 解析即可 */
const sources = computed(() => {
  const raw = tm("views.main.notFound.sources") as string[];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => rt(item));
});
const sourceIndex = Math.floor(Math.random() * sources.value.length);
const source = computed(() => sources.value[sourceIndex] ?? "");

// --- 打字机：标题先打完，再交给正文 ---
const titleTyping = useTyping(78, 22);
const bodyTyping = useTyping(30, 10);

/** 光标所在位置：同一时刻只有一个光标在闪 */
type TCaret = "title" | "body" | "done";
const caret = ref<TCaret>("title");

// 打完后光标停在正文末尾，保留「这份文档还没写完」的感觉
const showTitleCaret = computed(() => caret.value === "title");
const showBodyCaret = computed(() => caret.value !== "title");

// 每次重播自增，用于让被打断的旧流程在 await 之后自行退出（切语言会重播）
let runId = 0;

const play = async () => {
  const id = ++runId;
  const current = ghost.value;
  if (!current) return;

  caret.value = "title";
  await titleTyping.type(current.title, 400);
  if (id !== runId) return;

  // 标题一打完就把光标交给正文，中间 300ms 空档不会出现「两边都没光标」
  caret.value = "body";
  await bodyTyping.type(current.body, 300);
  if (id !== runId) return;

  caret.value = "done";
};

onMounted(() => {
  void play();
});

// 切换语言时用新语种重播同一组文案
watch(locale, () => {
  titleTyping.reset();
  bodyTyping.reset();
  void play();
});

onUnmounted(() => {
  runId++;
  titleTyping.reset();
  bodyTyping.reset();
});
</script>

<template>
  <!-- flex-1：吃满 MainLayout 让出的剩余高度，卡片在其中垂直居中。
       不用 min-h-[Nvh]，那是叠加在 header/footer 之上的，会把整页顶出滚动条 -->
  <div class="flex flex-1 items-center justify-center px-4 onload-animation">
    <BaseCard padding="none" class="max-w-xl relative overflow-hidden">
      <!-- ====== 上半区：档案信息 + 标题 + 印章 ====== -->
      <div class="p-8 pb-6">
        <Stamp :subtext="t('views.main.notFound.stampSubtext')" />

        <!-- 档案编号 -->
        <div class="mb-6">
          <BaseTag type="info" :show-icon="false" class="tracking-widest">
            {{ t("views.main.notFound.archiveNo", { code: archiveCode }) }}
          </BaseTag>
        </div>

        <!-- 标题（打字机） -->
        <h1 class="text-2xl font-bold text-fg leading-relaxed min-h-[2.5rem]">
          {{ titleTyping.displayText
          }}<span
            v-if="showTitleCaret"
            class="typing-caret inline-block w-[3px] h-[1.1em] ml-[3px] rounded-[1px] bg-fg align-[-0.12em]"
          />
        </h1>

        <!-- 来源行 -->
        <p class="mt-2 text-xs text-fg-soft">
          {{ source }}
        </p>
      </div>

      <!-- ====== 分割线（虚线撕线） ====== -->
      <div class="mx-8 border-t border-dashed border-border" />

      <!-- ====== 下半区：正文 + 导航 ====== -->
      <div class="p-8 pt-6">
        <!-- 正文（打字机） -->
        <p class="text-sm text-fg-muted leading-relaxed min-h-[3.5rem]">
          {{ bodyTyping.displayText
          }}<span
            v-if="showBodyCaret"
            class="typing-caret inline-block w-[3px] h-[1.1em] ml-[3px] rounded-[1px] bg-fg align-[-0.12em]"
          />
        </p>

        <!-- 导航按钮 -->
        <div class="flex items-center gap-3 mt-8">
          <ButtonPrimary
            :text="t('views.main.notFound.backHome')"
            @click="router.push({ name: 'home' })"
          />
          <ButtonSecondary
            :text="t('views.main.notFound.backPrev')"
            class="py-2"
            @click="router.back()"
          >
            <ArrowLeft class="w-4 h-4" />
          </ButtonSecondary>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<!-- 光标的几何与配色走 Tailwind，闪烁走全局的 .typing-caret（见 css/animations.css），
     本页不再需要 scoped 样式 -->
