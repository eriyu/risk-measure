import { Component, OnInit, NgZone } from '@angular/core';
import Konva from 'konva';
import * as _ from 'lodash';
import * as moment from 'moment';

enum ToolMode {
  Line,
  Rect,
  Circle,
  Arrow,
  Text
}

enum LayerMode {
  BasedImage,
  EditedContext
}

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {


  ToolMode = ToolMode;
  LayerMode = LayerMode;

  layers = [
    {mode: LayerMode.BasedImage, name: 'BasedImage' , label: '底圖' , checked: true},
    {mode: LayerMode.EditedContext, name: 'EditedContext', label: '使用者作畫的內容' , checked: true},
  ];

  tools = [
    {mode: ToolMode.Line, name: '畫線' },
    {mode: ToolMode.Rect, name: '畫框' },
    {mode: ToolMode.Circle, name: '畫圓' },
    {mode: ToolMode.Arrow, name: '箭頭' },
    {mode: ToolMode.Text, name: '文字' },
  ];

  dragTrack = [];
  isMouseDown = false;

  stage: Konva.Stage;
  imageLayer: Konva.Layer;
  editorLayer: Konva.Layer;
  selectNode: Konva.Node;
  tempNode: Konva.Node;

  imageLayerLoad = false;
  selectedTool =  ToolMode.Line;


  constructor(
    private ngZone: NgZone
  ) {
  }

  ngOnInit() {
    this.stage = new Konva.Stage({container: 'container'});
    this.imageLayer = new Konva.Layer({name: 'BasedImage'});
    this.editorLayer = new Konva.Layer({name: 'EditedContext'});
    this.stage.add(this.imageLayer);
    this.stage.add(this.editorLayer);
    this.addStageListener();
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 8 && this.selectNode) {
        this.destroyTransformer();
        this.selectNode.destroy();
        this.editorLayer.batchDraw();
      }
    });
    const container = document.querySelector('#container');
    container.addEventListener('mouseleave', () => {
      document.body.style.cursor = 'default';
    });
  }

  destroyTransformer() {
    this.stage.find('Transformer').each(item => {
      item.destroy();
    });
    this.stage.batchDraw();
  }

  destroyTempNode() {
    this.stage.find('.temp').each(item => {
      item.destroy();
    });
    this.stage.batchDraw();
  }

  createNode(isDrawTemp = false) {
    switch (this.selectedTool) {
      case ToolMode.Line:
        this.createLineNode(isDrawTemp);
        break;
      case ToolMode.Arrow:
        this.createArrowNode(isDrawTemp);
        break;
      case ToolMode.Rect:
        this.createRectNode(isDrawTemp);
        break;
      case ToolMode.Circle:
        this.createCircleNode(isDrawTemp);
        break;
      case ToolMode.Text:
        this.createTextNode(isDrawTemp);
        break;
    }
  }

  addStageListener() {

    this.stage.on('mousedown touchstart', () => {
      this.isMouseDown = true;
      this.startDragTrack();
    });

    this.stage.on('mouseup touchend', (e) => {
      console.log('stage mouseup', this.getNowTimeString());
      setTimeout(() => {
        const noTransFormer = (this.stage.find('Transformer').length > 0) ? false : true;
        if (this.isMouseDown) {
          this.isMouseDown = false;
          this.destroyTempNode();
          if (noTransFormer) {
            const isDrawTemp = false;
            this.createNode(isDrawTemp);
          }
        }
      });
    });

    this.stage.on('mousemove touchmove', (e) => {
      if (e.target instanceof Konva.Image) {
        document.body.style.cursor = 'crosshair';
      } else {
        document.body.style.cursor = 'default';
      }
      this.updateDragTrack();
      if (
        this.isMouseDown &&
        e.target instanceof Konva.Image
      ) {
        this.destroyTempNode();
        const isDrawTemp = true;
        this.createNode(isDrawTemp);
      }
    });

    this.stage.on('click tap', (e) => {
      if (e.target instanceof Konva.Image) {
        const container = document.querySelector('#container');
        this.destroyTransformer();
        // this.selectNode = null;
        if (this.selectNode instanceof Konva.Text) {
          const textArea = document.querySelector('textarea');
          if (textArea) {
            this.selectNode.text(textArea.value);
            this.editorLayer.batchDraw();
            container.removeChild(textArea);
          }
        }
      }
    });
  }

  addNodeListener(node: Konva.Node) {

    node.on('mouseup', (e) => {
      console.log('node mouseup', this.getNowTimeString());
    });

    node.on('click tap', (e) => {
      // clear all Transformer on stage
      this.destroyTransformer();
      this.selectNode = node;
      node.draggable(true);
      const tr = new Konva.Transformer();
      this.editorLayer.add(tr);
      tr.attachTo(e.target);
      this.editorLayer.batchDraw();
      console.log('node click', this.getNowTimeString());
    });
  }

  startDragTrack() {
    const pos = this.stage.getPointerPosition();
    this.dragTrack = [{x: pos.x, y: pos.y}];
  }

  updateDragTrack() {
    const pos = this.stage.getPointerPosition();
    this.dragTrack.push({x: pos.x, y: pos.y});
  }


  getShapeInfo(dragTrack) {
    const posStart = _.first(dragTrack);
    const posEnd = _.last(dragTrack);
    let r1x = posStart.x;
    let r1y = posStart.y;
    let r2x = posEnd.x;
    let r2y = posEnd.y;
    let d;
    if (r1x > r2x ) {
      d = Math.abs(r1x - r2x);
      r1x = r2x;
      r2x = r1x + d;
    }
    if (r1y > r2y ) {
      d = Math.abs(r1y - r2y);
      r1y = r2y;
      r2y = r1y + d;
    }
    return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y});
  }

  createRectNode(isDrawTemp) {
    const shape = this.getShapeInfo(this.dragTrack);
    const node = new Konva.Rect({
      x: shape.x1,
      y: shape.y1,
      width: shape.x2 - shape.x1,
      height: shape.y2 - shape.y1,
      stroke: 'black',
      strokeWidth: 2
    });
    if (isDrawTemp) {
      node.name('temp');
    }
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  createCircleNode(isDrawTemp) {
    const shape = this.getShapeInfo(this.dragTrack);
    const node = new Konva.Circle({
      x: shape.x1,
      y: shape.y1,
      radius: shape.x2 - shape.x1,
      stroke: 'black',
      strokeWidth: 2
    });
    if (isDrawTemp) {
      node.name('temp');
    }
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  createLineNode(isDrawTemp) {
    this.dragTrack = [
      _.first(this.dragTrack),
      _.last(this.dragTrack),
    ];
    const trackPoints = _.flatMap(this.dragTrack, track => {
      return [track.x , track.y];
    });
    const node = new Konva.Line({
      points: trackPoints,
      stroke: 'black'
    });
    if (isDrawTemp) {
      node.name('temp');
    }
    if (node.width() > 0) {
      this.addNodeListener(node);
      this.editorLayer.add(node);
      this.stage.batchDraw();
    }
  }

  createArrowNode(isDrawTemp) {
    this.dragTrack = [
      _.first(this.dragTrack),
      _.last(this.dragTrack),
    ];
    const trackPoints = _.flatMap(this.dragTrack, track => {
      return [track.x , track.y];
    });
    const node = new Konva.Arrow({
      points: trackPoints,
      stroke: 'black',
      fill: 'black'
    });
    if (isDrawTemp) {
      node.name('temp');
    }
    if (node.width() > 15) {
      this.addNodeListener(node);
      this.editorLayer.add(node);
      this.stage.batchDraw();
    }
  }

  createTextNode(isDrawTemp) {
    const shape = this.getShapeInfo(this.dragTrack);
    let nodeConfig = {
      x: shape.x1,
      y: shape.y1,
      width: shape.x2 - shape.x1,
      height: shape.y2 - shape.y1,
    };
    if (isDrawTemp) {
      nodeConfig = Object.assign(nodeConfig, {
        stroke: 'black',
        name: 'temp',
        dash: ([10, 5])
      });
      const rectNode = new Konva.Rect(nodeConfig);
      this.addNodeListener(rectNode);
      this.editorLayer.add(rectNode);
    } else {
      nodeConfig = Object.assign(nodeConfig, {
        text: 'Input text here',
        fontSize: 20
      });
      const textNode = new Konva.Text(nodeConfig);
      this.addNodeListener(textNode);
      this.addTextNodeListener(textNode);
      this.editorLayer.add(textNode);
    }
    this.stage.batchDraw();
  }

  addTextNodeListener(textNode: Konva.Text) {
    const container = document.querySelector('#container');
    textNode.on('dblclick', (e) => {
      const node = e.currentTarget as Konva.Text;

      // create textarea and style it
      const textElement = document.createElement('textarea');
      container.appendChild(textElement);
      textElement.value = node.text();
      textElement.style.position = 'absolute';
      textElement.style.top = node.y() + 'px',
      textElement.style.left = node.x() + 'px',
      textElement.style.width = node.width() + 'px';
      textElement.style.height = node.height() + 'px';
      textElement.style.fontSize = 20 + 'px';
      textElement.focus();
    });
  }

  resetContext() {
    this.editorLayer.destroy();
    this.editorLayer = new Konva.Layer({name: 'EditedContext'});
    this.stage.add(this.editorLayer);
  }

  downloadURI(uri, name) {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  saveAsImage() {
    const dataURL = this.stage.toDataURL();
    this.downloadURI(dataURL, `stage_${this.getNowTimeString()}.png`);
  }

  getNowTimeString() {
    return moment().format('YYYYMMDDTHHmmssSSS');
  }

  onFileSelected(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (e: any) => { // called once readAsDataURL is completed
        const imgSrc = e.target.result;
        Konva.Image.fromURL(imgSrc, image => {
          this.stage.size({
            width: image.getWidth(),
            height: image.getHeight()
          });
          this.imageLayerLoad = true;
          this.imageLayer.add(image);
          this.imageLayer.batchDraw();
        });
      };
    }
  }

  onToolSelected(selectedTool) {
    this.selectedTool = +selectedTool;
  }

  /**
   * 圖層選擇事件
   */
  onLayerSelected(selectedLayer) {
    selectedLayer.checked = !selectedLayer.checked;
    const foundLayer = this.stage.findOne(layer => {
      return layer.name() === selectedLayer.name;
    }).visible(selectedLayer.checked);
  }

  isSaveAsImgDisabled() {
    let isDisabled = false;
    const count = _.filter(this.layers, layer => layer.checked).length;
    if (count === 0) {
      isDisabled = true;
    }
    return isDisabled;
  }

}
