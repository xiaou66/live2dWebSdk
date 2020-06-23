/**
 * Copyright(c) Live2D Inc. All rights reserved.
 * Copyright(c) Live2D Inc. 保留所有权利。
 *
 * 本源码的使用受Live2D开放软件许可证的约束。
 * 可在 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */


import { Live2DCubismFramework as cubismmatrix44 } from '@framework/math/cubismmatrix44';
import { Live2DCubismFramework as csmvector } from '@framework/type/csmvector';
import { Live2DCubismFramework as acubismmotion } from '@framework/motion/acubismmotion';
import Csm_csmVector = csmvector.csmVector;
import Csm_CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import ACubismMotion = acubismmotion.ACubismMotion;

import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { canvas } from './lappdelegate';
import * as LAppDefine from './lappdefine';

export let s_instance: LAppLive2DManager = null;

/**
 * サンプルアプリケーションにおいてCubismModelを管理するクラス
 * モデル生成と破棄、タップイベントの処理、モデル切り替えを行う。
 * 在示例应用程序中用于管理CubismModel的类。
 * 创建和销毁模型，处理点击事件，以及切换模型。
 */
export class LAppLive2DManager {
  /**
   * 返回该类的一个实例（单例）。
   * 如果实例还没有创建，则在内部创建
   *
   * @return LAppLive2DManager 类的实例
   */
  public static getInstance(): LAppLive2DManager {
    if (s_instance == null) {
      s_instance = new LAppLive2DManager();
    }

    return s_instance;
  }

  /**
   * クラスのインスタンス（シングルトン）を解放する。
   * 释放一个类的实例（单例）
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  /**
   * 現在のシーンで保持しているモデルを返す。
   * 返回当前场景中持有的模型。
   *
   * @param no 模型列表的索引值
   * @return 返回模型的一个实例。 如果索引值超出范围，则为NULL。
   */
  public getModel(no: number): LAppModel {
    if (no < this._models.getSize()) {
      return this._models.at(no);
    }

    return null;
  }

  /**
   * 释放当前场景中的所有模型
   */
  public releaseAllModel(): void {
    for (let i = 0; i < this._models.getSize(); i++) {
      this._models.at(i).release();
      this._models.set(i, null);
    }

    this._models.clear();
  }

  /**
   * 画面をドラッグした時の処理
   * 拖动画面时的处理
   *
   * @param x 画面的x坐标
   * @param y 画面的Y坐标
   */
  public onDrag(x: number, y: number): void {
    // console.log('拖动画面时的处理')
    // console.log(x,y)
    for (let i = 0; i < this._models.getSize(); i++) {
      const model: LAppModel = this.getModel(i);

      if (model) {
        model.setDragging(x, y);
      }
    }
  }

