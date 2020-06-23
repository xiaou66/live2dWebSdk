/**
 * Copyright(c) Live2D Inc. All rights reserved.
 * Copyright(c) Live2D Inc. 保留所有权利。
 *
 * 本源码的使用受Live2D开放软件许可证的约束。
 * 可在 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */


import { Live2DCubismFramework as cubismjson } from './utils/cubismjson';
import { Live2DCubismFramework as cubismidmanager } from './id/cubismidmanager';
import { Live2DCubismFramework as cubismrenderer } from './rendering/cubismrenderer';
import {
  CubismLogInfo,
  CubismLogWarning,
  CSM_ASSERT
} from './utils/cubismdebug';
import Value = cubismjson.Value;
import CubismIdManager = cubismidmanager.CubismIdManager;
import CubismRenderer = cubismrenderer.CubismRenderer;

export function strtod(s: string, endPtr: string[]): number {
  let index = 0;
  for (let i = 1; ; i++) {
    const testC: string = s.slice(i - 1, i);

    // 因为有指数·负数的可能性，所以跳过
    if (testC == 'e' || testC == '-' || testC == 'E') {
      continue;
    } // 扩大字符串的范围

    const test: string = s.substring(0, i);
    const number = Number(test);
    if (isNaN(number)) {
      // 因为它不能被识别为数字，所以它结束了。
      break;
    } // 最后存储作为数值形成的index。

    index = i;
  }
  let d = parseFloat(s); // 解析后的数值

  if (isNaN(d)) {
    // 因为它不能被识别为数字，所以它结束了。
    d = NaN;
  }

  endPtr[0] = s.slice(index); // 后续的字符串
  return d;
}

export namespace Live2DCubismFramework {
  //初始化文件作用域中的变量

  let s_isStarted = false;
  let s_isInitialized = false;
  let s_option: Option = null;
  let s_cubismIdManager: CubismIdManager = null;

  /**
   * Framework中使用的常量声明
   */
  export namespace Constant {
    export const vertexOffset = 0; // メッシュ頂点のオフセット値 网格顶点的偏移值
    export const vertexStep = 2; // メッシュ頂点のステップ値 网格顶点的步长值
  }

  export function csmDelete<T>(address: T): void {
    if (!address) {
      return;
    }

    address = void 0;
  }

  /**
   * Live2D Cubism SDK Original Workflow SDKのエントリポイント
   * 利用開始時はCubismFramework.initialize()を呼び、CubismFramework.dispose()で終了する。
   * Live2D立体主义SDK 原创工作流SDK切入点
   * 当你开始使用它时，调用CubismFramework.initialize()和 用CubismFramework.dispose()退出
   */
  export class CubismFramework {
    /**
     * Cubism FrameworkのAPIを使用可能にする。
     *  APIを実行する前に必ずこの関数を実行すること。
     *  一度準備が完了して以降は、再び実行しても内部処理がスキップされます。
     *   启用Cubism框架API。
     *   在执行API之前，一定要运行这个函数。
     *   准备工作完成后，再次运行它将跳过内部处理。
     *
     * @param    option      Option类的实例
     *
     *
     * @return  当准备过程完成后返回True。
     */
    public static startUp(option: Option = null): boolean {
      if (s_isStarted) {
        CubismLogInfo('CubismFramework.startUp() is already done.');
        return s_isStarted;
      }

      s_option = option;

      if (s_option != null) {
        Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
      }

      s_isStarted = true;

      // Live2D Cubism Coreバージョン情報を表示 查看Live2D立体主义核心版信息
      if (s_isStarted) {
        const version: number = Live2DCubismCore.Version.csmGetVersion();
        const major: number = (version & 0xff000000) >> 24;
        const minor: number = (version & 0x00ff0000) >> 16;
        const patch: number = version & 0x0000ffff;
        const versionNumber: number = version;

        CubismLogInfo(
          `Live2D Cubism Core version: {0}.{1}.{2} ({3})`,
          ('00' + major).slice(-2),
          ('00' + minor).slice(-2),
          ('0000' + patch).slice(-4),
          versionNumber
        );
      }

      CubismLogInfo('CubismFramework.startUp() is complete.');

      return s_isStarted;
    }

    /**
     * StartUp()で初期化したCubismFrameworkの各パラメータをクリアします。
     * 清除由StartUp()初始化的CubismFramework的每个参数。
     * Dispose()したCubismFrameworkを再利用する際に利用してください。
     * 请在再次利用已Dispose的CubismFramework时使用。
     */
    public static cleanUp(): void {
      s_isStarted = false;
      s_isInitialized = false;
      s_option = null;
      s_cubismIdManager = null;
    }

