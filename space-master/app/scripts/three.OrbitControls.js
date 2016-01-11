/**
 * Based on THREE.TrackballControls from the threejs.org examples, not
 *   THREE.OrbitControls. We call this OrbitControls because it is a more
 *   accurate name. Note that KIMCHI.camera.up gets changed when rotating.
 *   <br> Script: {@link
 *   https://github.com/mrdoob/three.js/blob/master/examples/js/controls/TrackballControls.js}
 *   <br> HTML: {@link
 *   https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_trackball.html}
 *   <br> Demo: {@link
 *   http://threejs.org/examples/misc_controls_trackball.html}
 * @constructor OrbitControls
 * @memberOf    external:THREE
 * @author      Eberhard Graether / http://egraether.com/
 * @author      Chris 2013-10-11
 */
THREE.OrbitControls = function (object, domElement) {
  var _this = this;
  var STATE = {
    'NONE': -1,
    'ROTATE': 0,
    'ZOOM': 1,
    'TOUCH_ROTATE': 3,
    'TOUCH_ZOOM': 4
  };

  this.object = object;
  this.domElement = (domElement !== undefined) ? domElement : document;

  // API

  this.enabled = true;

  this.screen = {
    'left': 0,
    'top': 0,
    'width': 0,
    'height': 0
  };

  this.rotateSpeed = 1.0;
  this.zoomSpeed = 1.2;

  this.noRotate = false;
  this.noZoom = false;
  this.noRoll = false;

  this.staticMoving = false;
  this.dynamicDampingFactor = 0.2;

  this.minDistance = 0;
  this.maxDistance = Infinity;

  // internals

  this.target = new THREE.Vector3();

  var lastPosition = new THREE.Vector3();

  var _state = STATE.NONE,
  _prevState = STATE.NONE,

  _eye = new THREE.Vector3(),

  _rotateStart = new THREE.Vector3(),
  _rotateEnd = new THREE.Vector3(),

  _zoomStart = new THREE.Vector2(),
  _zoomEnd = new THREE.Vector2(),

  _touchZoomDistanceStart = 0,
  _touchZoomDistanceEnd = 0;

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.up0 = this.object.up.clone();

  // events

  var changeEvent = { 'type': 'change' };


  // methods

  this.handleResize = function () {
    if (this.domElement === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      this.screen = this.domElement.getBoundingClientRect();
    }
  };

  this.handleEvent = function (event) {
    if (typeof this[ event.type ] === 'function') {
      this[ event.type ](event);
    }
  };

  this.getMouseOnScreen = function (clientX, clientY) {
    return new THREE.Vector2(
      (clientX - _this.screen.left) / _this.screen.width,
      (clientY - _this.screen.top) / _this.screen.height
   );
  };

  this.getMouseProjectionOnBall = function (clientX, clientY) {
    var mouseOnBall = new THREE.Vector3(
      (clientX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * 0.5),
      (_this.screen.height * 0.5 + _this.screen.top - clientY) / (_this.screen.height * 0.5),
      0.0
   );

    var length = mouseOnBall.length();

    if (_this.noRoll) {
      if (length < Math.SQRT1_2) {
        mouseOnBall.z = Math.sqrt(1.0 - length * length);
      } else {
        mouseOnBall.z = 0.5 / length;
      }
    } else if (length > 1.0) {
      mouseOnBall.normalize();
    } else {
      mouseOnBall.z = Math.sqrt(1.0 - length * length);
    }

    _eye.copy(_this.object.position).sub(_this.target);

    var projection = _this.object.up.clone().setLength(mouseOnBall.y);
    projection.add(_this.object.up.clone().cross(_eye).setLength(mouseOnBall.x));
    projection.add(_eye.setLength(mouseOnBall.z));

    return projection;
  };

  this.rotateCamera = function () {
    var angle = Math.acos(_rotateStart.dot(_rotateEnd) / _rotateStart.length() / _rotateEnd.length());

    if (angle) {
      var axis = (new THREE.Vector3()).crossVectors(_rotateStart, _rotateEnd).normalize(),
        quaternion = new THREE.Quaternion();

      angle *= _this.rotateSpeed;

      quaternion.setFromAxisAngle(axis, -angle);

      _eye.applyQuaternion(quaternion);
      _this.object.up.applyQuaternion(quaternion);

      _rotateEnd.applyQuaternion(quaternion);

      if (_this.staticMoving) {
        _rotateStart.copy(_rotateEnd);
      } else {
        quaternion.setFromAxisAngle(axis, angle * (_this.dynamicDampingFactor - 1.0));
        _rotateStart.applyQuaternion(quaternion);
      }
    }
  };

  this.zoomCamera = function () {
    var factor;

    if (_state === STATE.TOUCH_ZOOM) {
      factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
      _touchZoomDistanceStart = _touchZoomDistanceEnd;
      _eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;

      if (factor !== 1.0 && factor > 0.0) {
        _eye.multiplyScalar(factor);

        if (_this.staticMoving) {
          _zoomStart.copy(_zoomEnd);
        } else {
          _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
        }
      }
    }
  };

  this.checkDistances = function () {
    if (!_this.noZoom) {
      if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {
        _this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
      }
      if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
        _this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance));
      }
    }
  };

  this.update = function () {
    _eye.subVectors(_this.object.position, _this.target);

    if (!_this.noRotate) {
      _this.rotateCamera();
    }

    if (!_this.noZoom) {
      _this.zoomCamera();
    }

    _this.object.position.addVectors(_this.target, _eye);

    _this.checkDistances();

    _this.object.lookAt(_this.target);

    if (lastPosition.distanceToSquared(_this.object.position) > 0) {
      _this.dispatchEvent(changeEvent);

      lastPosition.copy(_this.object.position);
    }
  };

  this.reset = function () {
    _state = STATE.NONE;
    _prevState = STATE.NONE;

    // _this.target.copy(_this.target0);
    // _this.object.position.copy(_this.position0);
    _this.object.up.copy(_this.up0);

    _eye.subVectors(_this.object.position, _this.target);

    // _this.object.lookAt(_this.target);

    _this.dispatchEvent(changeEvent);

    lastPosition.copy(_this.object.position);
  };



  // listeners
  function mousedown(event) {
    event.preventDefault();
    event.stopPropagation();

    if (_state === STATE.NONE) {
      _state = event.button;
    }

    if (_state === STATE.ROTATE && !_this.noRotate) {
      _rotateStart = _this.getMouseProjectionOnBall(event.clientX, event.clientY);
      _rotateEnd.copy(_rotateStart);
    } else if (_state === STATE.ZOOM && !_this.noZoom) {
      _zoomStart = _this.getMouseOnScreen(event.clientX, event.clientY);
      _zoomEnd.copy(_zoomStart);
    }

    document.addEventListener('mousemove', mousemove, false);
    document.addEventListener('mouseup', mouseup, false);
  }

  function mousemove(event) {
    event.preventDefault();
    event.stopPropagation();

    if (_state === STATE.ROTATE && !_this.noRotate) {
      _rotateEnd = _this.getMouseProjectionOnBall(event.clientX, event.clientY);
    } else if (_state === STATE.ZOOM && !_this.noZoom) {
      _zoomEnd = _this.getMouseOnScreen(event.clientX, event.clientY);
    }
  }

  function mouseup(event) {
    event.preventDefault();
    event.stopPropagation();

    _state = STATE.NONE;

    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  }

  function mousewheel(event) {
    event.preventDefault();
    event.stopPropagation();

    var delta = 0;

    if (event.wheelDelta) { // WebKit / Opera / Explorer 9
      delta = event.wheelDelta / 40;
    } else if (event.detail) { // Firefox
      delta = - event.detail / 3;
    }

    _zoomStart.y += delta * 0.01;
  }

  function touchstart(event) {
    switch (event.touches.length) {
    case 1:
      _state = STATE.TOUCH_ROTATE;
      _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
      break;

    case 2:
      _state = STATE.TOUCH_ZOOM;
      var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
      var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
      _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
      break;

    default:
      _state = STATE.NONE;
    }
  }

  function touchmove(event) {
    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
    case 1:
      _rotateEnd = _this.getMouseProjectionOnBall(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
      break;

    case 2:
      var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
      var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
      _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
      break;

    default:
      _state = STATE.NONE;
    }
  }

  function touchend(event) {
    switch (event.touches.length) {
    case 1:
      _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
      break;

    case 2:
      _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
      break;
    }

    _state = STATE.NONE;
  }



  /**
   * Enable the controls. This code was moved out of the constructor because we
   *   need to be able to unbind the listeners.
   * @alias    enable
   * @instance
   * @memberOf external:THREE.OrbitControls
   */
  this.enable = function () {
    this.domElement.addEventListener('mousedown', mousedown, false);

    this.domElement.addEventListener('mousewheel', mousewheel, false);
    this.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox

    this.domElement.addEventListener('touchstart', touchstart, false);
    this.domElement.addEventListener('touchend', touchend, false);
    this.domElement.addEventListener('touchmove', touchmove, false);

    this.enabled = true;
  };

  /**
   * Disable the controls.
   * @alias    disable
   * @instance
   * @memberOf external:THREE.OrbitControls
   */
  this.disable = function () {
    this.enabled = false;

    this.domElement.removeEventListener('mousedown', mousedown, false);

    this.domElement.removeEventListener('mousewheel', mousewheel, false);
    this.domElement.removeEventListener('DOMMouseScroll', mousewheel, false);

    this.domElement.removeEventListener('touchstart', touchstart, false);
    this.domElement.removeEventListener('touchend', touchend, false);
    this.domElement.removeEventListener('touchmove', touchmove, false);

    this.reset();
  };



  // init
  this.handleResize();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
