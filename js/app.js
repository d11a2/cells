var app;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../node_modules/load-script/index.js":
/*!***********************************************!*\
  !*** ../../node_modules/load-script/index.js ***!
  \***********************************************/
/***/ ((module) => {

module.exports = function load(src, opts, cb) {
  var head = document.head || document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts = opts || {};
  cb = cb || function () {};
  script.type = opts.type || 'text/javascript';
  script.charset = opts.charset || 'utf8';
  script.async = 'async' in opts ? !!opts.async : true;
  script.src = src;
  if (opts.attrs) {
    setAttributes(script, opts.attrs);
  }
  if (opts.text) {
    script.text = '' + opts.text;
  }
  var onend = 'onload' in script ? stdOnEnd : ieOnEnd;
  onend(script, cb);

  // some good legacy browsers (firefox) fail the 'in' detection above
  // so as a fallback we always set onload
  // old IE will ignore this and new IE will set onload
  if (!script.onload) {
    stdOnEnd(script, cb);
  }
  head.appendChild(script);
};
function setAttributes(script, attrs) {
  for (var attr in attrs) {
    script.setAttribute(attr, attrs[attr]);
  }
}
function stdOnEnd(script, cb) {
  script.onload = function () {
    this.onerror = this.onload = null;
    cb(null, script);
  };
  script.onerror = function () {
    // this.onload = null here is necessary
    // because even IE9 works not like others
    this.onerror = this.onload = null;
    cb(new Error('Failed to load ' + this.src), script);
  };
}
function ieOnEnd(script, cb) {
  script.onreadystatechange = function () {
    if (this.readyState != 'complete' && this.readyState != 'loaded') return;
    this.onreadystatechange = null;
    cb(null, script); // there is no way to catch loading errors in IE8
  };
}

/***/ }),

/***/ "../../node_modules/pubsub/index.js":
/*!******************************************!*\
  !*** ../../node_modules/pubsub/index.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = PubSub;
function PubSub(mix) {
  var proxy = mix || function pubsubProxy() {
    arguments.length && sub.apply(undefined, arguments);
  };
  function sub(callback) {
    subscribe(proxy, callback);
  }
  function subOnce(callback) {
    once(proxy, callback);
  }
  function unsubOnce(callback) {
    unsubscribeOnce(proxy, callback);
  }
  function unsub(callback) {
    unsubscribe(proxy, callback);
  }
  function pub() {
    var args = [proxy];
    Array.prototype.push.apply(args, arguments);
    publish.apply(undefined, args);
  }
  proxy.subscribers = [];
  proxy.subscribersForOnce = [];
  proxy.subscribe = sub;
  proxy.subscribe.once = subOnce;
  proxy.unsubscribe = unsub;
  proxy.unsubscribe.once = unsubOnce;
  proxy.publish = pub;
  return proxy;
}

/**
 * Publish "from" by applying given args
 *
 * @param {Function} from
 * @param {...Any} args
 */
function publish(from) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (from && from.subscribers && from.subscribers.length > 0) {
    from.subscribers.forEach(function (cb, i) {
      if (!cb) return;
      try {
        cb.apply(undefined, args);
      } catch (exc) {
        setTimeout(function () {
          throw exc;
        }, 0);
      }
    });
  }
  if (from && from.subscribersForOnce && from.subscribersForOnce.length > 0) {
    from.subscribersForOnce.forEach(function (cb, i) {
      if (!cb) return;
      try {
        cb.apply(undefined, args);
      } catch (exc) {
        setTimeout(function () {
          throw exc;
        }, 0);
      }
    });
    from.subscribersForOnce = [];
  }
}

/**
 * Subscribe callback to given pubsub object.
 *
 * @param {Pubsub} to
 * @param {Function} callback
 */
function subscribe(to, callback) {
  if (!callback) return false;
  return to.subscribers.push(callback);
}

/**
 * Subscribe callback to given pubsub object for only one publish.
 *
 * @param {Pubsub} to
 * @param {Function} callback
 */
function once(to, callback) {
  if (!callback) return false;
  return to.subscribersForOnce.push(callback);
}

/**
 * Unsubscribe callback to given pubsub object.
 *
 * @param {Pubsub} to
 * @param {Function} callback
 */
function unsubscribe(to, callback) {
  var i = to.subscribers.length;
  while (i--) {
    if (to.subscribers[i] && to.subscribers[i] == callback) {
      to.subscribers[i] = undefined;
      return i;
    }
  }
  return false;
}

/**
 * Unsubscribe callback subscribed for once to specified pubsub.
 *
 * @param {Pubsub} to
 * @param {Function} callback
 * @return {Boolean or Number}
 */
function unsubscribeOnce(to, callback) {
  var i = to.subscribersForOnce.length;
  while (i--) {
    if (to.subscribersForOnce[i] && to.subscribersForOnce[i] == callback) {
      to.subscribersForOnce[i] = undefined;
      return i;
    }
  }
  return false;
}

/***/ }),

/***/ "../../node_modules/require-sdk/index.js":
/*!***********************************************!*\
  !*** ../../node_modules/require-sdk/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var pubsub = __webpack_require__(/*! pubsub */ "../../node_modules/pubsub/index.js");
var loadScript = __webpack_require__(/*! load-script */ "../../node_modules/load-script/index.js");
module.exports = requireSDK;
function requireSDK(url, global) {
  var onReady = pubsub();
  var hasManualTrigger;
  var isLoading;
  var isLoaded;
  load.trigger = setManualTrigger;
  return load;
  function isAlreadyLoaded() {
    return window[global];
  }
  function load(callback) {
    if (isAlreadyLoaded() || isLoaded) {
      return callback && callback(undefined, window[global]);
    }
    callback && onReady.subscribe(callback);
    if (isLoading) return;
    isLoading = true;
    if (!url) return;
    loadScript(url, function (error) {
      if (hasManualTrigger) return;
      if (error) {
        isLoaded = true;
        return onReady.publish(error);
      }
      trigger();
    });
  }
  ;
  function trigger() {
    isLoaded = true;
    onReady.publish(undefined, global ? window[global] : undefined);
  }
  function setManualTrigger() {
    hasManualTrigger = true;
    return trigger;
  }
}

