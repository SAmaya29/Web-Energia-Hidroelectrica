const app = angular.module("appProyecto", ['ngRoute']);
app.config(function ($routeProvider) {
    $routeProvider
        .when('/inicio', {
            templateUrl: 'vistas/Inicio.html',
        })
        .when('/radiacion', {
            templateUrl: 'vistas/RadiacionSolar.html',
            controller: 'ControladorRadiacionSolar'
        })
        .when('/consumo', {
            templateUrl: 'vistas/Consumo.html',
            controller: 'ControladorConsumo'
        })
        .otherwise({
            redirectTo: '/inicio' // Página por defecto
        });
});

// Controlador para el menú lateral
app.controller('MenuController', function($scope, $location) {
    $scope.$location = $location;
});