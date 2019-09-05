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

  stage: Konva.Stage;
  imageLayer: Konva.Layer;
  editorLayer: Konva.Layer;
  selectNode: Konva.Node;

  imageLayerLoad = false;
  selectedTool =  ToolMode.Line;

  isPaint = false;
  lastLine;


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
        this.stage.find('Transformer').destroy();
        this.selectNode.destroy();
        this.editorLayer.draw();
      }
    });
  }

  addStageListener() {

    this.stage.on('mousedown touchstart', () => {
      this.startDragTrack();
    });

    this.stage.on('mouseup touchend', () => {
      if (this.isPaint) {
        switch (this.selectedTool) {
          case ToolMode.Line:
            this.createLineNode();
            break;
          case ToolMode.Arrow:
            this.createArrowNode();
            break;
          case ToolMode.Rect:
            this.createRectNode();
            break;
          case ToolMode.Circle:
            this.createCircleNode();
            break;
          case ToolMode.Text:
            this.createTextNode();
            break;
          default:
            break;
        }
        this.isPaint = false;
      }
    });

    this.stage.on('mousemove touchmove', (e) => {
      if (e.target instanceof Konva.Image) {
        document.body.style.cursor = 'crosshair';
      } else {
        document.body.style.cursor = 'default';
      }
      this.updateDragTrack();
    });

    this.stage.on('click tap', (e) => {
      if (e.target instanceof Konva.Image) {
        const container = document.querySelector('#container');
        this.stage.find('Transformer').destroy();
        // this.selectNode = null;
        if (this.selectNode instanceof Konva.Text) {
          const textArea = document.querySelector('textarea');
          if (textArea) {
            this.selectNode.text(textArea.value);
            this.editorLayer.draw();
            container.removeChild(textArea);
          }
        }
      }
    });
  }

  addNodeListener(node: Konva.Node) {
    node.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    node.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });
    node.on('click tap', (e) => {
      // clear all Transformer on stage
      this.stage.find('Transformer').destroy();
      this.selectNode = node;
      node.draggable(true);
      const tr = new Konva.Transformer();
      this.editorLayer.add(tr);
      tr.attachTo(e.target);
      this.editorLayer.draw();
    });
  }

  startDragTrack() {
    const pos = this.stage.getPointerPosition();
    this.dragTrack = [{x: pos.x, y: pos.y}];
    this.isPaint = true;
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

  createRectNode() {
    const shape = this.getShapeInfo(this.dragTrack);
    const node = new Konva.Rect({
      x: shape.x1,
      y: shape.y1,
      width: shape.x2 - shape.x1,
      height: shape.y2 - shape.y1,
      stroke: 'black',
      strokeWidth: 2
    });
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  createCircleNode() {
    const shape = this.getShapeInfo(this.dragTrack);
    const node = new Konva.Circle({
      x: shape.x1,
      y: shape.y1,
      radius: shape.x2 - shape.x1,
      stroke: 'black',
      strokeWidth: 2
    });
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  createLineNode() {
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
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  createArrowNode() {
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
    this.addNodeListener(node);
    this.editorLayer.add(node);
    this.stage.batchDraw();
  }

  addTextNodeListener(textNode: Konva.Text) {
    const container = document.querySelector('#container');
    textNode.on('dblclick', (e) => {
      if (!this.isPaint) {
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
      }
    });
  }

  createTextNode() {
    const shape = this.getShapeInfo(this.dragTrack);
    const node = new Konva.Text({
      text: 'Input text here',
      x: shape.x1,
      y: shape.y1,
      fontSize: 20,
      width: shape.x2 - shape.x1,
      height: shape.y2 - shape.y1
    });
    this.addNodeListener(node);
    this.addTextNodeListener(node);
    this.editorLayer.add(node);
    this.editorLayer.batchDraw();
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
    const dateString = moment().format('YYYYMMDDTHHmmssSSS');
    this.downloadURI(dataURL, `stage_${dateString}.png`);
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
          this.imageLayer.draw();
        });
      };
    }
  }

  onToolSelected(selectedTool) {
    this.selectedTool = +selectedTool;
    if (this.selectedTool === ToolMode.Select) {
      this.isPaint = false;
    }
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
