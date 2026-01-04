// src/stores/system.store.ts
import { defineStore } from "pinia";
import { getHealth } from "@/api/health.api";
import { useToast } from "@/composables/toast.hook";

interface SystemState {
    version: string;
    initialized: boolean | null;
}

export const useSystemStore = defineStore("system", {
    state: (): SystemState => ({
        version: "",
        initialized: null,
    }),

    actions: {
        /**
         * 获取并检查系统健康状态
         * @param forceRefresh 是否强制刷新, 不使用缓存
         * @returns 返回最新的初始化状态
         */
        async checkStatus(forceRefresh = false) {
            // 如果已经初始化过且不强制刷新, 直接返回缓存的状态
            if (this.initialized !== null && !forceRefresh) {
                return this.initialized;
            }

            try {
                const data = await getHealth();

                if (!data || typeof data.initialized !== "boolean") {
                    throw new Error("后端返回的健康状态数据格式不正确");
                }
                this.version = data.version;
                this.initialized = data.initialized;

                return this.initialized;
            } catch (error) {
                console.error("Store 中获取系统状态失败:", error);
                useToast.error("系统健康检查失败");
                // 如果失败了，默认返回当前状态或 false，防止路由死锁
                return this.initialized ?? false;
            }
        },
    },
});
