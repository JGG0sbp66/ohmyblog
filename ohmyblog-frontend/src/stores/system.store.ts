// src/stores/system.store.ts
import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { getHealth } from "@/api/health.api";
import { getConfig } from "@/api/config.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import { onPreviewDraft } from "@/composables/preview-bridge.hook";
import type { TConfigKey } from "@/api/shared";
import type {
  TSiteInfoConfigUpsertDTO,
  TPersonalInfoConfigUpsertDTO,
  TAnnouncementConfigUpsertDTO,
} from "@server/dtos/config.dto";

export const useSystemStore = defineStore("system", () => {
  const { t } = useLang();

  const version = ref("");
  const commit = ref("");
  const initialized = ref<boolean | null>(null);
  // 演示模式是否生效（后端已把「开关打开 && 系统已初始化」合并成这一个值）
  const demo = ref(false);

  // 站点全局配置
  const siteInfo = ref<TSiteInfoConfigUpsertDTO["configValue"]>({
    title: "",
    favicon: "",
    footer: "",
    footerTitle: "",
    footerSlogan: "",
    icp: "",
    footerLinks: [],
  });

  // 站点创建时间（取自 site_info 配置的 createdAt 表字段）
  const siteCreatedAt = ref<Date | string>("");

  // 个性化配置 (Hero, 头像, 简介, 显示名称等)
  //
  // heroEnabled 默认 true：这个开关是后加的，存量配置里没有这个字段，
  // fetchConfig 的展开合并不会覆盖它，于是老站点保持「有图就显示」的原样。
  const personalInfo = ref<TPersonalInfoConfigUpsertDTO["configValue"]>({
    username: "",
    avatar: "",
    bio: "",
    socialLinks: [],
    hero: "",
    heroEnabled: true,
    heroTitle: "",
    heroSubtitles: [],
  });

  /**
   * 首页横幅是否真的会渲染出来 —— 有图，且开关没关。
   *
   * 放在 store 而不是各自组件里算，是因为这个判断有两个消费方，且必须一致：
   * HeroSection 用它决定渲不渲染，MainLayout 用它决定正文的上边距
   * （横幅带 -mb-28 负边距把正文往上拉，没有横幅时正文得自己补 mt-28 让开固定头部）。
   * 两边各写一份的代价是真实的：加开关时只改了 HeroSection，MainLayout 还在看
   * personalInfo.hero，于是「有图但关掉开关」时横幅没了、负边距的补偿却还在，
   * 正文整体上移一截、首篇文章标题被头部盖掉。
   *
   * 显式判 !== false 而不是取真值：heroEnabled 在 DTO 里是可选的，
   * 存量配置读出来是 undefined，必须按「开启」解释。
   */
  const heroVisible = computed(
    () => !!personalInfo.value.hero && personalInfo.value.heroEnabled !== false,
  );

  // 侧边栏公告（未配置过时后端返回 404，保持 enabled=false 即可）
  const announcement = ref<TAnnouncementConfigUpsertDTO["configValue"]>({
    enabled: false,
    title: "",
    content: "",
  });

  /**
   * 通用配置获取辅助函数
   * @returns 原始响应，调用方可按需取表级字段（如 createdAt）
   */
  async function fetchConfig(
    configKey: TConfigKey,
    target: any,
    errorMsgMask: string,
  ) {
    try {
      const res = await getConfig(configKey);
      if (res?.config?.configValue) {
        target.value = {
          ...target.value,
          ...res.config.configValue,
        };
      }
      return res;
    } catch (error: any) {
      // "配置不存在" 是正常状态（用户可能跳过了某个 setup 步骤），静默忽略
      if (error === "配置不存在") return null;

      if (initialized.value == null || initialized.value) {
        useToast.error(t(errorMsgMask));
      }
      return null;
    }
  }

  /**
   * 获取站点基本信息
   */
  async function fetchSiteInfo() {
    const res = await fetchConfig(
      "site_info",
      siteInfo,
      "api.errors.获取站点基本信息失败",
    );
    if (res?.config) {
      siteCreatedAt.value = res.config.createdAt;
    }
  }

  /**
   * 获取个性化配置
   */
  async function fetchPersonalInfo() {
    await fetchConfig(
      "personal_info",
      personalInfo,
      "api.errors.获取个性化配置失败",
    );
  }

  /**
   * 身处后台预览 iframe 且已收到草稿
   * 此后服务端的已保存值不该再覆盖草稿（拉取是异步的，可能晚于草稿到达）
   */
  let announcementDraftLocked = false;

  // 后台外观页正在编辑公告时，实时把草稿同步进预览 iframe（非 iframe 环境下是空操作）
  onPreviewDraft((draft) => {
    if (!draft.announcement) return;
    announcementDraftLocked = true;
    announcement.value = { ...announcement.value, ...draft.announcement };
  });

  /**
   * 获取侧边栏公告配置
   */
  async function fetchAnnouncement() {
    if (announcementDraftLocked) return;
    await fetchConfig("announcement", announcement, "api.errors.获取公告失败");
  }

  // 监听标题变化，全局同步 document.title
  watch(
    () => siteInfo.value.title,
    (newTitle) => {
      if (newTitle) {
        document.title = newTitle;
      }
    },
    { immediate: true },
  );

  // 监听图标变化，全局同步 favicon
  watch(
    () => siteInfo.value.favicon,
    (newFavicon) => {
      if (newFavicon) {
        const favicon = document.getElementById(
          "dynamic-favicon",
        ) as HTMLLinkElement;
        if (favicon) {
          favicon.href = newFavicon;
        }
      }
    },
    { immediate: true },
  );

  /**
   * 获取并检查系统健康状态
   * @param forceRefresh 是否强制刷新, 不使用缓存
   * @returns 返回最新的初始化状态
   */
  async function checkStatus(forceRefresh = false) {
    // 仅当已确认初始化为 true 时使用缓存。
    // initialized=false 可能在 setup 完成后很快变为 true，需重新请求避免路由守卫读到旧值。
    if (initialized.value === true && !forceRefresh) {
      return initialized.value;
    }

    try {
      const data = await getHealth();

      if (!data || typeof data.initialized !== "boolean") {
        throw new Error("后端返回的健康状态数据格式不正确");
      }
      version.value = data.version;
      commit.value = data.commit;
      initialized.value = data.initialized;
      demo.value = data.demo === true;

      return initialized.value;
    } catch (error) {
      useToast.error(t("api.errors.系统健康检查失败"));
      // 如果失败了，默认返回当前状态或 false，防止路由死锁
      return initialized.value ?? false;
    }
  }

  return {
    version,
    commit,
    initialized,
    demo,
    siteInfo,
    siteCreatedAt,
    personalInfo,
    heroVisible,
    announcement,
    fetchSiteInfo,
    fetchPersonalInfo,
    fetchAnnouncement,
    checkStatus,
  };
});
