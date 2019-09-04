import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { posix } from 'path';

enum ToolMode {
  Line,
  Square,
  Circle,
  Arrow,
  Text
}

enum LayerMode {
  Image,
  Editor
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
    {mode: LayerMode.Image, name: '底圖' , checked: true},
    {mode: LayerMode.Editor, name: '使用者作畫的內容', checked: true},
  ];

  tools = [
    {mode: ToolMode.Line, name: '畫線' },
    {mode: ToolMode.Square, name: '畫框' },
    {mode: ToolMode.Circle, name: '畫圓' },
    {mode: ToolMode.Arrow, name: '箭頭' },
    {mode: ToolMode.Text, name: '文字' },
  ];

  stage: Konva.Stage;
  imageLayer: Konva.Layer;
  editorLayer: Konva.Layer;

  imageLayerLoad = false;
  selectedTool =  ToolMode.Line;

  isPaint = false;
  lastLine;


  constructor() {
  }

  ngOnInit() {
    this.stage = new Konva.Stage({container: 'container'});
    this.imageLayer = new Konva.Layer();
    this.editorLayer = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.editorLayer);
    this.initStage();

    // this.stage.on('mousedown touchstart', (e) => {
    //   this.isPaint = true;
    //   const pos = this.stage.getPointerPosition();
    //   this.lastLine = new Konva.Line({
    //     stroke: '#000000',
    //     strokeWidth: 5,
    //     globalCompositeOperation: 'source-over',
    //     points: [pos.x, pos.y]
    //   });
    //   this.editorLayer.add(this.lastLine);
    // });

    // this.stage.on('mouseup touchend', () => {
    //   this.isPaint = false;
    // });

    // // and core function - drawing
    // this.stage.on('mousemove touchmove', () => {
    //   if (!this.isPaint) {
    //     return;
    //   }

    //   const pos = this.stage.getPointerPosition();
    //   const newPoints = this.lastLine.points().concat([pos.x, pos.y]);
    //   this.lastLine.points(newPoints);
    //   this.editorLayer.batchDraw();
    // });
  }

  initStage() {
    this.stage.on('mousedown touchstart', () => {
      this.isPaint = true;
      const pos = this.stage.getPointerPosition();
      switch (+this.selectedTool) {
        case ToolMode.Text:
          this.createTextNode(pos);
          break;
        default:
          break;
      }
    });

    this.stage.on('mouseup touchend', () => {
      this.isPaint = false;
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', () => {
      if (!this.isPaint) {
        return;
      }
      const pos = this.stage.getPointerPosition();
    });
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
    this.downloadURI(dataURL, 'stage.png');
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

  onLayerSelected(selectedLayer) {
    this.stage.getLayers().each(layer => layer.hide());
    switch (+selectedLayer) {
      case LayerMode.Image:
        this.imageLayer.show();
        break;
      case LayerMode.Editor:
        this.editorLayer.show();
        break;
      default:
        this.stage.getLayers().each(layer => layer.show());
        break;
    }
  }

  createArrowNode() {
    console.log('createTextNode');
    const arrow = new Konva.Arrow({
      x: this.stage.width() / 4,
      y: this.stage.height() / 4,
      points: [0, 0, this.stage.width() / 2, this.stage.height() / 2],
      pointerLength: 20,
      pointerWidth: 20,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 4,
      draggable: true,
    });

    this.editorLayer.add(arrow);
    this.editorLayer.draw();
  }

  createTextNode(pos) {
    console.log('createTextNode');
    const textNode = new Konva.Text({
      text: 'Input text here',
      x: pos.x,
      y: pos.y,
      fontSize: 20,
      draggable: true,
      width: 200
    });
    this.editorLayer.add(textNode);
    this.editorLayer.draw();

    textNode.on('dblclick', () => {
      // create textarea over canvas with absolute position

      // first we need to find its position
      const textPosition = textNode.getAbsolutePosition();
      const stageBox = this.stage.container().getBoundingClientRect();

      const areaPosition = {
          x: textPosition.x + stageBox.left,
          y: textPosition.y + stageBox.top
      };

      // create textarea and style it
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = textNode.width() + 'px';
      textarea.focus();

      textarea.addEventListener('keydown', (e) => {
          // hide on enter
          if (e.keyCode === 13 || e.keyCode === 27) {
              textNode.text(textarea.value);
              this.editorLayer.draw();
              document.body.removeChild(textarea);
          }
      });
    });
  }

}
