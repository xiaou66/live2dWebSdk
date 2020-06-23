/**
 * Copyright(c) Live2D Inc. All rights reserved.
 * Copyright(c) Live2D Inc. 保留所有权利。
 *
 * 本源码的使用受Live2D开放软件许可证的约束。
 * 可在 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */


import { LogLevel } from '@framework/live2dcubismframework';

/**
 * Sample Appで使用する定数
 * 应用程序中使用的常量
 */
// 画面
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 相对路径
// 支持网络地址
export const ResourcesPath = 'https://cdn.jsdelivr.net/gh/xiaou520/Live2d-model@v0.0.1/';

// 模型后面的背景图片文件
export const BackImageName = 'back_class_normal.png';

// 歯車  齿轮。
// export const GearImageName = 'icon_gear.png';

// 退场键
// export const PowerImageName = 'CloseNormal.png';

// 模型定义---------------------------------------------
// 模型所在的目录名称的数组。
// ディレクトリ名とmodel3.jsonの名前を一致させておくこと
// 目录名称必须与model3.json的名称一致。
export const ModelDir: string[] = ['Hiyori','kesshouban'];
export const ModelDirSize: number = ModelDir.length;

// 与外部定义文件(json)结合。
export const MotionGroupIdle = 'Idle'; // アイドリング 空转 空闲
export const MotionGroupTapBody = 'TapBody'; // 点击身体。
export const MotionGroupTapHead = 'TapHead';

// 外部定義ファイル（json）と合わせる 与外部定义文件(json)结合。
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// 运动优先权常数
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// 调试日志的显示选项
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// 设置框架的日志输出水平。
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 默认渲染目标尺寸
// export const RenderTargetWidth = 10000;
// export const RenderTargetHeight = 100;