/***/ }),

/***/ "../../node_modules/youtube-iframe-player/index.js":
/*!*********************************************************!*\
  !*** ../../node_modules/youtube-iframe-player/index.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var requireSDK = __webpack_require__(/*! require-sdk */ "../../node_modules/require-sdk/index.js");

/**
 * This module give you access to youtube iframe player api.
 * @type {Object}
 */
module.exports = {
  //Direct reference to the original player (https://developers.google.com/youtube/iframe_api_reference)
  player: null,
  init: function init(onComplete) {
    var requireYoutube = requireSDK('https://www.youtube.com/iframe_api', 'YT');
    /**
     * @todo We need try to avoid the use of window.
     * YouTube API call onYouTubeIframeAPIReady() when is loaded,
     * it is the only way to know when is ready to be used.
     */
    __webpack_require__.g.onYouTubeIframeAPIReady = requireYoutube.trigger();

    //Load youtube api
    requireYoutube(function () {
      onComplete();
    }.bind(this));
  },
  /**
   * Call YT.player(), this will create a player inside the container element.
   * @param  {[type]} containerID Container element id
   * @param  {[type]} params      See https://developers.google.com/youtube/iframe_api_reference
   * @return player             A reference of the player.
   */
  createPlayer: function createPlayer(containerID, params) {
    return this.player = new YT.Player(containerID, params);
  },
  /**
   * Load a video (youtube video ID) in the player. 
   * @param  {[type]} videoID [description]
   * @return {[type]}         [description]
   */
  loadVideo: function loadVideo(videoID) {
    if (this.player) {
      this.player.loadVideoById(videoID);
    } else {
      console.log('You should create.');
    }
  },
  /**
   * Play video.
   * https://developers.google.com/youtube/iframe_api_reference#playVideo
   * @return void
   */
  play: function play() {
    this.player.playVideo();
  },
  /**
   * Stops and cancels loading of the current video. 
   * This function should be reserved for rare situations when you know that the user will not be
   * watching additional video in the player.
   * https://developers.google.com/youtube/iframe_api_reference#stopVideo
   * @return void
   */
  stop: function stop() {
    this.player.stopVideo();
  },
  /**
   * Pauses the currently playing video.
   * https://developers.google.com/youtube/iframe_api_reference#pauseVideo
   * @return void
   */
  pause: function pause() {
    this.player.pauseVideo();
  },
  /**
   * Seeks to a specified time in the video. If the player is paused when the function is called, it will remain paused. 
   * https://developers.google.com/youtube/iframe_api_reference#seekTo
   * @param  {Number} seconds         time to which the player should advance.
   * @param  {[type]} allowSeekAhead parameter determines whether the player will make a new request to the server if the seconds parameter specifies a time outside of the currently buffered video data. (https://developers.google.com/youtube/iframe_api_reference#seekTo)
   * @return {void}                void
   */
  seekTo: function seekTo(seconds, allowSeekAhead) {
    this.player.seekTo(seconds, allowSeekAhead);
  },
  /**
   * Seeks to a specified time in the video. If the player is paused when the function is called, it will remain paused.
   * @return {[type]} [description]
   */
  clear: function clear() {
    this.player.clearVideo();
  },
  /**
   * Removes the <iframe> containing the player.
   * @return void
   */
  destroy: function destroy() {
    this.player.getDuration();
  }
};

/***/ }),

/***/ "./modules/Controls.js":
/*!*****************************!*\
  !*** ./modules/Controls.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Controls)
/* harmony export */ });


