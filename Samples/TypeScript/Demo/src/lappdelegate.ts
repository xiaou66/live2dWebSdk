/**
 * Copyright(c) Live2D Inc. All rights reserved.
 * Copyright(c) Live2D Inc. 保留所有权利。
 *
 * 本源码的使用受Live2D开放软件许可证的约束。
 * 可在 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
  Live2DCubismFramework as live2dcubismframework,
  Option as Csm_Option
} from '@framework/live2dcubismframework';
import Csm_CubismFramework = live2dcubismframework.CubismFramework;
import { LAppView } from './lappview';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import * as LAppDefine from './lappdefine';

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * 应用类。
 * 管理 Cubism SDK。
 */
export class LAppDelegate {
  /**
   * 返回该类的一个实例（单例）。
   * 如果尚未创建实例，则在内部创建一个实例。
   *
   * @return LAppDelegate 类的实例
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * 释放类实例(single ton)。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  // @ts-ignore
  /**
   * 初始化APP需要的东西。
   */
  public initialize(): boolean {
    // 画布的创建
    // canvas = document.createElement('canvas');
    // canvas.width = LAppDefine.RenderTargetWidth;
    // canvas.height = LAppDefine.RenderTargetHeight;
    canvas = <HTMLCanvasElement>document.getElementById("live2d");
    //添加以下内容到函数体
    //页面鼠标移动事件监听，抛弃SDK提供的点击移动事件
    // document.addEventListener("mousemove",function(e){
    //   if(!LAppDelegate.getInstance()._view) {
    //     // LAppPal.printLog("view notfound");
    //     console.log('view notfound')
    //     return;
    //   }
    //   let rect = document.getElementById("live2d").getBoundingClientRect();
    //   let posX: number = e.clientX -rect.left;
    //   let posY: number = e.clientY - rect.top ;
    //   // console.log("onMouseMoved: gate文件中posY值为： 【"+posY+"】  canvas的top距离为："+rect.top);
    //   LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
    // },false);
    // @ts-ignore
    document.nextScene = () => {
      const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance()
      live2DManager.nextScene();
    }
    //在这里加上鼠标离开浏览器后，一切归位

    document.addEventListener("mouseout",this.mouseout,false);
    // 绑定 释放资源
    // @ts-ignore
    document.live2d_release = () => {
      canvas = null
      document.removeEventListener('mouseout', this.mouseout)
      this.release()
    }

    // gl 上下文初始化
    // @ts-ignore
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      alert('Cannot initialize WebGL. This browser does not support.');
      gl = null;

      document.body.innerHTML =
        'This browser does not support the <code>&lt;canvas&gt;</code> element.';

      // gl初期化失敗
      return false;
    }
    // 把画布添加到DOM
    // document.body.appendChild(canvas);

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // 透過設定 透明度设定
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;

    if (supportTouch) {
      // 与触摸相关的回调函数登记
      canvas.ontouchstart = onTouchBegan;
      canvas.ontouchmove = onTouchMoved;
      canvas.ontouchend = onTouchEnded;
      canvas.ontouchcancel = onTouchCancel;
    } else {
      // 鼠标相关的回调函数登记
      canvas.onmousedown = onClickBegan;
      canvas.onmousemove = onMouseMoved;
      canvas.onmouseup = onClickEnded;
    }

    // AppView的初始化
    this._view.initialize();

    // Cubism SDK的初始化
    this.initializeCubism();

    return true;
  }
  public mouseout():void {
      //鼠标离开document后，将其位置置为（0，0）
      let live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
      live2DManager.onDrag(0.0, 0.0);
  }
  /**
   * 释放
   */
  public release(): void {
    if(this._textureManager){
      this._textureManager.release();
    }
    this._textureManager = null;
    if(this._view){
      this._view.release();
    }
    this._view = null;

    // 释放资源
    LAppLive2DManager.releaseInstance();

    // Cubism SDK 释放
    Csm_CubismFramework.dispose();
  }

  /**
   * 执行处理
   */
  public run(): void {
    //主循环
    const loop = (): void => {
      // 实例的有无的确认
      if (s_instance == null) {
        return;
      }

      // 时间更新
      LAppPal.updateTime();

      // 画面的初始化
      gl.clearColor(0.0, 0.0, 0.0, 0);

      // 启用深度测试
      gl.enable(gl.DEPTH_TEST);

      // 近处物体掩盖远处物体
      gl.depthFunc(gl.LEQUAL);

      // 清除颜色缓冲区和深度缓冲区
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // 透过设定
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 描画更新
      this._view.render();

      // 循环的递归调用
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 注册着色程序
   */
  public createShader(): WebGLProgram {
    // 编译顶点着色器
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      LAppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // 编译碎片着色器
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      LAppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // 创建程序对象
    const programId = gl.createProgram();
    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // 联系
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * 取得视图信息
   */
  public getView(): LAppView {
    return this._view;
  }

  public getTextureManager(): LAppTextureManager {
    return this._textureManager;
  }

  /**
   * 构造函数
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Csm_Option();
    this._view = new LAppView();
    this._textureManager = new LAppTextureManager();
  }

  /**
   * Cubism SDK初始化
   */
  public initializeCubism(): void {
    // setup cubism
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    Csm_CubismFramework.startUp(this._cubismOption);

    // initialize cubism
    Csm_CubismFramework.initialize();

    // load model
    LAppLive2DManager.getInstance();

    LAppPal.updateTime();

    this._view.initializeSprite();
  }

  _cubismOption: Csm_Option; //cubism SDK 选项
  _view: LAppView; // View情報
  _captured: boolean; // 是否点击了
  _mouseX: number; // 鼠标X坐标
  _mouseY: number; // 鼠标Y坐标
  _isEnd: boolean; //APP是否关闭
  _textureManager: LAppTextureManager; // 纹理管理器
}

/**
 * クリックしたときに呼ばれる。
 * 在单击的时候调用的函数
 */
function onClickBegan(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  LAppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 当鼠标指针移动时，被调用。
 */
function onMouseMoved(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 当点击完成后会被调用。
 */
function onClickEnded(e: MouseEvent): void {
  LAppDelegate.getInstance()._captured = false;
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * タッチしたときに呼ばれる。
 * 触摸调用
 */
function onTouchBegan(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  LAppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * スワイプすると呼ばれる。
 * 按着移动
 * 滑动
 */
function onTouchMoved(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 触摸结束 调用
 */
function onTouchEnded(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * タッチがキャンセルされると呼ばれる。
 * 触摸取消调用
 */
function onTouchCancel(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