    /**
     * Cubism Framework内のリソースを初期化してモデルを表示可能な状態にします。<br>
     *     初始化Cubism Framework中的资源，使模型可以查看。
     *     再度Initialize()するには先にDispose()を実行する必要があります。
     *     为了再次初始化()，必须先运行Dispose()。
     */
    public static initialize(): void {
      CSM_ASSERT(s_isStarted);
      if (!s_isStarted) {
        CubismLogWarning('CubismFramework is not started.');
        return;
      }

      // --- s_isInitializedによる連続初期化ガード 通过s_isInitialized防止连续初始化。 ---
      // 連続してリソース確保が行われないようにする。 确保资源不连续。
      // 再度Initialize()するには先にDispose()を実行する必要がある。 如果你想再次初始化()，需要先执行Dispose()。
      if (s_isInitialized) {
        CubismLogWarning(
          'CubismFramework.initialize() skipped, already initialized.'
        );
        return;
      }

      //---- static 初期化 ----
      Value.staticInitializeNotForClientCall();

      s_cubismIdManager = new CubismIdManager();

      s_isInitialized = true;

      CubismLogInfo('CubismFramework.initialize() is complete.');
    }

    /**
     * Cubism Framework内の全てのリソースを解放します。
     *      ただし、外部で確保されたリソースについては解放しません。
     *      外部で適切に破棄する必要があります。
     *      释放Cubism Framework中的所有资源。
     *      但是，我们不会释放外部资源。
     *      需要在外部妥善销毁。
     */
    public static dispose(): void {
      CSM_ASSERT(s_isStarted);
      if (!s_isStarted) {
        CubismLogWarning('CubismFramework is not started.');
        return;
      }

      // --- s_isInitialized未初始化的释放保护 ---
      // 要dispose()，需要先执行initialize()。
      if (!s_isInitialized) {
        // false...リソース未確保の場合 false.。资源未确保的情况
        CubismLogWarning('CubismFramework.dispose() skipped, not initialized.');
        return;
      }

      Value.staticReleaseNotForClientCall();

      s_cubismIdManager.release();
      s_cubismIdManager = null;

      // レンダラの静的リソース（シェーダプログラム他）を解放する
      // 释放渲染器的静态资源(着色器程序等)
      CubismRenderer.staticRelease();

      s_isInitialized = false;

      CubismLogInfo('CubismFramework.dispose() is complete.');
    }

    /**
     * 是否已准备好使用Framework API
     * @return 如果您准备好使用API，则返回true。
     */
    public static isStarted(): boolean {
      return s_isStarted;
    }

    /**
     * Cubism Frameworkのリソース初期化がすでに行われているかどうか
     * 执行一个绑定到 Core API 的日志函数。
     * @return 如果资源分配完成，则返回True
     */
    public static isInitialized(): boolean {
      return s_isInitialized;
    }

    /**
     * Core APIにバインドしたログ関数を実行する
     *
     * @praram message ログメッセージ
     */
    public static coreLogFunction(message: string): void {
      // Return if logging not possible.
      if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
        return;
      }

      Live2DCubismCore.Logging.csmGetLogFunction()(message);
    }

    /**
     * 返回当前日志输出级别设置的值。
     *
     * @return 当前日志输出级别设置值
     */
    public static getLoggingLevel(): LogLevel {
      if (s_option != null) {
        return s_option.loggingLevel;
      }
      return LogLevel.LogLevel_Off;
    }

    /**
     * 获取ID管理器的实例
     * @return CubismManager类的实例
     */
    public static getIdManager(): CubismIdManager {
      return s_cubismIdManager;
    }

    /**
     * 私有化构造器
     * 用作静态类
     * 不要实例化
     */
    private constructor() {}
  }
}

export class Option {
  logFunction: Live2DCubismCore.csmLogFunction; // 日志输出的功能对象
  loggingLevel: LogLevel; // 设置日志输出级别
}

/**
 * 日志输出级别
 */
export enum LogLevel {
  LogLevel_Verbose = 0, // 详细日志
  LogLevel_Debug, // 调试日志
  LogLevel_Info, // 信息日志
  LogLevel_Warning, // 警告日志
  LogLevel_Error, // 错误日志
  LogLevel_Off // 日志输出禁用
}