function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Controls = /*#__PURE__*/function () {
  function Controls(element, _player, property) {
    var _this = this;
    _classCallCheck(this, Controls);
    _defineProperty(this, "watchCurrentTime", function (player) {
      clearInterval(Controls.interval);
      Controls.interval = setInterval(function () {
        Controls.setTime(player.currentTime, player.currentTimeElement);
        Controls.setTime(player.duration, player.durationElement);
        _this.position = player.currentTime / player.duration;
      }, 500);
    });
    this.player = _player;
    this.property = property;
    this.element = element;
    this.parent = element.parentNode;
    this.element.onmouseover = function () {
      _this.element.onmousedown = _this.onmousedownHandler.bind(_this);
      // this.element.style.backgroundColor = 'red';
    };

    this.element.onmouseout = function () {
      _this.element.onmousedown = null;
      document.onmousemove = null;
    };
  }
  _createClass(Controls, [{
    key: "onmousedownHandler",
    value: function onmousedownHandler(event) {
      var _this2 = this;
      ondragstart = function ondragstart() {
        return false;
      };
      var shiftX = event.clientX - this.element.getBoundingClientRect().left;
      var parentX = this.parent.getBoundingClientRect().left;
      var moveAt = function moveAt(pageX) {
        var elementWidth = _this2.element.getBoundingClientRect().width;
        var parentWidth = _this2.parent.getBoundingClientRect().width;
        var percent = (pageX - shiftX - parentX) / parentWidth;
        var propertyPercent = (pageX - shiftX - parentX) / (parentWidth - elementWidth);
        if (0 <= propertyPercent && propertyPercent <= 1) {
          _this2.position = percent;
          _this2.player[_this2.property] = propertyPercent > 1 ? 1 : propertyPercent;
        } else {
          _this2.element.onmouseup();
          return;
        }
      };
      function onMouseMove(event) {
        moveAt(event.pageX);
      }
      document.onmousemove = onMouseMove;
      this.element.onmouseup = function () {
        document.onmousemove = null;
      };
    }
  }, {
    key: "position",
    set: function set(percent) {
      this.element.style.left = percent * 100 + '%';
    }
  }], [{
    key: "toggleControls",
    value: function toggleControls() {
      var isAudio = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (isAudio) {
        document.querySelector('#controls__next-btn').classList.remove('player-buttons__button--inactive');
        document.querySelector('#controls__prev-btn').classList.remove('player-buttons__button--inactive');
      } else {
        document.querySelector('#controls__next-btn').classList.add('player-buttons__button--inactive');
        document.querySelector('#controls__prev-btn').classList.add('player-buttons__button--inactive');
      }
      document.querySelector('.controls').classList.toggle('controls--active');
    }
  }]);
  return Controls;
}();
_defineProperty(Controls, "convertSeconds", function (totalSeconds) {
  var hours = parseInt(totalSeconds / 3600);
  var minutes = parseInt((totalSeconds - hours * 3600) / 60);
  var seconds = parseInt(totalSeconds - hours * 3600 - minutes * 60);
  return {
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
});
_defineProperty(Controls, "setTime", function (seconds, element) {
  var currentTimeObj = Controls.convertSeconds(seconds);
  element.innerHTML = (currentTimeObj.hours ? currentTimeObj.hours > 9 ? "".concat(currentTimeObj.hours, ":") : "0".concat(currentTimeObj.hours, ":") : '00:') + (currentTimeObj.minutes ? currentTimeObj.minutes > 9 ? "".concat(currentTimeObj.minutes, ":") : "0".concat(currentTimeObj.minutes, ":") : '00:') + (currentTimeObj.seconds ? currentTimeObj.seconds > 9 ? "".concat(currentTimeObj.seconds) : "0".concat(currentTimeObj.seconds) : '00');
});
_defineProperty(Controls, "interval", null);

;

/***/ }),

/***/ "./modules/audioPlayer.js":
/*!********************************!*\
  !*** ./modules/audioPlayer.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AudioPlayer)
/* harmony export */ });
/* harmony import */ var _Controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Controls */ "./modules/Controls.js");


