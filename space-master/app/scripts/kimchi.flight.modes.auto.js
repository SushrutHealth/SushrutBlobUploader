/**
 * Automatically guided flight. Instance of {@link
 *   module:KIMCHI.flight.Mode|Mode}.
 * @namespace auto
 * @memberOf  module:KIMCHI.flight.modes
 */
var KIMCHI = (function (KIMCHI, Q, THREE) {
  'use strict';

  var flight, Mode, mode, update, translateTo;

  flight = KIMCHI.flight;
  Mode = flight.Mode;
  mode = new Mode('auto');
  KIMCHI.flight.modes.auto = mode;



  /**
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.enable = function () {
    Mode.prototype.enable.call(this);
  };

  /**
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.disable = function () {
    Mode.prototype.disable.call(this);
  };

  /**
   * Fly to the given Body.
   * @param    {Body}    body
   * @returns  {Promise}
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.flyTo = function (body) {
    var deferred = Q.defer();

    KIMCHI.config.set('daysPerSecond', 0);

    console.log('.flight.modes.auto: panning to ' + body.name);
    mode.panTo(body).then(function () {
      console.log('.flight.modes.auto: translating to ' + body.name);
      translateTo(body).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise;
  };

  /**
   * Pan (gradually rotate) the camera towards the given Body (without
   *   translating).
   * @param    {Body}    body
   * @returns  {Promise}
   * @function
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.panTo = (function () {
    var deferred, initialQuaternion, initialQuaternionClone, rotationMatrix,
      targetQuaternion, t;

    initialQuaternion = new THREE.Quaternion();
    initialQuaternionClone = new THREE.Quaternion();
    rotationMatrix = new THREE.Matrix4();
    targetQuaternion = new THREE.Quaternion();

    return function (body) {
      var notice = {
        'message': KIMCHI.config.get('noticePanTo')(body),
        'hideable': false
      };
      KIMCHI.notices.add(notice);
      KIMCHI.config.set('daysPerSecond', 0);

      deferred = Q.defer();

      initialQuaternion.copy(KIMCHI.camera.quaternion);

      rotationMatrix.lookAt(
        KIMCHI.camera.position,
        body.object3Ds.main.position,
        KIMCHI.camera.up
      );

      targetQuaternion.setFromRotationMatrix(rotationMatrix);

      t = 0;
      mode.animationFrame = function (delta) {
        // avoid rounding imprecision because we want the final rotation to be
        // centered exactly onto the target body (t = 1); the t += 0.05
        // calculations can be imprecise
        if (t > 1 && t < 1 + 0.05) {
          t = 1;
        }

        if (t <= 1) {
          // this extra clone avoids having to call .clone() in each frame,
          // which would be more expensive than copy()
          initialQuaternionClone.copy(initialQuaternion);

          // slerp is spherical linear interpolation for 3D rotation
          initialQuaternionClone.slerp(targetQuaternion, t);
          KIMCHI.camera.quaternion.copy(initialQuaternionClone);

          update(delta);

          t += 0.05;
        } else { // done
          deferred.resolve();

          KIMCHI.notices.remove(notice);

          // can't return false here because then the follow-up translateTo()
          // won't animate
        }
      };

      return deferred.promise;
    };
  }());



  /**
   * Helper function called in every animationFrame() to update space.
   * @param    {Number} delta
   * @private
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  update = function () {
  };

  /**
   * Translate the camera to the given Body until within
   *   body.getCollisionDistance() * 3 (TODO).
   * @param    {Body}    body
   * @returns  {Promise}
   * @private
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  translateTo = function (body) {
    var deferred = Q.defer();

    // add a notice for the user
    var notice = {
      'message': KIMCHI.config.get('noticeFlyTo')(body),
      'hideable':  false
    };
    KIMCHI.notices.add(notice);

    mode.animationFrame = function (delta) {
      var translationZ;

      if (body.getDistance(KIMCHI.camera) >= body.getCollisionDistance() * 3) {
        translationZ = KIMCHI.config.get('controlsZSpeed') * delta *
          flight.getTranslationSpeedMultiplier([body]);

        this.speed = translationZ / delta;

        KIMCHI.camera.translateZ(-translationZ);

        update(delta);
      } else { // done
        deferred.resolve();

        // remove the notice
        KIMCHI.notices.remove(notice);

        // return false; // stop animating
      }
    };

    return deferred.promise;
  };



  return KIMCHI;
}(KIMCHI || {}, Q, THREE));
