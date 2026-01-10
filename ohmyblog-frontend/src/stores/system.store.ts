// src/stores/system.store.ts
import { ref } from "vue";
import { defineStore } from "pinia";
import { getHealth } from "@/api/health.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

export const useSystemStore = defineStore("system", () => {
    const { t } = useLang();

    const version = ref("");
    const initialized = ref<boolean | null>(null);

    /**
     * 获取并检查系统健康状态
     * @param forceRefresh 是否强制刷新, 不使用缓存
     * @returns 返回最新的初始化状态
     */
    async function checkStatus(forceRefresh = false) {
        // 如果已经初始化过且不强制刷新, 直接返回缓存的状态
        if (initialized.value !== null && !forceRefresh) {
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
        checkStatus,
    };
});