function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function AudioPlayer(playerElementSelector, progressElementSelector, volumeElementSelector, currentTimeElementSelector, durationElementSelector) {
  var _this$playlist,
    _this = this;
  _Controls__WEBPACK_IMPORTED_MODULE_0__["default"].toggleControls(true);
  this.playerElement = document.querySelector('#audio-player');
  this.audioElement = document.createElement('audio');
  this.audioElement.setAttribute('id', 'audio-element');
  this.audioElement.setAttribute('class', 'audio-player__audio-element');
  this.playerElement.appendChild(this.audioElement);
  var progressElement = document.querySelector(progressElementSelector);
  var volumeElement = document.querySelector(volumeElementSelector);
  this.progressController = new _Controls__WEBPACK_IMPORTED_MODULE_0__["default"](progressElement, this, 'currentTime');
  this.volumeController = new _Controls__WEBPACK_IMPORTED_MODULE_0__["default"](volumeElement, this, 'volume');
  this.currentTimeElement = document.querySelector(currentTimeElementSelector);
  this.durationElement = document.querySelector(durationElementSelector);
  this.isPlaying = false;
  this.playlist = (_this$playlist = {
    playlistElement: this.playlistElement,
    tracks: ['./mixes/Years Of Denial - Lover-\'s Crime.mp3', './mixes/Foreign Policy - Young People.mp3', './mixes/Kamavosian - DuiSternis.mp3'],
    index: 0
  }, _defineProperty(_this$playlist, Symbol.iterator, function () {
    this.index = -1;
    return this;
  }), _defineProperty(_this$playlist, "next", function next() {
    if (this.index < this.tracks.length - 1) {
      return {
        done: false,
        value: this.tracks[++this.index]
      };
    }
    this.index = 0;
    return {
      done: true,
      value: this.tracks[this.index]
    };
  }), _defineProperty(_this$playlist, "prev", function prev() {
    if (this.index > 0) {
      return {
        done: null,
        value: this.tracks[--this.index]
      };
    }
    this.index = this.tracks.length - 1;
    return {
      done: null,
      value: this.tracks[this.index]
    };
  }), _defineProperty(_this$playlist, "current", function current() {
    return {
      done: null,
      value: this.tracks[this.index]
    };
  }), _this$playlist);
  this.setTrackSource = function (value) {
    return _this.audioElement.src = value;
  };

  // create audio context
  this.createAudioContext = function () {
    return new Promise(function (resolve, reject) {
      var context = new (AudioContext || webkitAudioContext)();
      var destination = context.destination;
      var analyserNode = context.createAnalyser();
      var sourceNode = context.createMediaElementSource(_this.audioElement);
      sourceNode.connect(analyserNode);
      analyserNode.connect(destination);
      _this.setTrackSource(_this.playlist.current().value);
      resolve(analyserNode);
    });
  };
  this.canvasObject = this.createAudioContext().then(function (analyserNode) {
    // append canvas element
    _this.canvasElement = document.createElement('canvas');
    _this.canvasElement.setAttribute('id', 'visualizer');
    _this.canvasElement.setAttribute('width', _this.playerElement.getBoundingClientRect().width + 'px');
    _this.canvasElement.setAttribute('height', _this.playerElement.getBoundingClientRect().height + 'px');
    _this.playerElement.appendChild(_this.canvasElement);

    // create anonymous canvas object
    return {
      context: _this.canvasElement.getContext("2d"),
      WIDTH: _this.canvasElement.width,
      HEIGHT: _this.canvasElement.height,
      barGap: 0.5,
      analyserNode: analyserNode
    };
  }).then(function (canvasObject) {
    return (
      // create function field visualize for AudioPlayer
      _this.visualize = function () {
        canvasObject.analyserNode.fftSize = 128;
        var bufferLength = canvasObject.analyserNode.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        canvasObject.context.clearRect(0, 0, canvasObject.WIDTH, canvasObject.HEIGHT);
        var drawVisual;
        var barWidth = canvasObject.WIDTH / (2 * bufferLength) - canvasObject.barGap;
        var draw = function () {
          drawVisual = requestAnimationFrame(draw);
          var barHeight;
          try {
            canvasObject.analyserNode.getByteFrequencyData(dataArray);
            canvasObject.context.fillStyle = 'rgb(0, 0, 0)';
            canvasObject.context.fillRect(0, 0, canvasObject.WIDTH, canvasObject.HEIGHT);
            var xr = canvasObject.WIDTH / 2;
            var xl = canvasObject.WIDTH / 2;
            for (var i = 1; i < bufferLength; i++) {
              barHeight = dataArray[i];
              canvasObject.context.fillStyle = "rgb( \n                    ".concat(barHeight, " ,").concat(barHeight - 200, ",").concat(barHeight - 200, ")");
              canvasObject.context.fillRect(xr, canvasObject.HEIGHT / 2 - barHeight / 2, barWidth, barHeight);
              xr += barWidth + canvasObject.barGap;
              canvasObject.context.fillStyle = "rgb( \n                    ".concat(barHeight, " ,").concat(barHeight - 200, ",").concat(barHeight - 200, ")");
              canvasObject.context.fillRect(xl, canvasObject.HEIGHT / 2 - barHeight / 2, barWidth, barHeight);
              xl -= barWidth + canvasObject.barGap;
            }
            if (!this.isPlaying) {
              cancelAnimationFrame(drawVisual);
            }
          } catch (e) {
            cancelAnimationFrame(drawVisual);
            console.error(e);
          }
        }.bind(_this);
        draw();
      }
    );
  });
  this.play = function () {
    if (_this.isPlaying) {
      _this.audioElement.pause();
      _this.isPlaying = false;
    } else {
      _this.audioElement.play();
      _this.isPlaying = true;
      _this.progressController.watchCurrentTime(_this);
      _this.visualize();
    }
  };
  this.playNext = function () {
    _this.progressController.position = 0;
    _this.isPlaying = false;
    _this.setTrackSource(_this.playlist.next().value);
    _this.play();
  };
  this.playPrev = function () {
    _this.progressController.position = 0;
    _this.isPlaying = false;
    _this.setTrackSource(_this.playlist.prev().value);
    _this.play();
  };
  Object.defineProperties(this, {
    volume: {
      configurable: false,
      enumerable: false,
      // percent
      set: function set(value) {
        this.audioElement.volume = value;
      }
    },
    currentTime: {
      configurable: false,
      enumerable: false,
      get: function get() {
        return this.audioElement.currentTime;
      },
      // seconds
      set: function set(value) {
        this.audioElement.currentTime = this.duration * value;
      }
    },
    duration: {
      configurable: false,
      enumerable: false,
      get: function get() {
        return this.audioElement.duration;
      }
    },
    error: {
      configurable: false,
      enumerable: false,
      get: function get() {
        return this.audioElement.error;
      }
    }
  });
  this.deletePlayer = function () {
    _this.audioElement.remove();
    _this.canvasElement.remove();
    _Controls__WEBPACK_IMPORTED_MODULE_0__["default"].toggleControls(true);
  };
}
;

/***/ }),

/***/ "./modules/mailer.js":
/*!***************************!*\
  !*** ./modules/mailer.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Mailer)
/* harmony export */ });
/* harmony import */ var js_base64__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-base64 */ "../../node_modules/js-base64/base64.mjs");


