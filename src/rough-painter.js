import { RoughRenderer } from '../node_modules/roughjs/bin/renderer.js';

class RoughPainter {
  static get inputProperties() {
    return [
      '--rough-fill',
      '--rough-fill-style',
      '--rough-roughness',
      '--rough-hachure-gap',
      '--rough-hachure-angle',
      '--rough-fill-weight',
      '--rough-border-color',
      '--rough-border-width'
    ];
  }

  constructor() {
    this.renderer = new RoughRenderer();
    this.defaultOptions = {
      maxRandomnessOffset: 2,
      roughness: 1,
      bowing: 1,
      stroke: '#000',
      strokeWidth: 1,
      curveTightness: 0,
      curveStepCount: 9,
      fill: null,
      fillStyle: 'hachure',
      fillWeight: -1,
      hachureAngle: -41,
      hachureGap: -1
    };
  }

  paint(ctx, geometry, properties) {
    const options = {};
    if (properties.get('--rough-roughness').length) {
      options.roughness = parseFloat(properties.get('--rough-roughness').toString().trim());
    }
    if (properties.get('--rough-hachure-gap').length) {
      options.hachureGap = parseFloat(properties.get('--rough-hachure-gap').toString().trim());
    }
    if (properties.get('--rough-hachure-angle').length) {
      options.hachureAngle = parseFloat(properties.get('--rough-hachure-angle').toString().trim());
    }
    if (properties.get('--rough-fill').length) {
      options.fill = properties.get('--rough-fill').toString().trim();
    }
    if (properties.get('--rough-fill-style').length) {
      options.fillStyle = properties.get('--rough-fill-style').toString().trim();
    }
    if (properties.get('--rough-fill-weight').length) {
      options.fillWeight = parseFloat(properties.get('--rough-fill-weight').toString().trim());
    }
    if (properties.get('--rough-border-width').length) {
      options.strokeWidth = parseFloat(properties.get('--rough-border-width').toString().trim());
    }
    if (properties.get('--rough-border-color').length) {
      options.stroke = properties.get('--rough-border-color').toString().trim();
    }
    const resolvedOptions = Object.assign({}, this.defaultOptions, options);
    const offset = (options.strokeWidth || 0);
    const points = [[0 + offset, 0 + offset], [geometry.width - offset, 0 + offset], [geometry.width - offset, geometry.height - offset], [0 + offset, geometry.height - offset]];
    const opSets = [];
    if (options.fill) {
      if (resolvedOptions.fillStyle === 'solid') {
        opSets.push(this.renderer.solidFillPolygon(points, resolvedOptions));
      } else {
        opSets.push(this.renderer.patternFillPolygon(points, resolvedOptions));
      }
    }
    if (options.strokeWidth && (options.strokeWidth > 0)) {
      opSets.push(this.renderer.polygon(points, resolvedOptions));
    }
    this._drawOps(opSets, resolvedOptions, ctx);
  }

  _drawOps(sets, o, ctx) {
    for (const drawing of sets) {
      switch (drawing.type) {
        case 'path':
          ctx.save();
          ctx.strokeStyle = o.stroke;
          ctx.lineWidth = o.strokeWidth;
          this._drawToContext(ctx, drawing);
          ctx.restore();
          break;
        case 'fillPath':
          ctx.save();
          ctx.fillStyle = o.fill || '';
          this._drawToContext(ctx, drawing);
          ctx.restore();
          break;
        case 'fillSketch':
          this._fillSketch(ctx, drawing, o);
          break;
      }
    }
  }

  _fillSketch(ctx, drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    ctx.save();
    ctx.strokeStyle = o.fill || '';
    ctx.lineWidth = fweight;
    this._drawToContext(ctx, drawing);
    ctx.restore();
  }

  _drawToContext(ctx, drawing) {
    ctx.beginPath();
    for (const item of drawing.ops) {
      const data = item.data;
      switch (item.op) {
        case 'move':
          ctx.moveTo(data[0], data[1]);
          break;
        case 'bcurveTo':
          ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
          break;
        case 'qcurveTo':
          ctx.quadraticCurveTo(data[0], data[1], data[2], data[3]);
          break;
        case 'lineTo':
          ctx.lineTo(data[0], data[1]);
          break;
      }
    }
    if (drawing.type === 'fillPath') {
      ctx.fill();
    }
    else {
      ctx.stroke();
    }
  }
}
registerPaint('rough-painter', RoughPainter);