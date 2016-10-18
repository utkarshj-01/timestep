let exports = {};

import { bind } from 'base';

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
exports = class {
  constructor(opts) {
    this._view = opts.view;

    this.listenSubviewResize(opts.view);
  }
  reflow() {
    var view = this._view;
    var sv = view.getSuperview();
    var style = view.style;

    // if wrapping content, listen for changes to subviews
    if (style._layoutWidth == 'wrapContent' || style._layoutHeight == 'wrapContent') {
      this.addSubviewListener(view);
    }




    if (sv) {
      var notInLayout = !style.inLayout || !style.flex || sv.style.layout != 'linear';
      if (notInLayout || !sv.__layout.isHorizontal()) {
        this.reflowX();
      }




      if (notInLayout || !sv.__layout.isVertical()) {
        this.reflowY();
      }
    }
  }
  addSubviewListener(view) {
    if (!view.__hasSubviewListener) {
      view.__hasSubviewListener = true;
      view.subscribe('SubviewAdded', this, '_onSubviewAdded', view);
      view.subscribe('SubviewRemoved', this, '_onSubviewRemoved', view);

      var subviews = view.getSubviews();
      for (var i = 0, n = subviews.length; i < n; ++i) {
        this._onSubviewAdded(view, subviews[i]);
      }
    }
  }
  removeSubviewListener(view) {
    if (view.__hasSubviewListener) {
      view.__hasSubviewListener = false;
      view.unsubscribe('SubviewAdded', this, '_onSubviewAdded');
      view.unsubscribe('SubviewRemoved', this, '_onSubviewRemoved');

      var subviews = view.getSubviews();
      for (var i = 0, n = subviews.length; i < n; ++i) {
        this._onSubviewRemoved(view, subviews[i]);
      }
    }
  }
  _onSubviewAdded(view, subview) {
    subview.style.addResizeListeners();
    view.connectEvent(subview, 'resize', bind(view, 'needsReflow'));
  }
  _onSubviewRemoved(view, subview) {
    view.disconnectEvent(subview, 'resize');
  }
  addResizeListener(view) {
    if (view.style.__removeSuperviewResize) {
      view.style.__removeSuperviewResize();
    }




    // reflow on parent view resize
    var onResize = bind(view, 'needsReflow');
    var superview = view.getSuperview();
    if (superview) {
      superview.on('resize', onResize);
      // store a closure to unsubscribe this event
      view.style.__removeSuperviewResize = bind(view.style, function () {
        this.__removeSuperviewResize = null;
        superview && superview.removeListener('resize', onResize);
      });
    }
  }
  listenSubviewResize(view) {
    if (view.__root) {
      this.addResizeListener(view);
    }




    view.on('ViewAdded', bind(this, 'addResizeListener', view));
    view.on('ViewRemoved', bind(view.style, function () {
      this.__removeSuperviewResize && this.__removeSuperviewResize();
    }));
  }
  reflowX(view) {
    var view = this._view;
    var s = view.style;

    var sv = view.getSuperview();
    if (s.inLayout && sv.style.layout == 'linear') {
      var inLinearLayout = sv.__layout.isHorizontal();
      var padding = sv.style.padding;
    }




    var svWidth = sv.style.width;
    var availWidth = svWidth - (padding && padding.getHorizontal() || 0);

    // compute the width
    var w;
    if (s._layoutWidth == 'wrapContent') {
      // find the maximal right edge
      w = this.getContentWidth() + s.padding.right;
    } else // 1. we're not in a layout and both right and left are defined
    if (!inLinearLayout && svWidth && s.right != undefined && s.left != undefined) {
      w = availWidth / s.scale - (s.left || 0) - (s.right || 0);
    } else // 2. width is defined a percent
    if (svWidth && s._layoutWidthIsPercent) {
      w = availWidth / s.scale * s._layoutWidthValue;
    } else // 3. width is inherited from the superview
    if (s.width == undefined && svWidth) {
      w = availWidth / s.scale;
    } else {
      w = s._width;
    }

























    // enforce center anchor on width change
    if (s.centerAnchor) {
      s.anchorX = (w || 0) / 2;
    }




    // Note that we don't trigger any resize handlers here
    s._width = w;

    if (!inLinearLayout && svWidth) {
      if (w !== undefined && s.centerX) {
        s.x = Math.round((availWidth - s.scale * w) / 2 + (padding && padding.left || 0));
      }
      if (w !== undefined && s.left == undefined && s.right != undefined) {
        s.x = Math.round(availWidth - s.scale * w - s.right - (padding && padding.right || 0));
      }
      if (s.left != undefined) {
        s.x = Math.round(s.left + (padding && padding.left || 0));
      }
    }
  }
  reflowY() {
    var view = this._view;
    var s = view.style;
    var sv = view.getSuperview();
    if (s.inLayout && sv.style.layout == 'linear') {
      var inLinearLayout = sv.__layout.isVertical();
      var padding = sv.style.padding;
    }




    var svHeight = sv.style.height;
    var availHeight = svHeight - (padding && padding.getVertical() || 0);

    var wrapContent = s._layoutHeight == 'wrapContent';

    // compute the height
    var h;
    if (wrapContent) {
      h = this.getContentHeight() + s.padding.bottom;
    } else if (!inLinearLayout && svHeight && s.top != undefined && s.bottom != undefined) {
      h = availHeight / s.scale - (s.top || 0) - (s.bottom || 0);
    } else if (svHeight && s._layoutHeightIsPercent) {
      h = availHeight / s.scale * s._layoutHeightValue;
    } else if (s.height == undefined && svHeight) {
      h = availHeight / s.scale;
    } else {
      h = s.height;
    }

























    // enforce center anchor on height change
    if (s.centerAnchor) {
      s.anchorY = (h || 0) / 2;
    }




    s._height = h;

    if (!inLinearLayout && svHeight) {
      if (h !== undefined && s.centerY) {
        s.y = Math.round((availHeight - s.scale * h) / 2 + (padding && padding.top || 0));
      }
      if (h !== undefined && s.top == undefined && s.bottom != undefined) {
        s.y = Math.round(availHeight - s.scale * h - s.bottom - (padding && padding.bottom || 0));
      }
      if (s.top != undefined) {
        s.y = Math.round(s.top + (padding && padding.top || 0));
      }
    }
  }
  getContentWidth() {
    // find the maximal right edge
    var w = 0;
    var views = this._view.getSubviews();
    for (var i = 0, v; v = views[i]; ++i) {
      if (!v.style._layoutWidthIsPercent && v.style.visible) {
        var right = v.style.x + v.style.width * v.style.scale + (v.style.right || 0);
        if (right > w) {
          w = right;
        }
      }
    }
    return w;
  }
  getContentHeight() {
    // find the maximal bottom edge
    var views = this._view.getSubviews();
    var h = 0;
    for (var i = 0, v; v = views[i]; ++i) {
      if (!v.style._layoutHeightIsPercent && v.style.visible) {
        var bottom = v.style.y + v.style.height * v.style.scale + (v.style.bottom || 0);
        if (bottom > h) {
          h = bottom;
        }
      }
    }
    return h;
  }
};
var BoxLayout = exports;

export default exports;
