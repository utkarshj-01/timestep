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
  merge,
  bind,
  logger
} from 'base';

import PubSub from 'lib/PubSub';
import SoundManager from './SoundManager';
import underscore from 'util/underscore';
let _ = underscore._;

var soundManager = new SoundManager();
soundManager.url = 'media/swf';
soundManager.flashVersion = 9;
soundManager.useMovieStar = true;
soundManager.debugMode = false;
soundManager.consoleOnly = true;
soundManager.useHighPerformance = true;
soundManager.useFastPolling = true;

/**
 * @extends lib.PubSub
 */
exports = class extends PubSub {
  constructor(opts) {
    opts = merge(opts, {
      map: {},
      background: []
    });

    super(opts);
    var path = opts.path;
    this._map = {};

    _.each(opts.background, function (name) {
      opts.map[name] = { 'name': name };
    }, this);

    soundManager.onready(bind(this, function () {
      logger.log('SoundManager onReady');
      for (key in opts.map) {
        logger.log('SoundManager key: ', key);
        var url = 'media/audio/' + key + '.mp3';
        var k = this._map[key] = soundManager.createSound({
          id: key,
          bufferTime: 3,
          url: url
        });
        k.load();
      }








      this.publish('Ready');
    }));
  }
  canPlay(name) {
    return name in this._map;
  }
  setVolume(volume) {
    this._soundPlaying && soundManager.setVolume(this._soundPlaying, volume);
    this._backgroundSoundPlaying && soundManager.setVolume(this._backgroundSoundPlaying, volume);
  }
  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.setVolume(0);
    }
  }
  play(name, volume, channel) {
    if (!this.canPlay(name)) {
      return;
    }
    if (this.muted) {
      return;
    }
    if (volume === undefined) {
      volume = 1;
    }
    this._soundPlaying = name;
    this._map[name].setVolume(volume * 100 | 0);
    this._map[name].play();
  }
  pause() {
    this._map[this._soundPlaying].pause();
    this._soundPlaying = null;
  }
  playBackgroundMusic(name, volume) {
    if (!this.canPlay(name)) {
      return;
    }
    if (this.muted) {
      return;
    }
    if (volume === undefined) {
      volume = 1;
    }
    this._backgroundSoundPlaying = name;
    this._map[name].setVolume(volume * 100 | 0);
    this._map[name].play();
  }
  pauseBackgroundMusic() {
    if (!this._backgroundSoundPlaying) {
      return;
    }
    this._map[this._backgroundSoundPlaying].pause();
    this._backgroundSoundPlaying = null;
  }
};
var AudioAPI = exports;

export default exports;
