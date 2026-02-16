// src/stores/system.store.ts
import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { getHealth } from "@/api/health.api";
import { getConfig } from "@/api/config.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

export const useSystemStore = defineStore("system", () => {
  const { t } = useLang();

  const version = ref("");
  const initialized = ref<boolean | null>(null);

  // 站点全局配置
  const siteInfo = ref({
    title: "",
    favicon: "",
    footer: "",
    icp: "",
  });

  // 个性化配置 (Hero, 头像等)
  const personalInfo = ref({
    avatar: "",
    hero: "",
  });

  /**
   * 通用配置获取辅助函数
   */
  async function fetchConfig(
    configKey: string,
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
    } catch (error) {
      if (initialized.value == null || initialized.value) {
        useToast.error(t(errorMsgMask));
      }
    }
  }

  /**
   * 获取站点基本信息
   */
  async function fetchSiteInfo() {
    await fetchConfig("site_info", siteInfo, "api.errors.获取站点基本信息失败");
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
      initialized.value = data.initialized;

      return initialized.value;
    } catch (error) {
      useToast.error(t("api.errors.系统健康检查失败"));
      // 如果失败了，默认返回当前状态或 false，防止路由死锁
      return initialized.value ?? false;
    }
  }

  return {
    version,
    initialized,
    siteInfo,
    personalInfo,
    fetchSiteInfo,
    fetchPersonalInfo,
    checkStatus,
  };
});
