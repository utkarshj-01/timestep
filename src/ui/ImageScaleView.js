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

/**
 * @class ui.ImageScaleView
 *
 * @doc http://doc.gameclosure.com/api/ui-imageview.html#class-ui.imagescaleview
 * @docsrc https://github.com/gameclosure/doc/blob/master/api/ui/imageview.md
 */

import ui.View;
import ui.resource.Image as Image;

exports = Class(ui.View, function (supr) {

	var defaults = {
		image: null,
		autoSize: false,
		scaleMethod: 'stretch',
		renderCenter: true
	};

	this.init = function (opts) {
		supr(this, 'init', [merge(opts, defaults)]);
	};

	this.getScaleMethod = function () {
		return this._scaleMethod;
	};

	this.updateSlices = function (opts) {
		// reset slice cache
		this._renderCacheKey = {};
		this._sliceCache = [];
		for (var i = 0; i < 9; ++i) {
			var row = [this._img.getSource(), 0, 0, 0, 0, 0, 0, 0, 0];
			row.render = false;
			this._sliceCache.push(row);
		}

		// {horizontal: {left: n, center: n, right: n}, vertical: {top: n, middle: n, bottom: n}}
		this._sourceSlices = opts.sourceSlices;
		// {horizontal: {left: n, right: n}, vertical: {top: n, bottom: n}}
		this._destSlices = opts.destSlices || opts.sourceSlices;

		this._imgScale = opts.imgScale || 1;

		if (opts.scaleMethod === '2slice') {
			if (opts.sourceSlices.horizontal && opts.destSlices.horizontal) {
				if (opts.destSlices.horizontal.left) {
					opts.sourceSlices.horizontal.center = opts.sourceSlices.horizontal.right;
					opts.sourceSlices.horizontal.right = 0;
				} else if (opts.destSlices.horizontal.right) {
					opts.sourceSlices.horizontal.center = opts.sourceSlices.horizontal.left;
					opts.sourceSlices.horizontal.left = 0;
				}
			}
			if (opts.sourceSlices.vertical && opts.destSlices.vertical) {
				if (opts.destSlices.vertical.top) {
					opts.sourceSlices.vertical.middle = opts.sourceSlices.vertical.bottom;
					opts.sourceSlices.vertical.bottom = 0;
				} else if (opts.destSlices.vertical.bottom) {
					opts.sourceSlices.vertical.middle = opts.sourceSlices.vertical.bottom;
					opts.sourceSlices.vertical.bottom = 0;
				}
			}
		}

		if (!opts.sourceSlices || !(opts.sourceSlices.horizontal || opts.sourceSlices.vertical)) {
			throw new Error('slice views require sourceSlices.horizontal and/or sourceSlices.vertical');
		}

		if (opts.sourceSlices.horizontal) {
			var cent = opts.width ? (opts.width - opts.sourceSlices.horizontal.left - opts.sourceSlices.horizontal.right) : 0;
			this._sourceSlicesHor = [
				opts.sourceSlices.horizontal.left,
				opts.sourceSlices.horizontal.center || cent,
				opts.sourceSlices.horizontal.right
			];
			this._destSlicesHor = [
				(this._destSlices.horizontal.left || 0) * this._imgScale,
				0,
				(this._destSlices.horizontal.right || 0) * this._imgScale
			];
		} else {
			this._sourceSlicesHor = [0, 100, 0];
			this._destSlicesHor = [0, 100, 0];
		}

		if (opts.sourceSlices.vertical) {
			var cent = opts.height ? (opts.height - opts.sourceSlices.vertical.top - opts.sourceSlices.vertical.bottom) : 0;
			this._sourceSlicesVer = [
				opts.sourceSlices.vertical.top,
				opts.sourceSlices.vertical.middle || cent,
				opts.sourceSlices.vertical.bottom
			];
			this._destSlicesVer = [
				(this._destSlices.vertical.top || 0) * this._imgScale,
				0,
				(this._destSlices.vertical.bottom || 0) * this._imgScale
			];
		} else {
			this._sourceSlicesVer = [0, 100, 0];
			this._destSlicesVer = [0, 100, 0];
		}
	};

	this.updateOpts = function (opts) {
		opts = merge(supr(this, 'updateOpts', arguments), this._opts);

		if (opts.scaleMethod) {
			if (this._scaleMethod != opts.scaleMethod) {
				var key = opts.scaleMethod;
				if (/slice$/.test(key)) {
					key = 'slice';
				}

				this.render = renderFunctions[key];
				this._renderCacheKey = {};
				this._scaleMethod = opts.scaleMethod;
				this._isSlice = this._scaleMethod.slice(1) == 'slice';
			}
		}

		if ('debug' in opts) {
			this.debug = !!opts.debug;
		}

		if (this._isSlice && this._img) {
			this.updateSlices(opts);
		}

		if (opts.image) {
			this.setImage(opts.image, opts);
		}
		if (opts.verticalAlign) {
			this._verticalAlign = opts.verticalAlign;
		}
		if (opts.align) {
			this._align = opts.align;
		}

		this.rows = opts.rows;
		this.columns = opts.columns;

		return opts;
	};

	this._computeSlices = function (w, h, absScale) {
		var bounds = this._img.getBounds();
		var iw = bounds.width;
		var ih = bounds.height;
		if (iw <= 0 || ih <= 0) {
			return;
		}

		var image = this._img.getSource();
		var sourceSlicesHor = this._sourceSlicesHor;
		var sourceSlicesVer = this._sourceSlicesVer;
		var destSlicesHor = [];
		var destSlicesVer = [];
		var sx = bounds.x;
		var sy = bounds.y;

		var dx = 0;
		var dy = 0;
		var dw = w;
		var dh = h;

		var i, j;

		if (sourceSlicesHor) {
			var ratio = this.style.fixedAspectRatio ? h / ih : 1;
			destSlicesHor[0] = this._destSlicesHor[0] * ratio;
			destSlicesHor[2] = this._destSlicesHor[2] * ratio;
			destSlicesHor[1] = w - destSlicesHor[0] - destSlicesHor[2];

			if (destSlicesHor[1] < 0) {
				dw = destSlicesHor[0] + destSlicesHor[2];
				destSlicesHor[0] = (destSlicesHor[0] * w / dw) | 0;
				destSlicesHor[1] = 0;
				destSlicesHor[2] = w - destSlicesHor[0];
			}
		}

		if (sourceSlicesVer) {
			var ratio = this.style.fixedAspectRatio ? w / iw : 1;
			destSlicesVer[0] = this._destSlicesVer[0] * ratio;
			destSlicesVer[2] = this._destSlicesVer[2] * ratio;
			destSlicesVer[1] = h - destSlicesVer[0] - destSlicesVer[2];

			if (destSlicesVer[1] < 0) {
				dh = destSlicesVer[0] + destSlicesVer[2];
				destSlicesVer[0] = (destSlicesVer[0] * h / dh) | 0;
				destSlicesVer[1] = 0;
				destSlicesVer[2] = h - destSlicesVer[0];
			}
		}

		var heightBalance = 0;
		var sw, sh;
		for (j = 0; j < 3; j++) {
			var widthBalance = 0;
			var idealHeight = destSlicesVer[j] + heightBalance;
			var roundedHeight = Math.round(absScale * idealHeight) / absScale;
			heightBalance = idealHeight - roundedHeight;

			sh = sourceSlicesVer[j];
			dh = roundedHeight;
			sx = bounds.x;
			dx = 0;
			for (i = 0; i < 3; i++) {
				var idealWidth = destSlicesHor[i] + widthBalance;
				var roundedWidth = Math.round(absScale * idealWidth) / absScale;
				widthBalance = idealWidth - roundedWidth;

				sw = sourceSlicesHor[i];
				dw = roundedWidth;

				var cache = this._sliceCache[j * 3 + i];
				if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
					cache[1] = sx;
					cache[2] = sy;
					cache[3] = sw;
					cache[4] = sh;
					cache[5] = dx;
					cache[6] = dy;
					cache[7] = dw;
					cache[8] = dh;
					cache.render = true;
				} else {
					cache.render = false;
				}

				sx += sw;
				dx += dw;
			}
			sy += sh;
			dy += dh;
		}
	};

	this.getImage = function () {
		return this._img;
	};

	this.setImage = function (img, opts) {
		var autoSized = false;
		var sw, sh, iw, ih, bounds;
		opts = merge(opts, this._opts);

		if (typeof img == 'string') {
			bounds = GCResources.getMap()[img];
			if (bounds) {
				iw = bounds.w;
				ih = bounds.h;
			}
		} else if (img instanceof Image && img.isLoaded()) {
			bounds = img.getBounds();
			iw = bounds.width;
			ih = bounds.height;
		}

		if (!bounds) {
			if (typeof img == 'string') {
				img = new Image({url: img});
			}
			return img.doOnLoad(this, 'setImage', img, opts);
		}

		if (opts.autoSize && this._scaleMethod == 'stretch' && !((opts.width || opts.layoutWidth) && (opts.height || opts.layoutHeight))) {
			autoSized = true;
			if (this.style.fixedAspectRatio) {
				this.style.enforceAspectRatio(iw, ih);
			} else {
				this.style.width = iw;
				this.style.height = ih;
			}
		}

		this._img = (typeof img == 'string') ? new Image({url: img}) : img;

		if (this._isSlice) {
			this.updateSlices({
				sourceSlices: this._opts.sourceSlices
			});

			var sourceSlicesHor = this._sourceSlicesHor;
			var sourceSlicesVer = this._sourceSlicesVer;
			if (sourceSlicesHor) {
				sw = sourceSlicesHor[0] + sourceSlicesHor[1] + sourceSlicesHor[2];
				var scale = iw / sw;
				sourceSlicesHor[0] *= scale;
				sourceSlicesHor[1] *= scale;
				sourceSlicesHor[2] *= scale;
			}
			if (sourceSlicesVer) {
				sh = sourceSlicesVer[0] + sourceSlicesVer[1] + sourceSlicesVer[2];
				var scale = ih / sh;
				sourceSlicesVer[0] *= scale;
				sourceSlicesVer[1] *= scale;
				sourceSlicesVer[2] *= scale;
			}
		}

		if (this._img) {
			if (opts && opts.autoSize && !autoSized) {
				this._img.doOnLoad(this, 'autoSize');
			}

			this._img.doOnLoad(this, 'needsRepaint');
		}
	};

	this.doOnLoad = function () {
		if (arguments.length == 1) {
			this._img.doOnLoad(this, arguments[0]);
		} else {
			this._img.doOnLoad.apply(this._img, arguments);
		}
		return this;
	};

	this.autoSize = function () {
		if (this._img && this._img.isLoaded()) {
			this.style.width = this._img.getWidth() || this._opts.width;
			this.style.height = this._img.getHeight() || this._opts.height;
		}
	};

	this.getOrigWidth = this.getOrigW = function () {
		return this._img.getOrigW();
	};

	this.getOrigHeight = this.getOrigH = function () {
		return this._img.getOrigH();
	};

	function renderCoverOrContain(ctx, opts) {
		if (!this._img) { return; }

		var s = this.style;
		var w = s.width;
		var h = s.height;
		var cachedKey = this._renderCacheKey;
		var cache = this._renderCache || (this._renderCache = {x: 0, y: 0, w: 0, h: 0});
		if (cachedKey.width != w || cachedKey.height != h) {
			cachedKey.width = w;
			cachedKey.height = h;

			var bounds = this._img.getBounds();
			var iw = bounds.width;
			var ih = bounds.height;
			var scale = 1;
			var targetRatio = iw / ih;
			var ratio = w / h;
			var isCover = this._scaleMethod == 'cover';
			if (isCover ? ratio > targetRatio : ratio < targetRatio) {
				scale = w / iw;
			} else {
				scale = h / ih;
			}
			var finalWidth = iw * scale;
			var finalHeight = ih * scale;
			cache.x = this._align == 'left' ? 0 : this._align == 'right' ? w - finalWidth : (w - finalWidth) / 2;
			cache.y = this._verticalAlign == 'top' ? 0 : this._verticalAlign == 'bottom' ? h - finalHeight : (h - finalHeight) / 2;
			cache.w = finalWidth;
			cache.h = finalHeight;
			cache.sx = 0;
			cache.sy = 0;
			cache.sw = iw;
			cache.sh = ih;
			if (isCover) {
				if (cache.h > s.height) {
					if (this._verticalAlign == 'bottom') {
						cache.sy = cache.sh - s.height * s.scale;
					} else if (this._verticalAlign != 'top') {
						cache.sy = -cache.y * s.scale;
					}
					cache.y = 0;
					cache.h = s.height;
					cache.sh = cache.h * s.scale;
				} else if (cache.w > s.width) {
					if (this._align == 'right') {
						cache.sx = cache.sw - s.width * s.scale;
					} else if (this._align != 'left') {
						cache.sx = -cache.x * s.scale;
					}
					cache.x = 0;
					cache.w = s.width;
					cache.sw = cache.w * s.scale;
				}
			}
		}

		this._img.render(ctx, cache.sx, cache.sy, cache.sw, cache.sh, cache.x, cache.y, cache.w, cache.h);
		if (this.debug) {
			ctx.strokeStyle = debugColors[0];
			ctx.strokeRect(0, 0, s.width, s.height);
		}
	}

	var renderFunctions = {
		'none': function (ctx, opts) {
			this._img && this._img.render(ctx, 0, 0);
		},
		'stretch': function (ctx, opts) {
			var s = this.style;
			var w = s.width;
			var h = s.height;
			this._img && this._img.render(ctx, 0, 0, w, h);
		},
		'contain': renderCoverOrContain,
		'cover': renderCoverOrContain,
		'tile': function (ctx, opts) {
			if (!this._img) { return; }

			var s = this.style;
			var w = s.width;
			var h = s.height;

			var bounds = this._img.getBounds();
			var iw = bounds.width;
			var ih = bounds.height;

			var x = 0, y = 0;

			if (this.rows) {
				var targetHeight = h / this.rows;
				var targetRatio = targetHeight / ih;
				var targetWidth = iw * targetRatio;
				for (var i = 0; i < this.rows; i++) {
					while (x < w) {
						this._img.render(ctx, x, y, targetWidth, targetHeight);
						if (this.debug) {
							ctx.strokeStyle = debugColors[i % 3];
							ctx.strokeRect(x + 0.5, y + 0.5, targetWidth - 1, targetHeight - 1);
						}
						x += targetWidth;
					}
					y += targetHeight;
				}
			}
			else if (this.columns) {
				var targetWidth = w / this.columns;
				var targetRatio = targetWidth / iw;
				var targetHeight = ih * targetRatio;
				for (var i = 0; i < this.columns; i++) {
					while (y < h) {
						this._img.render(ctx, x, y, targetWidth, targetHeight);
						if (this.debug) {
							ctx.strokeStyle = debugColors[i % 3];
							ctx.strokeRect(x + 0.5, y + 0.5, targetWidth - 1, targetHeight - 1);
						}
						y += targetHeight;
					}
					x += targetWidth;
				}
			}
		},
		'slice': function (ctx, opts) {
			if (!this._img) { return; }

			var s = this.style;
			var w = s.width;
			var h = s.height;
			var scale = s.scale;
			var cachedKey = this._renderCacheKey;
			if (cachedKey.width != w || cachedKey.height != h || cachedKey.absScale != scale) {
				cachedKey.width = w;
				cachedKey.height = h;
				cachedKey.absScale = scale;
				this._computeSlices(w, h, scale);
			}

			for (var i = 0; i < 9; i++) {
				this._drawSlice(ctx, this._sliceCache[i], i);
			}
		}
	};

	this._drawSlice = function (ctx, sliceData, i) {
		if (!sliceData.render) { return; }
		ctx.drawImage.apply(ctx, sliceData);
		if (this.debug) {
			ctx.strokeStyle = debugColors[i % 3];
			ctx.strokeRect(sliceData[5] + 0.5, sliceData[6] + 0.5,
				sliceData[7] - 1, sliceData[8] - 1);
		}
	};

	var debugColors = ['#FF0000', '#00FF00', '#0000FF'];

	this.getTag = function () {
		return 'ImageScaleView' + this.uid + ':' + (this._img && this._img._map.url.substring(0, 16));
	};
});