function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function Mailer(sender, password) {
  var _this = this;
  toggleFormFields();
  this.sender = sender;
  var pass = password;
  function hideOrShowMailerElement() {
    document.querySelector('#mailer').classList.toggle('mailer--active');
  }
  hideOrShowMailerElement();
  function disableInputs() {
    document.querySelectorAll('.form__input').forEach(function (element) {
      return element.setAttribute('readonly', 'true');
    });
  }
  function enableInputs() {
    document.querySelectorAll('.form__input').forEach(function (element) {
      return element.removeAttribute('readonly');
    });
  }
  disableInputs();
  function appendGoogleScripts() {
    var app = document.querySelector('#app');
    var apisScript = document.createElement('script');
    apisScript.setAttribute('id', 'apis');
    apisScript.setAttribute('src', 'https://apis.google.com/js/api.js');
    var gsiScript = document.createElement('script');
    gsiScript.setAttribute('id', 'gsi');
    gsiScript.setAttribute('src', 'https://accounts.google.com/gsi/client');
    app.before(gsiScript);
    app.before(apisScript);
  }
  function removeGoogleScripts() {
    document.querySelector('#apis').remove();
    document.querySelector('#gsi').remove();
  }
  appendGoogleScripts();
  var CLIENT_ID = '198265400971-m6velgm0bo64dhafc81vl2l01lf1gefb.apps.googleusercontent.com';
  var API_KEY = 'AIzaSyD0D9CJX62TmwDpGrd19y0Jw7jxgfzfOqQ';

  // Discovery doc URL for APIs used by the quickstart
  var DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = 'https://www.googleapis.com/auth/gmail.send';
  var tokenClient;
  var gapiInited = false;
  var gisInited = false;
  document.getElementById('authorize_button').style.visibility = 'hidden';
  document.getElementById('signout_button').style.visibility = 'hidden';

  /**
   * Callback after api.js is loaded.
   */
  this.gapiLoaded = function () {
    gapi.load('client', _this.initializeGapiClient);
  };

  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
   */
  this.initializeGapiClient = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: [DISCOVERY_DOC]
            });
          case 2:
            gapiInited = true;
            _this.maybeEnableButtons();
          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  /**
   * Callback after Google Identity Services are loaded.
   */
  this.gisLoaded = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '' // defined later
    });

    gisInited = true;
    _this.maybeEnableButtons();
  };

  /**
   * Enables user interaction after all libraries are loaded.
   */
  this.maybeEnableButtons = function () {
    if (gapiInited && gisInited) {
      document.getElementById('authorize_button').style.visibility = 'visible';
    }
  };

  /**
   *  Sign in the user upon button click.
   */
  this.handleAuthClick = function () {
    tokenClient.callback = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(resp) {
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(resp.error !== undefined)) {
                  _context2.next = 2;
                  break;
                }
                throw resp;
              case 2:
                document.getElementById('signout_button').style.visibility = 'visible';
                document.getElementById('authorize_button').innerText = 'Refresh';
                enableInputs();
              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));
      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    }();
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({
        prompt: 'consent'
      });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({
        prompt: ''
      });
    }
  };

  /**
   *  Sign out the user upon button click.
   */
  this.handleSignoutClick = function () {
    var token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      document.getElementById('content').innerText = '';
      document.getElementById('authorize_button').innerText = 'Authorize';
      document.getElementById('signout_button').style.visibility = 'hidden';
      disableInputs();
    }
  };
  document.querySelector('#apis').onload = this.gapiLoaded;
  document.querySelector('#gsi').onload = this.gisLoaded;
  document.querySelector('#authorize_button').onclick = this.handleAuthClick;
  document.querySelector('#signout_button').onclick = this.handleSignoutClick;
  function makeEmailMessage(to, from, subject, messageText) {
    var str = ['Content-Type: text/plain; charset="UTF-8"\n', 'to: ', to, '\n', 'from: ', from, '\n', 'subject: =?utf-8?B?', (0,js_base64__WEBPACK_IMPORTED_MODULE_0__.encode)(subject, true), '?=\n\n', messageText].join('');
    return (0,js_base64__WEBPACK_IMPORTED_MODULE_0__.encode)(str, true);
  }
  var setConfirmationMessage = function setConfirmationMessage() {
    var errorBlock = document.querySelector('#form__error');
    var color = errorBlock.style.color;
    function deleteErrorMessage() {
      errorBlock.innerHTML = '';
      errorBlock.classList.remove('blink');
      errorBlock.style.color = color;
    }
    errorBlock.style.color = 'teal';
    errorBlock.innerHTML = 'Message sent';
    errorBlock.classList.add('blink');
    setTimeout(deleteErrorMessage, 3000);
  };
  function sendEmailMessage(from) {
    var to = document.querySelector('#to').value;
    var subject = document.querySelector('#subject').value;
    var message = document.querySelector('#message').value;
    var encodedMessage = makeEmailMessage(to, from, subject, message);
    gapi.client.gmail.users.messages.send({
      'userId': 'omnenet@gmail.com',
      'resource': {
        'raw': encodedMessage
      }
    }).execute(function (res) {
      if (res.labelIds.includes('INBOX')) {
        setConfirmationMessage();
      }
    });
  }
  ;
  function toggleFormFields() {
    document.querySelectorAll('.form__field').forEach(function (element) {
      return element.classList.toggle('form__field--active');
    });
    document.querySelector('.help').classList.toggle('help--active');
  }
  this.deleteMailer = function () {
    removeGoogleScripts();
    toggleFormFields();
    setTimeout(hideOrShowMailerElement, 3000);
  };
  var validateEmail = function validateEmail() {
    var input = document.querySelector('#to');
    var errorBlock = document.querySelector('#form__error');
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    function deleteErrorMessage() {
      errorBlock.innerHTML = '';
      errorBlock.classList.remove('blink');
    }
    function addErrorMessage() {
      var isError = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      if (isError) {
        errorBlock.innerHTML = 'Invalid email';
        errorBlock.classList.add('blink');
      } else {
        errorBlock.style.color = 'teal';
        errorBlock.innerHTML = 'Message sent';
        errorBlock.classList.add('blink');
        setTimeout(deleteErrorMessage, 3000);
      }
    }
    if (input.value.match(validRegex)) {
      deleteErrorMessage();
      input.focus();
      return true;
    } else {
      addErrorMessage();
      input.focus();
      setTimeout(deleteErrorMessage, 3000);
      return false;
    }
  };
  document.querySelector('#form').onsubmit = function (e) {
    e.preventDefault();
  };
  document.querySelector('#send-btn').onclick = function () {
    if (validateEmail()) {
      sendEmailMessage(_this.sender);
    }
  };
  var copyPass = function copyPass() {
    navigator.clipboard.writeText(pass).then(function () {
      console.log('password copied');
    })["catch"](function (err) {
      console.log('Something went wrong', err);
    });
  };
  var copyEmail = function copyEmail() {
    navigator.clipboard.writeText(_this.sender).then(function () {
      console.log('email copied');
    })["catch"](function (err) {
      console.log('Something went wrong', err);
    });
  };
  document.querySelector('#copy__password').onclick = copyPass;
  document.querySelector('#copy__email').onclick = copyEmail;
}

/***/ }),

/***/ "./modules/videoPlayer.js":
/*!********************************!*\
  !*** ./modules/videoPlayer.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ VideoPlayer)
/* harmony export */ });
/* harmony import */ var youtube_iframe_player__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! youtube-iframe-player */ "../../node_modules/youtube-iframe-player/index.js");
/* harmony import */ var youtube_iframe_player__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(youtube_iframe_player__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Controls__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Controls */ "./modules/Controls.js");




