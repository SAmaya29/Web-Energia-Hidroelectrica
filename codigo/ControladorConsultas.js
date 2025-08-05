app.controller('ControladorConsultas', function ($scope, $http) {
    $scope.paises = [];
    $scope.paisSeleccionado = null;
    $scope.desde = null;
    $scope.hasta = null;

    let datos = [];

    // Cargar el archivo JSON
    $http.get("datos/EnergiaRenovable.json").then(function (res) {
        datos = res.data;

        // Obtener lista única de países (usando 'Entity' del JSON)
        const paisesUnicos = [...new Set(datos.map(d => d.Entity))].sort();
        $scope.paises = paisesUnicos;
    });

    let chart; // referencia a la gráfica

    $scope.generarGrafica = function (pais, desde, hasta) {
        if (!pais || !desde || !hasta) return;

        // Filtrar por país y rango de años (usando 'Entity' y 'Year' del JSON)
        const filtrado = datos.filter(d =>
            d.Entity === pais && d.Year >= desde && d.Year <= hasta
        );

        const labels = filtrado.map(d => d.Year);
        const hidro = filtrado.map(d => d['Hydro Generation - TWh'] || 0);
        const solar = filtrado.map(d => d['Solar Generation - TWh'] || 0);
        const eolica = filtrado.map(d => d['Wind Generation - TWh'] || 0);
        const otras = filtrado.map(d => d['Geo Biomass Other - TWh'] || 0);

        const ctx = document.getElementById('graficaEnergia').getContext('2d');

        // Destruir gráfica anterior si existe
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Hidroeléctrica (TWh)',
                        data: hidro,
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Solar (TWh)',
                        data: solar,
                        borderColor: '#ffa726',
                        backgroundColor: 'rgba(255, 167, 38, 0.1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Eólica (TWh)',
                        data: eolica,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Otras (TWh)',
                        data: otras,
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.1)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: `Generación de energía renovable en ${pais}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Generación (TWh)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Año'
                        }
                    }
                }
            }
        });
    };
});
