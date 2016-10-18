let exports = {};

/**
 * @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License v. 2.0 as published by Mozilla.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License v. 2.0 for more details.

 * You should have received a copy of the Mozilla Public License v. 2.0
 * along with the Game Closure SDK.  If not, see <http://mozilla.org/MPL/2.0/>.
 */
import {
  GLOBAL,
  merge,
  bind,
  logger,
  NATIVE
} from 'base';

import Context2D from './Context2D';
import setProperty from 'util/setProperty';

// mock canvas object
exports = class {
  constructor(opts) {
    opts = merge(opts, {
      width: 1,
      height: 1,
      offscreen: true
    });


    // TODO: add getters/setters to width/height to auto-resize -- we'll need to allocate
    // a new texture in OpenGL and blit the old one into the new one
    this._width = opts.width;
    this._height = opts.height;
    this._offscreen = opts.offscreen;

    this.style = {};
    this._context2D = null;
    this.complete = true;
  }
  getContext(which, unloadListener) {
    if (which.toUpperCase() == '2D') {
      this.complete = true;
      return this._context2D || (this._context2D = new Context2D({
        canvas: this,
        offscreen: this._offscreen,
        unloadListener: bind(this, function () {
          logger.log('{canvas-registry} Canvas class reacting to canvas loss by setting context to null');

          this._context2D = null;
          if (typeof unloadListener == 'function') {
            unloadListener();
          }
        })
      }));
    }
  }
  getBoundingClientRect() {
    return {
      bottom: this._height,
      height: this._height,
      left: 0,
      right: this._width,
      top: this._width,
      width: 0
    };
  }
  toDataURL() {
    return NATIVE.gl.toDataURL(this._context2D);
  }
  destroy() {
    if (this._context2D) {
      this._context2D.destroy();
    }
  }
  resize(width, height) {
    if (this._context2D) {
      // this will set our own _width/_height
      this._context2D.resize(width, height);
    }
  }
};
GLOBAL.HTMLCanvasElement = exports;
var Canvas = GLOBAL.HTMLCanvasElement;


setProperty(Canvas.prototype, 'width', {
  set: function (width) {
    if (this._width !== width) {
      this._width = width;
      this.resize(width, this._height);
    }
    if (this._context2D) {
      this._context2D.clear();
    }
  },
  get: function () {
    return this._width;
  }
});

setProperty(Canvas.prototype, 'height', {
  set: function (height) {
    if (this._height !== height) {
      this._height = height;
      this.resize(this._width, height);
    }
    if (this._context2D) {
      this._context2D.clear();
    }
  },
  get: function () {
    return this._height;
  }
});

setProperty(Canvas.prototype, 'src', {
  set: function (src) {
  },
  get: function () {
    return this._src;
  }
});


document.__registerCreateElementHandler('CANVAS', function () {
  return new Canvas();
});


export default exports;
