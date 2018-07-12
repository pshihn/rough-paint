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

  _setFloatOption(properties, prop, option, options) {
    if (properties.get(prop).length) {
      options[option] = parseFloat(properties.get(prop).toString().trim());
    }
  }

  _setStringOption(properties, prop, option, options) {
    if (properties.get(prop).length) {
      options[option] = properties.get(prop).toString().trim();
    }
  }

  paint(ctx, geometry, properties) {
    const options = {};
    this._setFloatOption(properties, '--rough-roughness', 'roughness', options);
    this._setFloatOption(properties, '--rough-hachure-gap', 'hachureGap', options);
    this._setFloatOption(properties, '--rough-hachure-angle', 'hachureAngle', options);
    this._setFloatOption(properties, '--rough-fill-weight', 'fillWeight', options);
    this._setFloatOption(properties, '--rough-border-width', 'strokeWidth', options);
    this._setStringOption(properties, '--rough-fill-style', 'fillStyle', options);
    this._setStringOption(properties, '--rough-fill', 'fill', options);
    this._setStringOption(properties, '--rough-border-color', 'stroke', options);
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