  /**
   * 画面をタップした時の処理
   * 点击屏幕时的处理
   *
   * @param x 画面的x坐标
   * @param y 画面的Y坐标
   */
  public onTap(x: number, y: number): void {
    console.log(x,y)
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    for (let i = 0; i < this._models.getSize(); i++) {
      if (this._models.at(i).hitTest(LAppDefine.HitAreaNameHead, x, y)) {
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage(
            `[APP]hit area: [${LAppDefine.HitAreaNameHead}]`
          );
        }
        this._models.at(i).setRandomExpression();
      } else if (this._models.at(i).hitTest(LAppDefine.HitAreaNameBody, x, y)) {
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage(
            `[APP]hit area: [${LAppDefine.HitAreaNameBody}]`
          );
          // @ts-ignore
          document.touchBodyHandler()
        }
        this._models
          .at(i)
          .startRandomMotion(
            LAppDefine.MotionGroupTapBody,
            LAppDefine.PriorityNormal,
            this._finishedMotion
          );
      } else {//当以上事件都不是时，我们可以在这里自定义自己的点击触发事件，x[-无穷,+无穷]  y [-无穷,+无穷]
        //代表点击的是模型的canvas所在区域
        if(this.currentPosition(x, y) === LAppDefine.HitAreaNameHead){
          //这里是头部区域，在下方设置对应表情动作
          //这个常量是我自己定义的，忘记加上了
          this._models.at(i).startRandomMotion(LAppDefine.MotionGroupTapHead, LAppDefine.PriorityNormal);
        }else {
          //这里是身体区域，设置对应动作
          this._models.at(i).startRandomMotion(LAppDefine.MotionGroupTapBody, LAppDefine.PriorityNormal);
        }
      }
    }
  }
  public currentPosition(x: number, y: number, type='end'){
    if(x > -1 && x<1&&y<1&&y>-1){
      //但只有点击canvas区域才有效，有效范围为 x[-1,1]  y [-1,1]
      console.log("--------lapplive2dmanager.ts ---  您点击到了canvas区域-------");
      if(x > -0.20 && x < 0.20 && y>0.20 && y< 0.8){
        //这里是头部区域，
        console.log("--------lapplive2dmanager.ts ---  您点击到了人物的头部区域-------");
        // @ts-ignore
        document.touchHeadHandler()
        return LAppDefine.HitAreaNameHead
      }
      if(x > -0.20 && x < 0.20 && y>-1.0 && y< 0.1){
        //这里是身体区域，
        // @ts-ignore
        document.touchBodyHandler()
        console.log("--------lapplive2dmanager.ts ---  您点击到了人物的身体区域-------");
        return LAppDefine.HitAreaNameBody
      }
    }
  }
  /**
   * 更新画面时的处理
   * 进行模型的更新处理及描绘处理
   */
  public onUpdate(): void {
    let projection: Csm_CubismMatrix44 = new Csm_CubismMatrix44();
    const { width, height } = canvas;
    // console.log(width, height)
    projection.scale(1.0,  width / height);
    if (this._viewMatrix != null) {
      projection.multiplyByMatrix(this._viewMatrix);
    }

    const saveProjection: Csm_CubismMatrix44 = projection.clone();
    const modelCount: number = this._models.getSize();

    for (let i = 0; i < modelCount; ++i) {
      const model: LAppModel = this.getModel(i);
      projection = saveProjection.clone();

      model.update();
      model.draw(projection); // 参照渡しなのでprojectionは変質する。 由于是参照传递，所以projection变质 ??
    }
  }

  /**
   * 换成下一个场景
   * 在示例应用程序中切换模型集。
   */
  public nextScene(): void {
    const no: number = (this._sceneIndex + 1) % LAppDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * 切换场景.
   * 在示例应用程序中切换模型集。
   *
   * @param index 场景的索引值
   */
  public changeScene(index: number): void {
    this._sceneIndex = index;
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // 从ModelDir[]中保留的目录名称
    // 确定model3.json的路径。
    // 使目录名称与model3.json的名称匹配。
    const model: string = LAppDefine.ModelDir[index];
    const modelPath: string = LAppDefine.ResourcesPath + model + '/';
    let modelJsonName: string = LAppDefine.ModelDir[index];
    modelJsonName += '.model3.json';

    this.releaseAllModel();
    this._models.pushBack(new LAppModel());
    this._models.at(0).loadAssets(modelPath, modelJsonName);
  }

  /**
   * 构造函数
   */
  constructor() {
    this._viewMatrix = new Csm_CubismMatrix44();
    this._models = new Csm_csmVector<LAppModel>();
    this._sceneIndex = 0;
    this.changeScene(this._sceneIndex);
  }

  _viewMatrix: Csm_CubismMatrix44; // 用于绘制模型的视图矩阵
  _models: Csm_csmVector<LAppModel>; // 模型实例的容器
  _sceneIndex: number; // 要显示场景的索引值
  // 动作回放结束时的回调功能
  _finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Finished:');
    console.log(self);
  };
}
