/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Live2DCubismFramework as cubismMatrix44 } from '@framework/math/cubismmatrix44';
import { Live2DCubismFramework as cubismviewmatrix } from '@framework/math/cubismviewmatrix';
import Csm_CubismViewMatrix = cubismviewmatrix.CubismViewMatrix;
import Csm_CubismMatrix44 = cubismMatrix44.CubismMatrix44;
import { TouchManager } from './touchmanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppDelegate, canvas, gl } from './lappdelegate';
import { LAppSprite } from './lappsprite';
import { TextureInfo } from './lapptexturemanager';
import { LAppPal } from './lapppal';
import * as LAppDefine from './lappdefine';

/**
 * 描画クラス。
 * 绘图类。
 */
export class LAppView {
  /**
   * 构造函数
   */
  constructor() {
    this._programId = null;
    this._back = null;
    this._gear = null;

    // 触摸关系的事件管理
    this._touchManager = new TouchManager();

    // 将设备坐标转换为屏幕坐标。
    this._deviceToScreen = new Csm_CubismMatrix44();

    // 用于放大/缩小屏幕显示或转换移动的矩阵
    this._viewMatrix = new Csm_CubismViewMatrix();
  }

  /**
   * 初始化。
   */
  public initialize(): void {
    const { width, height } = canvas;

    const ratio: number = height / width;
    const left: number = LAppDefine.ViewLogicalLeft;
    const right: number = LAppDefine.ViewLogicalRight;
    const bottom: number = -ratio;
    const top: number = ratio;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // 设备对应的屏幕范围。X的左端、X的右端、Y的下端、Y的上端

    const screenW: number = Math.abs(left - right);
    this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 显示范围设置
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 边际膨胀系数 最大显示范围
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 边际收缩率 最小显示范围

    // 最大显示范围
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * 解放する
   * 释放
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;
    gl.deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * 描画する。
   * 绘制。
   */
  public render(): void {
    gl.useProgram(this._programId);
    gl.flush();

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();

    live2DManager.onUpdate();
  }

  /**
   * 进行图像的初始化。
   */
  public initializeSprite(): void {
    const width: number = canvas.width;
    const height: number = canvas.height;

    const textureManager = LAppDelegate.getInstance().getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = '';

    /*// 背景画像初期化
    imageName = LAppDefine.BackImageName;

    // 非同期なのでコールバック関数を作成 创建一个回调函数，因为它是异步的
    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = textureInfo.width * 2.0;
      const fheight = height * 0.95;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    // 齿轮图像的初始化
    imageName = LAppDefine.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );*/

    // シェーダーを作成 创建着色器。
    if (this._programId == null) {
      this._programId = LAppDelegate.getInstance().createShader();
    }
  }

  /**
   * タッチされた時に呼ばれる。
   * 被触摸的时候调用
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    console.log('被触摸的时候调用')
    console.log(pointX, pointY)
    this._touchManager.touchesBegan(pointX, pointY);
    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
  }

  /**
   * タッチしているときにポインタが動いたら呼ばれる。
   * 滑动时候调用(触摸移动)
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(pointX, pointY);

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(viewX, viewY);
  }

  /**
   * タッチが終了したら呼ばれる。
   * 触摸结束后调用
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    // タッチ終了
    console.log(pointX,pointY)
    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(0.0, 0.0);
    {
      // シングルタップ 单拍
      const x: number = this._deviceToScreen.transformX(
        this._touchManager.getX()
      ); // 获取逻辑坐标转换后的坐标。
      const y: number = this._deviceToScreen.transformY(
        this._touchManager.getY()
      ); // 获取逻辑坐标变化的坐标。

      if (LAppDefine.DebugTouchLogEnable) {
        LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
      }
      live2DManager.onTap(x, y);
     /* // 你敲到齿轮上了吗？
      if (this._gear.isHit(pointX, pointY)) {
        live2DManager.nextScene();
      }*/
    }
  }

  /**
   * 将X坐标转换为View坐标。
   *
   * @param deviceX 设备X坐标
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX); // 获取逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformX(screenX); // 放大、缩小、移动后的数值
  }

  /**
   *将Y坐标转换为View坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY); // 获取逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * 将X坐标转换为屏幕坐标。
   * @param deviceX 设备X坐标
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * Y座標をScreen座標に変換する。
   * 将Y坐标转换为屏幕坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // タッチマネージャー 触控管理
  _deviceToScreen: Csm_CubismMatrix44; // 设备到屏幕矩阵
  _viewMatrix: Csm_CubismViewMatrix; // viewMatrix
  _programId: WebGLProgram; // 视图矩阵
  _back: LAppSprite; // 背景画像
  _gear: LAppSprite; // 齒輪形象
  _changeModel: boolean; // 模型切换标志
  _isClick: boolean; // 点击。
}
