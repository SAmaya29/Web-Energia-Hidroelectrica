
app.controller("ControladorRadiacionSolar", function ($scope, $http
) {

    $scope.ciudades = []
    $scope.ciudadSeleccionada = null;
    $scope.desde = null;
    $scope.hasta = null;
    $scope.radiacion = null;
    $http.get('datos/CoordenadasColombia.json').then(function (response) {
        $scope.ciudades = response.data;
    });

    // Función para formatear la fecha de 20250701 a 2025-07-01
    $scope.formatearFecha = function(fecha) {
        if (!fecha || fecha.length !== 8) return fecha;
        return fecha.slice(0,4) + '-' + fecha.slice(4,6) + '-' + fecha.slice(6,8);
    }

    $scope.consultarRadiacion = function (ciudadSeleccionada) {
        if (!ciudadSeleccionada || $scope.desde === null || $scope.hasta === null) {
            return;
        }
        let url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        const params = {
            parameters: "ALLSKY_SFC_SW_DWN",
            latitude: ciudadSeleccionada.lat,
            longitude: ciudadSeleccionada.lon,
            format: "JSON",
            community: "RE",
            start: $scope.desde ? $scope.desde.toISOString().split('T')[0].replace(/-/g, '') : null,
            end: $scope.hasta ? $scope.hasta.toISOString().split('T')[0].replace(/-/g, '') : null
        }

        const consulta = Object.entries(params)
            .map(([clave, valor]) => `${clave}=${valor}`)
            .join("&");
        url += `?${consulta}`;

        $http.get(url).then(function (response) {
            const datos = response.data.properties.parameter.ALLSKY_SFC_SW_DWN
            $scope.radiacion = datos
            console.log(datos)
        });
    }
});