function VideoPlayer(playerElementId, progressElementSelector, volumeElementSelector, currentTimeElementSelector, durationElementSelector) {
  var _this = this;
  _Controls__WEBPACK_IMPORTED_MODULE_1__["default"].toggleControls();
  var main = document.querySelector('#main');
  var element = document.createElement('div');
  element.setAttribute("class", playerElementId);
  element.setAttribute("id", playerElementId);
  main.prepend(element);
  this.playerReady = function (e) {
    _this.player.setVolume(100);
  };
  this.onPlayerStateChange = function (e) {};
  youtube_iframe_player__WEBPACK_IMPORTED_MODULE_0___default().init(function () {
    _this.player = new (youtube_iframe_player__WEBPACK_IMPORTED_MODULE_0___default().createPlayer)('video-player', {
      height: 0.56 * main.getBoundingClientRect().width,
      width: main.getBoundingClientRect().width,
      videoId: 'y5p8qdiAXSo',
      playerVars: {
        'autoplay': 0,
        'controls': 0,
        'fs': 1,
        'modestbranding': 1,
        'rel': 0,
        'start': 1
      },
      events: {
        'onReady': _this.playerReady,
        'onStateChange': _this.onPlayerStateChange
      }
    });
  });
  var progressElement = document.querySelector(progressElementSelector);
  var volumeElement = document.querySelector(volumeElementSelector);
  this.progressController = new _Controls__WEBPACK_IMPORTED_MODULE_1__["default"](progressElement, this, 'currentTime');
  this.volumeController = new _Controls__WEBPACK_IMPORTED_MODULE_1__["default"](volumeElement, this, 'volume');
  this.currentTimeElement = document.querySelector(currentTimeElementSelector);
  this.durationElement = document.querySelector(durationElementSelector);
  this.isPlaying = false;
  Object.defineProperties(this, {
    volume: {
      configurable: false,
      enumerable: false,
      // 1 - 100
      set: function set(value) {
        this.player.setVolume(value * 100);
      }
    },
    currentTime: {
      configurable: false,
      enumerable: false,
      get: function get() {
        return this.player.getCurrentTime();
      },
      // seconds
      set: function set(value) {
        this.player.seekTo(this.duration * value);
      }
    },
    duration: {
      configurable: false,
      enumerable: false,
      get: function get() {
        return this.player.getDuration();
      }
    }
  });
  this.play = function () {
    if (_this.isPlaying) {
      _this.player.pauseVideo();
      _this.isPlaying = false;
    } else {
      _this.player.playVideo();
      _this.progressController.watchCurrentTime(_this);
      _this.isPlaying = true;
    }
  };
  this.deletePlayer = function () {
    var element = document.querySelector('iframe');
    if (element) {
      element.remove();
    }
    _Controls__WEBPACK_IMPORTED_MODULE_1__["default"].toggleControls();
  };
}
;

/***/ }),

/***/ "../../node_modules/js-base64/base64.mjs":
/*!***********************************************!*\
  !*** ../../node_modules/js-base64/base64.mjs ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Base64": () => (/* binding */ gBase64),
/* harmony export */   "VERSION": () => (/* binding */ VERSION),
/* harmony export */   "atob": () => (/* binding */ _atob),
/* harmony export */   "atobPolyfill": () => (/* binding */ atobPolyfill),
/* harmony export */   "btoa": () => (/* binding */ _btoa),
/* harmony export */   "btoaPolyfill": () => (/* binding */ btoaPolyfill),
/* harmony export */   "btou": () => (/* binding */ btou),
/* harmony export */   "decode": () => (/* binding */ decode),
/* harmony export */   "encode": () => (/* binding */ encode),
/* harmony export */   "encodeURI": () => (/* binding */ encodeURI),
/* harmony export */   "encodeURL": () => (/* binding */ encodeURI),
/* harmony export */   "extendBuiltins": () => (/* binding */ extendBuiltins),
/* harmony export */   "extendString": () => (/* binding */ extendString),
/* harmony export */   "extendUint8Array": () => (/* binding */ extendUint8Array),
/* harmony export */   "fromBase64": () => (/* binding */ decode),
/* harmony export */   "fromUint8Array": () => (/* binding */ fromUint8Array),
/* harmony export */   "isValid": () => (/* binding */ isValid),
/* harmony export */   "toBase64": () => (/* binding */ encode),
/* harmony export */   "toUint8Array": () => (/* binding */ toUint8Array),
/* harmony export */   "utob": () => (/* binding */ utob),
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
/**
 *  base64.ts
 *
 *  Licensed under the BSD 3-Clause License.
 *    http://opensource.org/licenses/BSD-3-Clause
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 *
 * @author Dan Kogai (https://github.com/dankogai)
 */
const version = '3.7.5';
/**
 * @deprecated use lowercase `version`.
 */
const VERSION = version;
const _hasatob = typeof atob === 'function';
const _hasbtoa = typeof btoa === 'function';
const _hasBuffer = typeof Buffer === 'function';
const _TD = typeof TextDecoder === 'function' ? new TextDecoder() : undefined;
const _TE = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const b64chs = Array.prototype.slice.call(b64ch);
const b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
})(b64chs);
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
const _fromCC = String.fromCharCode.bind(String);
const _U8Afrom = typeof Uint8Array.from === 'function'
    ? Uint8Array.from.bind(Uint8Array)
    : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
const _mkUriSafe = (src) => src
    .replace(/=/g, '').replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_');
const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, '');
/**
 * polyfill version of `btoa`
 */
