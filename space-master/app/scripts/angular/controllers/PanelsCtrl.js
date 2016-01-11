angular.module('kimchi').controller('PanelsCtrl', function ($scope, $document,
    KIMCHI) {
  var hidePanels, panelsAreHidden;

  // whether to show each panel; these keys are used in panelDirective
  $scope.panels = {
    'about': true,
    'bodies': false,
    'options': false
  };

  // this is a helper function because we need to hide all panels in addition to
  // setting the given flight mode
  $scope.setMode = function (name) {
    hidePanels();
    return KIMCHI.flight.setMode(name);
  };

  // show the given panel
  $scope.showPanel = function (key) {
    hidePanels();
    $scope.panels[key] = !$scope.panels[key];
  };

  // bind keys for flight mode changes
  $document.on('keypress', function (event) {
    switch (event.which) {
    case 49: // 1
      // case not covered by $scope.setMode()
      if (panelsAreHidden()) {
        KIMCHI.flight.setMode('orbit');
        $scope.panels.about = true;
      }
      break;
    case 50: // 2
      $scope.setMode('pointerLock');
      break;
    case 51: // 3
      $scope.setMode('orbit');
      break;
    }
  });

  // hide all panels
  hidePanels = function () {
    _.each($scope.panels, function (value, key) {
      $scope.panels[key] = false;
    });
  };

  // return whether all panels are hidden
  panelsAreHidden = function () {
    return _.every($scope.panels, function (value) {
      return !value;
    });
  };
});
