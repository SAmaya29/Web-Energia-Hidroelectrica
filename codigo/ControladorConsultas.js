app.controller('ControladorConsultas', function ($scope, $http) {
    $scope.paises = [];
    $scope.paisesProduccion = [];
    $scope.paisSeleccionado = null;
    $scope.paisProduccionSeleccionado = null;
    $scope.desde = 2000;
    $scope.hasta = 2020;
    $scope.desdeProduccion = 2000;
    $scope.hastaProduccion = 2020;

    // Estados de feedback
    $scope.sinDatos = false;
    $scope.sinDatosProduccion = false;
    $scope.estadisticas = null;

    let datos = [];
    let datosProduccion = [];

    // Cargar el archivo JSON
    $http.get("datos/EnergiaRenovable.json").then(function (res) {
        datos = res.data;

        // Obtener lista única de países (usando 'Entity' del JSON)
        const paisesUnicos = [...new Set(datos.map(d => d.Entity))].sort();
        $scope.paises = paisesUnicos;
    });

    $http.get("datos/ProduccionEnergia.json").then(function (res) {
        datosProduccion = res.data;

        // Obtener lista única de países (usando 'Entity' del JSON)
        const paisesUnicos = [...new Set(datosProduccion.map(d => d.Entity))].sort();
        $scope.paisesProduccion = paisesUnicos;
    });

    let chartProduccion; // referencia a la gráfica
    let chart; // referencia a la gráfica

    // Funciones para limpiar filtros
    $scope.limpiarFiltros = function () {
        $scope.paisSeleccionado = null;
        $scope.desde = 2000;
        $scope.hasta = 2020;
        $scope.sinDatos = false;
        $scope.estadisticas = null;
        if (chart) chart.destroy();
    };

    $scope.limpiarFiltrosProduccion = function () {
        $scope.paisProduccionSeleccionado = null;
        $scope.desdeProduccion = 2000;
        $scope.hastaProduccion = 2020;
        $scope.sinDatosProduccion = false;
        if (chartProduccion) chartProduccion.destroy();
    };

    // Función para calcular estadísticas
    function calcularEstadisticas(datosGrafica, pais, desde, hasta) {
        if (!datosGrafica || datosGrafica.length === 0) return null;

        const totalHidro = datosGrafica.reduce((sum, d) => sum + (d['Hydro Generation - TWh'] || 0), 0);
        const totalSolar = datosGrafica.reduce((sum, d) => sum + (d['Solar Generation - TWh'] || 0), 0);
        const totalEolica = datosGrafica.reduce((sum, d) => sum + (d['Wind Generation - TWh'] || 0), 0);
        const totalOtras = datosGrafica.reduce((sum, d) => sum + (d['Geo Biomass Other - TWh'] || 0), 0);
        const totalGeneral = totalHidro + totalSolar + totalEolica + totalOtras;

        // Encontrar energía dominante
        const energias = [
            { nombre: 'Hidroeléctrica', total: totalHidro },
            { nombre: 'Solar', total: totalSolar },
            { nombre: 'Eólica', total: totalEolica },
            { nombre: 'Otras', total: totalOtras }
        ];
        const dominante = energias.reduce((max, energia) => energia.total > max.total ? energia : max);

        // Calcular crecimiento (primer año vs último año)
        const primerAno = datosGrafica[0];
        const ultimoAno = datosGrafica[datosGrafica.length - 1];
        const totalPrimero = (primerAno['Hydro Generation - TWh'] || 0) + (primerAno['Solar Generation - TWh'] || 0) +
            (primerAno['Wind Generation - TWh'] || 0) + (primerAno['Geo Biomass Other - TWh'] || 0);
        const totalUltimo = (ultimoAno['Hydro Generation - TWh'] || 0) + (ultimoAno['Solar Generation - TWh'] || 0) +
            (ultimoAno['Wind Generation - TWh'] || 0) + (ultimoAno['Geo Biomass Other - TWh'] || 0);

        const crecimiento = totalPrimero > 0 ? ((totalUltimo - totalPrimero) / totalPrimero) * 100 : 0;

        return {
            totalGeneral: totalGeneral,
            energiaDominante: dominante.nombre,
            porcentajeDominante: totalGeneral > 0 ? ((dominante.total / totalGeneral) * 100).toFixed(1) : 0,
            crecimiento: crecimiento,
            periodo: desde + ' - ' + hasta,
            anos: hasta - desde + 1
        };
    }

    $scope.generarGraficaProduccion = function (pais, desde, hasta) {
        if (!pais || desde === null || hasta === null) return;

        $scope.sinDatosProduccion = false;

        // Filtrar por país y rango de años (usando 'Entity' y 'Year' del JSON)
        const filtrado = datosProduccion.filter(d =>
            d.Entity === pais && d.Year >= desde && d.Year <= hasta
        );

        if (filtrado.length === 0) {
            $scope.sinDatosProduccion = true;
            return;
        }

        // Calcular la suma total de cada tipo de energía en el período
        const totalHidro = filtrado.reduce((sum, d) => sum + (d['Electricity from hydro (TWh)'] || 0), 0);
        const totalSolar = filtrado.reduce((sum, d) => sum + (d['Electricity from solar (TWh)'] || 0), 0);
        const totalEolica = filtrado.reduce((sum, d) => sum + (d['Electricity from wind (TWh)'] || 0), 0);
        const totalOtras = filtrado.reduce((sum, d) => sum + (d['Other renewables including bioenergy (TWh)'] || 0), 0);

        // Calcular el total general
        const totalGeneral = totalHidro + totalSolar + totalEolica + totalOtras;

        // Calcular porcentajes
        const porcentajes = [
            totalGeneral > 0 ? ((totalHidro / totalGeneral) * 100).toFixed(1) : 0,
            totalGeneral > 0 ? ((totalSolar / totalGeneral) * 100).toFixed(1) : 0,
            totalGeneral > 0 ? ((totalEolica / totalGeneral) * 100).toFixed(1) : 0,
            totalGeneral > 0 ? ((totalOtras / totalGeneral) * 100).toFixed(1) : 0
        ];

        // Esperar un momento para que el DOM se actualice
        setTimeout(() => {
            const ctx = document.getElementById('graficaProduccionEnergia');
            if (!ctx) {
                console.error('No se encontró el elemento canvas con id "graficaProduccionEnergia"');
                return;
            }
            const context = ctx.getContext('2d');

            // Destruir gráfica anterior si existe
            if (chartProduccion) chartProduccion.destroy();

        chartProduccion = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: [
                    'Hidroeléctrica',
                    'Solar',
                    'Eólica',
                    'Otras Renovables'
                ],
                datasets: [{
                    data: porcentajes,
                    backgroundColor: [
                        '#4facfe',  // Azul para hidroeléctrica
                        '#ffa726',  // Naranja para solar
                        '#28a745',  // Verde para eólica
                        '#6f42c1'   // Púrpura para otras
                    ],
                    borderColor: [
                        '#4facfe',
                        '#ffa726',
                        '#28a745',
                        '#6f42c1'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: `Distribución de energías renovables en ${pais} (${desde}-${hasta})`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                return label + ': ' + value + '% (' +
                                    (context.dataIndex === 0 ? totalHidro.toFixed(1) :
                                        context.dataIndex === 1 ? totalSolar.toFixed(1) :
                                            context.dataIndex === 2 ? totalEolica.toFixed(1) :
                                                totalOtras.toFixed(1)) + ' TWh)';
                            }
                        }
                    }
                }
            }
        });
        }, 100);
    };

    $scope.generarGrafica = function (pais, desde, hasta) {
        if (!pais || desde === null || hasta === null) return;

        $scope.sinDatos = false;
        $scope.estadisticas = null;

        // Filtrar por país y rango de años (usando 'Entity' y 'Year' del JSON)
        const filtrado = datos.filter(d =>
            d.Entity === pais && d.Year >= desde && d.Year <= hasta
        );

        if (filtrado.length === 0) {
            $scope.sinDatos = true;
            return;
        }

        // Calcular estadísticas
        $scope.estadisticas = calcularEstadisticas(filtrado, pais, desde, hasta);

        const labels = filtrado.map(d => d.Year);
        const hidro = filtrado.map(d => d['Hydro Generation - TWh'] || 0);
        const solar = filtrado.map(d => d['Solar Generation - TWh'] || 0);
        const eolica = filtrado.map(d => d['Wind Generation - TWh'] || 0);
        const otras = filtrado.map(d => d['Geo Biomass Other - TWh'] || 0);

        // Esperar un momento para que el DOM se actualice
        setTimeout(() => {
            const ctx = document.getElementById('graficaEnergia');
            if (!ctx) {
                console.error('No se encontró el elemento canvas con id "graficaEnergia"');
                return;
            }
            const context = ctx.getContext('2d');

            // Destruir gráfica anterior si existe
            if (chart) chart.destroy();

        chart = new Chart(context, {
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
                        text: `Consumo de energía renovable en ${pais} (${desde}-${hasta})`
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
        }, 100);
    };
});
