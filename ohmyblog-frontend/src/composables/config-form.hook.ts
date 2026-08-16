// src/composables/config-form.hook.ts
import { ref, type Ref } from "vue";
import { getConfig, upsertConfig } from "@/api/config.api";
import type { TConfigKey } from "@/api/shared";
import type { TConfigUpsertDTO } from "@server/dtos/config.dto";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";

/**
 * 设置页配置表单的通用读写机制。
 *
 * 收敛的是机制，不是语义：
 * - 「404 = 还没配置过 = 保持调用方传入的默认值」这条约定只在这一处实现。
 *   手写样板的年代各表单自己抄这段逻辑，SMTP 就抄错过一次——默认值写成
 *   true，导致从未配置过的开关显示为开启
 * - 默认值本身、加载后的字段归一化（merge）、敏感配置的 isPublic 仍是
 *   调用方的语义决策，作为参数传入
 *
 * 适用「页面私有、本地 ref 即数据源」的配置表单（SMTP、人机验证）。
 * 状态住在全局 store、前台也要读的配置（公告、Hero）不适用，别硬套。
 */
export function useConfigForm<TValue extends object>(
  configKey: TConfigKey,
  defaults: TValue,
  options?: {
    /** 敏感配置（含密钥/密码）传 false；省略则不随本次保存改动该字段 */
    isPublic?: boolean;
    /**
     * 加载成功后的归一化，返回值直接成为新的表单值。
     * 默认浅合并（{...表单默认值, ...接口值}）；嵌套结构需要逐字段
     * 兜底（如人机验证的 credentials）时用这个接管
     */
    merge?: (loaded: any, defaults: TValue) => TValue;
  },
) {
  const { t } = useLang();

  // 深拷贝默认值：defaults 是调用方声明的字面量，不拷贝的话组件多次
  // 挂载（路由切换、热更新）会共享并污染同一份嵌套对象
  const formData = ref(structuredClone(defaults)) as Ref<TValue>;
  const isLoaded = ref(false);
  const isSaving = ref(false);

  /**
   * 拉取配置。404（还没配置过）或请求失败都保持默认值不变，
   * 但无论成败都置 isLoaded，让开关从 loading 占位落到确定状态
   */
  const load = async () => {
    try {
      const res = await getConfig(configKey);
      const value = res?.config?.configValue;
      if (value) {
        formData.value = options?.merge
          ? options.merge(value, structuredClone(defaults))
          : { ...formData.value, ...value };
      }
    } catch {
      // 404 = 还没配置过，用默认值即可
    } finally {
      isLoaded.value = true;
    }
  };

  /**
   * 保存当前表单并自带成功/失败 toast，返回是否成功，
   * 调用方据此做保存后的联动（如刷新前台公开配置缓存）
   */
  const save = async () => {
    isSaving.value = true;
    try {
      // 泛型 TValue 无法静态收敛到 ConfigUpsertDTO 的某个 union 成员，
      // 调用方已用对应 DTO 的 configValue 类型标注过 TValue，这里收窄是安全的
      await upsertConfig({
        configKey,
        configValue: formData.value,
        ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
      } as TConfigUpsertDTO);
      useToast.success(t("api.success.保存成功"));
      return true;
    } catch (error: any) {
      useToast.error(t(`api.errors.${error}`));
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  return { formData, isLoaded, isSaving, load, save };
}
