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
 * - 默认值本身、加载后的字段归一化（merge）仍是调用方的语义决策，作为
 *   参数传入
 *
 * 配置的公开性不在这里也不在调用方：那是后端 publicConfigKeys 白名单
 * 决定的访问控制规则，请求体已经没有 isPublic 这个字段。
 *
 * 适用「页面私有、本地 ref 即数据源」的配置表单（SMTP、人机验证）。
 * 状态住在全局 store、前台也要读的配置（公告、Hero）不适用，别硬套。
 */
export function useConfigForm<TValue extends object>(
  configKey: TConfigKey,
  defaults: TValue,
  options?: {
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
   * 拉取配置。成功落到真实值；「配置不存在」= 从未配置过（可能跳过了
   * setup 步骤），落回默认值——这两种情况都置 isLoaded。
   * 其他失败（网络/5xx）维持 loading 态并 toast：表单和保存按钮都藏在
   * isLoaded 后面，杜绝用户拿着默认值一次保存、把库里已存配置整份覆盖
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
      isLoaded.value = true;
    } catch (error) {
      if (error === "配置不存在") {
        isLoaded.value = true;
        return;
      }
      useToast.error(t("api.errors.配置加载失败"));
    }
  };

  /**
   * 保存当前表单并自带成功/失败 toast，返回是否成功，
   * 调用方据此做保存后的联动（如刷新前台公开配置缓存）
   */
  const save = async () => {
    // 加载失败时 isLoaded 不会置位、保存按钮也不会渲染，这里再兜一道：
    // 默认值永远没有机会写库
    if (!isLoaded.value) return false;
    isSaving.value = true;
    try {
      // 泛型 TValue 无法静态收敛到 ConfigUpsertDTO 的某个 union 成员，
      // 调用方已用对应 DTO 的 configValue 类型标注过 TValue，这里收窄是安全的
      await upsertConfig({
        configKey,
        configValue: formData.value,
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
