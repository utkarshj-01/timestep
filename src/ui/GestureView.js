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
import ui.View as View;

import math.geom.Vec2D as Vec2D;

exports = Class(View, function (supr) {
	this.init = function (opts) {
		supr(this, 'init', [opts]);
		this._swipeMagnitude = opts.swipeMagnitude || 150;
		this._swipeTime = opts.swipeTime || 250;
		this._swipeStartTime = null;
		this._fingerOne = null;
		this._fingerTwo = null;
		this._initialDistance = null;
		this._initialAngle = null;
		this._dragPoints = {};
	};

	this.onInputStart = function (evt) {
		this.startDrag();
	};

	this.onDragStart = function (dragEvent) {
		var point = {x: dragEvent.srcPoint.x, y: dragEvent.srcPoint.y};
		var index = 'p' + dragEvent.id;
		this._dragPoints[index] = point;
		if (this._fingerOne && this._fingerOne != index) {
			this._fingerTwo = index;
		} else {
			this._fingerOne = index;
			this._swipeStartTime = Date.now();
		}
	};

	this.onInputSelect = this.onInputOut = function (evt) {
		this._dragPoints = {};
		this._fingerOne = null;
		this._fingerTwo = null;
		this._initialDistance = null;
		this._initialAngle = null;
	};

	this.onDrag = function (dragEvent, moveEvent, delta) {
		if (this._fingerOne && this._fingerTwo) {
			this._dragPoints['p' + dragEvent.id] = {x: moveEvent.srcPoint.x, y: moveEvent.srcPoint.y};
			var p1 = this._dragPoints[this._fingerOne];
			var p2 = this._dragPoints[this._fingerTwo];
			var dx = p2.x - p1.x;
			var dy = p2.y - p1.y;
			var d = Math.sqrt(dx * dx + dy * dy);
			var dragVec = new Vec2D({x: dx, y: dy});
			var angle = dragVec.getAngle();
			if (this._initialDistance === null) {
				this._initialDistance = d;
				this._initialAngle = angle;
			} else {
				this.emit('Pinch', d / this._initialDistance);
				this.emit('Rotate', angle - this._initialAngle);
			}
		}
	};

	this.onDragStop = function (dragEvent, selectEvent) {
		var dy = dragEvent.srcPoint.y - selectEvent.srcPoint.y;
		var dx = dragEvent.srcPoint.x - selectEvent.srcPoint.x;
		var swipeVec = new Vec2D({x: dx, y: dy});
		var mag = swipeVec.getMagnitude();
		var dt = Date.now() - this._swipeStartTime;
		if ((mag > this._swipeMagnitude) && (dt < this._swipeTime)) {
			var degrees = swipeVec.getAngle() * (180 / Math.PI);
			this.emit('Swipe', (degrees > 60 && degrees < 120) ? 'up'
				: (degrees < -60 && degrees > -120) ? 'down'
				: (degrees > 120 || degrees < -120) ? 'right' : 'left');
		}
	};
});