const btoaPolyfill = (bin) => {
    // console.log('polyfilled');
    let u32, c0, c1, c2, asc = '';
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length;) {
        if ((c0 = bin.charCodeAt(i++)) > 255 ||
            (c1 = bin.charCodeAt(i++)) > 255 ||
            (c2 = bin.charCodeAt(i++)) > 255)
            throw new TypeError('invalid character found');
        u32 = (c0 << 16) | (c1 << 8) | c2;
        asc += b64chs[u32 >> 18 & 63]
            + b64chs[u32 >> 12 & 63]
            + b64chs[u32 >> 6 & 63]
            + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
};
/**
 * does what `window.btoa` of web browsers do.
 * @param {String} bin binary string
 * @returns {string} Base64-encoded string
 */
const _btoa = _hasbtoa ? (bin) => btoa(bin)
    : _hasBuffer ? (bin) => Buffer.from(bin, 'binary').toString('base64')
        : btoaPolyfill;
const _fromUint8Array = _hasBuffer
    ? (u8a) => Buffer.from(u8a).toString('base64')
    : (u8a) => {
        // cf. https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/12713326#12713326
        const maxargs = 0x1000;
        let strs = [];
        for (let i = 0, l = u8a.length; i < l; i += maxargs) {
            strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
        }
        return _btoa(strs.join(''));
    };
/**
 * converts a Uint8Array to a Base64 string.
 * @param {boolean} [urlsafe] URL-and-filename-safe a la RFC4648 §5
 * @returns {string} Base64 string
 */
const fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const utob = (src: string) => unescape(encodeURIComponent(src));
// reverting good old fationed regexp
const cb_utob = (c) => {
    if (c.length < 2) {
        var cc = c.charCodeAt(0);
        return cc < 0x80 ? c
            : cc < 0x800 ? (_fromCC(0xc0 | (cc >>> 6))
                + _fromCC(0x80 | (cc & 0x3f)))
                : (_fromCC(0xe0 | ((cc >>> 12) & 0x0f))
                    + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
                    + _fromCC(0x80 | (cc & 0x3f)));
    }
    else {
        var cc = 0x10000
            + (c.charCodeAt(0) - 0xD800) * 0x400
            + (c.charCodeAt(1) - 0xDC00);
        return (_fromCC(0xf0 | ((cc >>> 18) & 0x07))
            + _fromCC(0x80 | ((cc >>> 12) & 0x3f))
            + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
            + _fromCC(0x80 | (cc & 0x3f)));
    }
};
const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-8 string
 * @returns {string} UTF-16 string
 */
const utob = (u) => u.replace(re_utob, cb_utob);
//
const _encode = _hasBuffer
    ? (s) => Buffer.from(s, 'utf8').toString('base64')
    : _TE
        ? (s) => _fromUint8Array(_TE.encode(s))
        : (s) => _btoa(utob(s));
/**
 * converts a UTF-8-encoded string to a Base64 string.
 * @param {boolean} [urlsafe] if `true` make the result URL-safe
 * @returns {string} Base64 string
 */
const encode = (src, urlsafe = false) => urlsafe
    ? _mkUriSafe(_encode(src))
    : _encode(src);
/**
 * converts a UTF-8-encoded string to URL-safe Base64 RFC4648 §5.
 * @returns {string} Base64 string
 */
const encodeURI = (src) => encode(src, true);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const btou = (src: string) => decodeURIComponent(escape(src));
// reverting good old fationed regexp
const re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
const cb_btou = (cccc) => {
    switch (cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                | ((0x3f & cccc.charCodeAt(1)) << 12)
                | ((0x3f & cccc.charCodeAt(2)) << 6)
                | (0x3f & cccc.charCodeAt(3)), offset = cp - 0x10000;
            return (_fromCC((offset >>> 10) + 0xD800)
                + _fromCC((offset & 0x3FF) + 0xDC00));
        case 3:
            return _fromCC(((0x0f & cccc.charCodeAt(0)) << 12)
                | ((0x3f & cccc.charCodeAt(1)) << 6)
                | (0x3f & cccc.charCodeAt(2)));
        default:
            return _fromCC(((0x1f & cccc.charCodeAt(0)) << 6)
                | (0x3f & cccc.charCodeAt(1)));
    }
};
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-16 string
 * @returns {string} UTF-8 string
 */
const btou = (b) => b.replace(re_btou, cb_btou);
/**
 * polyfill version of `atob`
 */
const atobPolyfill = (asc) => {
    // console.log('polyfilled');
    asc = asc.replace(/\s+/g, '');
    if (!b64re.test(asc))
        throw new TypeError('malformed base64.');
    asc += '=='.slice(2 - (asc.length & 3));
    let u24, bin = '', r1, r2;
    for (let i = 0; i < asc.length;) {
        u24 = b64tab[asc.charAt(i++)] << 18
            | b64tab[asc.charAt(i++)] << 12
            | (r1 = b64tab[asc.charAt(i++)]) << 6
            | (r2 = b64tab[asc.charAt(i++)]);
        bin += r1 === 64 ? _fromCC(u24 >> 16 & 255)
            : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255)
                : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
    }
    return bin;
};
/**
 * does what `window.atob` of web browsers do.
 * @param {String} asc Base64-encoded string
 * @returns {string} binary string
 */
const _atob = _hasatob ? (asc) => atob(_tidyB64(asc))
    : _hasBuffer ? (asc) => Buffer.from(asc, 'base64').toString('binary')
        : atobPolyfill;
//
const _toUint8Array = _hasBuffer
    ? (a) => _U8Afrom(Buffer.from(a, 'base64'))
    : (a) => _U8Afrom(_atob(a).split('').map(c => c.charCodeAt(0)));
/**
 * converts a Base64 string to a Uint8Array.
 */
