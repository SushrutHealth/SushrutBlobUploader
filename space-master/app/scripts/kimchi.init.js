/**
 * Extensible module for KIMCHI.
 * <br>
 * <br> Conventions:
 * <br> Movement consists of translation and rotation. When only translating or
 *        rotating, do not use the word 'move'.
 * <br> "Bodies" refer to astronomical bodies.
 * @module KIMCHI
 */

var KIMCHI = (function (KIMCHI, Q) {
  'use strict';

  var initDeferred = Q.defer(), readyDeferred = Q.defer();



  /**
   * The first part of two in KIMCHI's initialization process, this function
   *   can be called before the DOM is ready.
   * @memberOf module:KIMCHI
   */
  KIMCHI.init = function () {
    console.log('.init(): start');

    var rendererSuccess;



    // WebGL check
    if (typeof window.WebGLRenderingContext !== 'function') {
      // WebGL is not supported by the browser
      console.warn('.init(): WebGL is not supported by the browser');
      KIMCHI.notices.add({
        'message': KIMCHI.config.get('langWebGLNotSupported'),
        'type': 'error',
        'hideable': false
      });
      return false;
    }

    // renderer
    rendererSuccess = KIMCHI.renderer.init();
    if (!rendererSuccess) {
      // the renderer failed to initialize
      console.warn('.init(): the renderer failed to initialize');
      KIMCHI.notices.add({
        'message': KIMCHI.config.get('langWebGLError'),
        'type': 'error',
        'hideable': false
      });
      return false;
    }



    // config
    KIMCHI.config.init();

    /**
     * This clock keeps track of time for three.js. It is different from
     *   {@link module:KIMCHI.time|KIMCHI.time}, which keeps track of the
     *   user's current Julian Date in space.
     * @type     {THREE.Clock}
     * @memberOf module:KIMCHI
     */
    KIMCHI.clock = new THREE.Clock();

    /**
     * @type     {THREE.Scene}
     * @memberOf module:KIMCHI
     */
    KIMCHI.scene = new THREE.Scene();

    /**
     * Don't use OrthographicCamera because it lacks perspective.
     * @type     {THREE.PerspectiveCamera}
     * @memberOf module:KIMCHI
     */
    KIMCHI.camera = new THREE.PerspectiveCamera(
      KIMCHI.config.get('cameraFov'),
      1, // placeholder, set in KIMCHI.size
      KIMCHI.config.get('cameraNear'),
      KIMCHI.config.get('cameraFar')
    );
    // initialize camera position and rotation
    KIMCHI.camera.position.copy(KIMCHI.config.get('cameraInitialPosition'));
    KIMCHI.camera.lookAt(new THREE.Vector3(0, 0, 0));



    /**
     * @type     {THREE.PointerLockControls}
     * @memberOf module:KIMCHI
     */
    KIMCHI.pointerLockControls = new THREE.PointerLockControls(KIMCHI.camera);
    /**
     * @type     {THREE.OrbitControls}
     * @memberOf module:KIMCHI
     */
    KIMCHI.orbitControls = new THREE.OrbitControls(KIMCHI.camera);



    /**
     * Stars in the background.
     * @type     {THREE.PointCloud[]}
     * @memberOf module:KIMCHI
     */
    KIMCHI.stars = new THREE.Stars({
      'scale': KIMCHI.config.get('starsScale'),
      'count': KIMCHI.config.get('starsCount')
    });
    KIMCHI.scene.add(KIMCHI.stars);



    // add astronomical bodies
    KIMCHI.space.init();
    KIMCHI.scene.add(KIMCHI.space.getObject3Ds('main'));



    // move the Bodies to their initial positions
    console.log('.init(): position Bodies');
    KIMCHI.space.translateBodies();

    // create orbits for the Bodies that have orbits
    console.log('.init(): create orbits');
    KIMCHI.space.createOrbits();
    KIMCHI.scene.add(KIMCHI.space.getObject3Ds('orbit'));



    /**
     * Lighting.
     * @memberOf module:KIMCHI
     */
    KIMCHI.lights = {};
    // place a light at the center of the Sun
    KIMCHI.lights.Sun = new THREE.PointLight(0xffffee, 2, 0);
    KIMCHI.space.getBody('Sun').object3Ds.main.add(KIMCHI.lights.Sun);
    // ambient light
    KIMCHI.lights.ambient = new THREE.AmbientLight(0x333333);
    KIMCHI.scene.add(KIMCHI.lights.ambient);



    KIMCHI.init.promise.then(function () {
      console.log('.init(): done');
    });

    initDeferred.resolve();

    return KIMCHI.init.promise;
  };



  /**
   * The second part of KIMCHI's initialization process. Call after the DOM is
   *   ready.
   * @memberOf module:KIMCHI
   */
  KIMCHI.ready = function () {
    console.log('.ready(): start');

    KIMCHI.init.promise.then(function () {
      console.log('.size.init(): start');
      KIMCHI.size.init();

      console.log('.pointerLock.init(): start');
      KIMCHI.pointerLock.init();

      console.log('.flight.init(): start');
      KIMCHI.flight.init();

      readyDeferred.resolve();

      console.log('.ready(): done');
    });

    return KIMCHI.ready.promise;
  };



  /**
   * @type     {Promise}
   * @memberOf module:KIMCHI
   */
  KIMCHI.init.promise = initDeferred.promise;

  /**
   * @type     {Promise}
   * @memberOf module:KIMCHI
   */
  KIMCHI.ready.promise = readyDeferred.promise;



  // TODO: turn off in production
  Q.longStackSupport = true;



  KIMCHI.init();



  return KIMCHI;
}(KIMCHI || {}, Q));