const toUint8Array = (a) => _toUint8Array(_unURI(a));
//
const _decode = _hasBuffer
    ? (a) => Buffer.from(a, 'base64').toString('utf8')
    : _TD
        ? (a) => _TD.decode(_toUint8Array(a))
        : (a) => btou(_atob(a));
const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == '-' ? '+' : '/'));
/**
 * converts a Base64 string to a UTF-8 string.
 * @param {String} src Base64 string.  Both normal and URL-safe are supported
 * @returns {string} UTF-8 string
 */
const decode = (src) => _decode(_unURI(src));
/**
 * check if a value is a valid Base64 string
 * @param {String} src a value to check
  */
const isValid = (src) => {
    if (typeof src !== 'string')
        return false;
    const s = src.replace(/\s+/g, '').replace(/={0,2}$/, '');
    return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
};
//
const _noEnum = (v) => {
    return {
        value: v, enumerable: false, writable: true, configurable: true
    };
};
/**
 * extend String.prototype with relevant methods
 */
const extendString = function () {
    const _add = (name, body) => Object.defineProperty(String.prototype, name, _noEnum(body));
    _add('fromBase64', function () { return decode(this); });
    _add('toBase64', function (urlsafe) { return encode(this, urlsafe); });
    _add('toBase64URI', function () { return encode(this, true); });
    _add('toBase64URL', function () { return encode(this, true); });
    _add('toUint8Array', function () { return toUint8Array(this); });
};
/**
 * extend Uint8Array.prototype with relevant methods
 */
const extendUint8Array = function () {
    const _add = (name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body));
    _add('toBase64', function (urlsafe) { return fromUint8Array(this, urlsafe); });
    _add('toBase64URI', function () { return fromUint8Array(this, true); });
    _add('toBase64URL', function () { return fromUint8Array(this, true); });
};
/**
 * extend Builtin prototypes with relevant methods
 */
const extendBuiltins = () => {
    extendString();
    extendUint8Array();
};
const gBase64 = {
    version: version,
    VERSION: VERSION,
    atob: _atob,
    atobPolyfill: atobPolyfill,
    btoa: _btoa,
    btoaPolyfill: btoaPolyfill,
    fromBase64: decode,
    toBase64: encode,
    encode: encode,
    encodeURI: encodeURI,
    encodeURL: encodeURI,
    utob: utob,
    btou: btou,
    decode: decode,
    isValid: isValid,
    fromUint8Array: fromUint8Array,
    toUint8Array: toUint8Array,
    extendString: extendString,
    extendUint8Array: extendUint8Array,
    extendBuiltins: extendBuiltins,
};
// makecjs:CUT //




















// and finally,



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!****************!*\
  !*** ./app.js ***!
  \****************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modules_audioPlayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules/audioPlayer */ "./modules/audioPlayer.js");
/* harmony import */ var _modules_videoPlayer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modules/videoPlayer */ "./modules/videoPlayer.js");
/* harmony import */ var _modules_mailer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./modules/mailer */ "./modules/mailer.js");


function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct.bind(); } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }



var videoPlayer;
var audioPlayer;
var mailer;
var controlsSelectors = ['#controls__play-btn', '#controls__next-btn', '#controls__prev-btn', '#controls__progress-bar__handle', '#controls__volume__handle', '#controls__time__current', '#controls__time__duration'];
var audioPlayerParams = ['#audio-player'].concat(_toConsumableArray(controlsSelectors.slice(3)));
var cells = document.querySelectorAll(".cell");
var mainCell = document.querySelector("#main-cell");
var audioCell = document.querySelector('#cell--audio-btn');
var videoCell = document.querySelector('#cell--video-btn');
var mailCell = document.querySelector('#cell--mail-btn');
function moveCells() {
  cells.forEach(function (element) {
    return element.classList.toggle('moved');
  });
}
function destroyModules() {
  document.querySelector(controlsSelectors[0]).onclick = null;
  document.querySelector(controlsSelectors[1]).onclick = null;
  document.querySelector(controlsSelectors[2]).onclick = null;
  if (audioPlayer) {
    audioPlayer.deletePlayer();
    audioPlayer = null;
  }
  if (videoPlayer) {
    videoPlayer.deletePlayer();
    videoPlayer = null;
  }
  if (mailer) {
    mailer.deleteMailer();
    mailer = null;
  }
}
function createVideoPlayer() {
  moveCells();
  var videoPlayerParams = controlsSelectors.slice(3);
  videoPlayer = _construct(_modules_videoPlayer__WEBPACK_IMPORTED_MODULE_1__["default"], ['video-player'].concat(_toConsumableArray(videoPlayerParams)));
  document.querySelector(controlsSelectors[0]).onclick = videoPlayer.play;
}
function createAudioPlayer() {
  moveCells();
  audioPlayer = _construct(_modules_audioPlayer__WEBPACK_IMPORTED_MODULE_0__["default"], _toConsumableArray(audioPlayerParams));
  document.querySelector(controlsSelectors[0]).onclick = audioPlayer.play;
  document.querySelector(controlsSelectors[1]).onclick = audioPlayer.playNext;
  document.querySelector(controlsSelectors[2]).onclick = audioPlayer.playPrev;
}
function createMailer() {
  moveCells();
  mailer = new _modules_mailer__WEBPACK_IMPORTED_MODULE_2__["default"]('omnenet@gmail.com', 'kyswek-meqdu6-zyhHub');
}
videoCell.onclick = createVideoPlayer;
audioCell.onclick = createAudioPlayer;
mailCell.onclick = createMailer;
mainCell.onclick = function (event) {
  if (event.currentTarget.classList.contains('moved')) {
    moveCells();
    destroyModules();
  }
};
})();

app = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=app.js.map