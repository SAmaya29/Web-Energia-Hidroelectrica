app.controller('ControladorConsumo', function ($scope, $http) {

    // Variables del scope
    $scope.datosEnergia = [];
    $scope.paises = [];
    $scope.anios = [];
    $scope.formulario = {
        consumoKwh: null,
        paisSeleccionado: '',
        anioSeleccionado: ''
    };
    $scope.resultados = {
        porcentajeRenovable: 0,
        consumoRenovable: 0,
        co2Evitado: 0,
        ahorroEstimado: 0,
        desgloseFuentes: {},
        mostrarResultados: false
    };

    // Variables para las gráficas
    let chartPastel = null;
    let chartBarras = null;

    // Inicializar controlador
    $scope.init = function () {
        $scope.cargarDatos();
    };

    // Cargar datos del JSON
    $scope.cargarDatos = function () {
        console.log('Intentando cargar datos...');
        //ProduccionEnergia
        $http.get('datos/ProduccionEnergia.json')
            .then(function (response) {
                console.log('Datos cargados exitosamente:', response.data.length, 'registros');
                $scope.datosEnergia = response.data;
                $scope.procesarDatos();
            })
            .catch(function (error) {
                console.error('Error al cargar datos:', error);
                $scope.mostrarError('No se pudieron cargar los datos de energía');
            });
    };

    // Procesar datos para llenar selectores
    $scope.procesarDatos = function () {
        console.log('Procesando datos...', $scope.datosEnergia.length, 'registros');
        
        // Obtener países únicos (filtrar entidades válidas)
        const paisesUnicos = [...new Set($scope.datosEnergia
            .filter(item => item.Entity && item.Code && item.Entity !== 'World')
            .map(item => item.Entity))]
            .sort();
        
        console.log('Países encontrados:', paisesUnicos.length, paisesUnicos.slice(0, 10));
        $scope.paises = paisesUnicos;

        // Obtener años únicos y ordenar descendente
        const aniosUnicos = [...new Set($scope.datosEnergia.map(item => item.Year))]
            .sort((a, b) => b - a);

        console.log('Años encontrados:', aniosUnicos.length, aniosUnicos.slice(0, 10));
        $scope.anios = aniosUnicos;
    };    // Función principal para calcular consumo
    $scope.calcularConsumo = function () {
        // Validar formulario
        if (!$scope.validarFormulario()) {
            return;
        }

        // Buscar datos del país y año seleccionados
        const datoPais = $scope.datosEnergia.find(item =>
            item.Entity === $scope.formulario.paisSeleccionado &&
            item.Year === parseInt($scope.formulario.anioSeleccionado)
        );

        if (!datoPais) {
            $scope.mostrarError('No se encontraron datos para el país y año seleccionados');
            return;
        }

        // Realizar cálculos
        const resultadosCalculos = $scope.realizarCalculos($scope.formulario.consumoKwh, datoPais);

        // Actualizar scope con resultados
        $scope.resultados = {
            ...$scope.resultados,
            ...resultadosCalculos,
            mostrarResultados: true
        };

        // Crear gráficas después de que se actualice el DOM
        setTimeout(() => {
            $scope.crearGraficas();
            $scope.scrollToResults();
        }, 100);
    };

    // Validar formulario
    $scope.validarFormulario = function () {
        if (!$scope.formulario.consumoKwh || $scope.formulario.consumoKwh <= 0) {
            $scope.mostrarError('Por favor ingresa un consumo válido mayor a 0');
            return false;
        }

        if (!$scope.formulario.paisSeleccionado) {
            $scope.mostrarError('Por favor selecciona un país');
            return false;
        }

        if (!$scope.formulario.anioSeleccionado) {
            $scope.mostrarError('Por favor selecciona un año');
            return false;
        }

        return true;
    };

    // Realizar todos los cálculos
    $scope.realizarCalculos = function (consumo, datos) {
        // Obtener producción por fuente (en TWh, convertir a kWh)
        const hidro = (datos['Electricity from hydro (TWh)'] || 0) * 1e9; // TWh a kWh
        const solar = (datos['Electricity from solar (TWh)'] || 0) * 1e9;
        const eolica = (datos['Electricity from wind (TWh)'] || 0) * 1e9;
        const biomasa = (datos['Other renewables including bioenergy (TWh)'] || 0) * 1e9;

        // Calcular total renovable
        const totalRenovable = hidro + solar + eolica + biomasa;

        // Estimar consumo total del país
        // Factor de estimación basado en el tipo de país
        let factorEstimacion = $scope.obtenerFactorEstimacion(datos.Entity, totalRenovable);
        const totalEstimado = totalRenovable > 0 ? totalRenovable / factorEstimacion : 0;

        // Calcular porcentaje renovable
        const porcentajeRenovable = totalEstimado > 0 ?
            Math.min((totalRenovable / totalEstimado) * 100, 100) : 0;

        // Calcular consumo renovable del usuario
        const consumoRenovableUsuario = consumo * (porcentajeRenovable / 100);

        // Calcular CO₂ evitado
        // 0.5 ton/MWh = 0.0005 ton/kWh = 0.5 kg/kWh
        const factorCO2 = 0.5; // kg CO2 por kWh evitado
        const co2Evitado = consumoRenovableUsuario * factorCO2;

        // Estimar ahorro económico
        // Asumiendo diferencia de $0.12/kWh entre energía renovable y fósil
        const factorAhorro = 0.12;
        const ahorroEstimado = consumoRenovableUsuario * factorAhorro;

        return {
            consumoTotal: consumo,
            consumoRenovable: parseFloat(consumoRenovableUsuario.toFixed(2)),
            porcentajeRenovable: parseFloat(porcentajeRenovable.toFixed(1)),
            co2Evitado: parseFloat(co2Evitado.toFixed(2)),
            ahorroEstimado: parseFloat(ahorroEstimado.toFixed(2)),
            desgloseFuentes: {
                hidro: hidro,
                solar: solar,
                eolica: eolica,
                biomasa: biomasa,
                totalRenovable: totalRenovable
            },
            pais: datos.Entity,
            anio: datos.Year
        };
    };

    // Obtener factor de estimación según el país
    $scope.obtenerFactorEstimacion = function (pais, totalRenovable) {
        // Países con muy alta penetración renovable (80%+)
        const paisesMuyAltaRenovable = [
            'Norway', 'Iceland', 'Costa Rica', 'Uruguay', 'Paraguay',
            'Ethiopia', 'Democratic Republic of Congo', 'Albania',
            'Bhutan', 'Montenegro', 'Zambia', 'Georgia', 'Moldova',
            'Tajikistan', 'Kyrgyzstan', 'Lesotho', 'Rwanda'
        ];

        // Países con alta penetración renovable (60-79%)
        const paisesAltaRenovable = [
            'Brazil', 'Colombia', 'Canada', 'Sweden', 'Austria',
            'Switzerland', 'New Zealand', 'Chile', 'Ecuador',
            'Peru', 'Venezuela', 'Latvia', 'Denmark', 'Portugal',
            'Finland', 'Nepal', 'Cameroon', 'Kenya', 'Tanzania',
            'Uganda', 'Mozambique', 'Ghana', 'Madagascar'
        ];

        // Países con media-alta penetración renovable (40-59%)
        const paisesMedioAltaRenovable = [
            'Spain', 'Germany', 'United Kingdom', 'Italy', 'France',
            'Turkey', 'Romania', 'Greece', 'Croatia', 'Slovenia',
            'Slovakia', 'Lithuania', 'Ireland', 'Bulgaria',
            'Argentina', 'Mexico', 'Guatemala', 'Honduras',
            'Panama', 'Nicaragua', 'El Salvador', 'Bolivia',
            'Vietnam', 'Philippines', 'Thailand', 'Myanmar',
            'Laos', 'Cambodia', 'Sri Lanka', 'Bangladesh'
        ];

        // Países con media penetración renovable (25-39%)
        const paisesMedioRenovable = [
            'United States', 'Russia', 'China', 'India', 'Japan',
            'Australia', 'South Korea', 'Indonesia', 'Malaysia',
            'Pakistan', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
            'South Africa', 'Nigeria', 'Iran', 'Iraq', 'Jordan',
            'Lebanon', 'Syria', 'Yemen', 'Afghanistan',
            'Kazakhstan', 'Uzbekistan', 'Turkmenistan',
            'Belarus', 'Ukraine', 'Czech Republic', 'Hungary',
            'Poland', 'Estonia', 'Netherlands', 'Belgium'
        ];

        // Países con baja penetración renovable (10-24%)
        const paisesBajaRenovable = [
            'Saudi Arabia', 'Kuwait', 'United Arab Emirates', 'Qatar',
            'Bahrain', 'Oman', 'Libya', 'Israel', 'Cyprus',
            'Malta', 'Luxembourg', 'Monaco', 'Singapore',
            'Brunei', 'Trinidad and Tobago', 'Barbados',
            'Jamaica', 'Bahamas', 'Haiti', 'Dominican Republic',
            'Cuba', 'Puerto Rico', 'Taiwan', 'Hong Kong',
            'Macau', 'Mongolia', 'North Korea'
        ];

        // Países con muy baja penetración renovable (<10%)
        const paisesMuyBajaRenovable = [
            'Kuwait', 'Bahrain', 'Qatar', 'Brunei', 'Trinidad and Tobago',
            'Libya', 'Algeria', 'Botswana', 'Equatorial Guinea',
            'Gabon', 'Chad', 'Niger', 'Mali', 'Mauritania'
        ];

        // Determinar categoría del país
        if (paisesMuyAltaRenovable.includes(pais)) {
            return 0.85; // 85% de la energía es renovable
        } else if (paisesAltaRenovable.includes(pais)) {
            return 0.70; // 70% de la energía es renovable
        } else if (paisesMedioAltaRenovable.includes(pais)) {
            return 0.50; // 50% de la energía es renovable
        } else if (paisesMedioRenovable.includes(pais)) {
            return 0.32; // 32% de la energía es renovable
        } else if (paisesBajaRenovable.includes(pais)) {
            return 0.17; // 17% de la energía es renovable
        } else if (paisesMuyBajaRenovable.includes(pais)) {
            return 0.08; // 8% de la energía es renovable
        } else {
            // Estimación dinámica basada en la producción renovable
            // Para países no clasificados, usar el total renovable como indicador
            if (totalRenovable > 100e9) { // > 100 TWh
                return 0.60; // Probablemente alta capacidad renovable
            } else if (totalRenovable > 50e9) { // 50-100 TWh
                return 0.45; // Capacidad media-alta
            } else if (totalRenovable > 10e9) { // 10-50 TWh
                return 0.30; // Capacidad media
            } else if (totalRenovable > 1e9) { // 1-10 TWh
                return 0.20; // Capacidad baja
            } else {
                return 0.15; // Capacidad muy baja o país pequeño
            }
        }
    };

    // Crear gráficas
    $scope.crearGraficas = function () {
        $scope.crearGraficaPastel();
        $scope.crearGraficaBarras();
    };

    // Crear gráfica de pastel para distribución de fuentes
    $scope.crearGraficaPastel = function () {
        const canvas = document.getElementById('chartPastel');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destruir gráfica anterior si existe
        if (chartPastel) {
            chartPastel.destroy();
        }

        const fuentes = $scope.resultados.desgloseFuentes;
        const total = fuentes.totalRenovable;

        if (total === 0) {
            $scope.mostrarError('No hay datos de energía renovable para mostrar');
            return;
        }

        // Preparar datos para la gráfica
        const datosGrafica = [
            { label: 'Hidroeléctrica', valor: fuentes.hidro, color: '#4facfe' },
            { label: 'Solar', valor: fuentes.solar, color: '#ffab00' },
            { label: 'Eólica', valor: fuentes.eolica, color: '#28a745' },
            { label: 'Biomasa y Otras', valor: fuentes.biomasa, color: '#dc3545' }
        ].filter(item => item.valor > 0);

        // Crear gráfica
        chartPastel = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: datosGrafica.map(item => item.label),
                datasets: [{
                    data: datosGrafica.map(item => ((item.valor / total) * 100).toFixed(1)),
                    backgroundColor: datosGrafica.map(item => item.color),
                    borderWidth: 0,
                    hoverOffset: 15,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 13,
                                weight: '500'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#4facfe',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                const porcentaje = context.parsed;
                                const valor = datosGrafica[context.dataIndex].valor;
                                const valorTWh = (valor / 1e9).toFixed(2);
                                return `${context.label}: ${porcentaje}% (${valorTWh} TWh)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    };

    // Crear gráfica de barras para comparación de consumo
    $scope.crearGraficaBarras = function () {
        const canvas = document.getElementById('chartBarras');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destruir gráfica anterior si existe
        if (chartBarras) {
            chartBarras.destroy();
        }

        const consumoTotal = $scope.resultados.consumoTotal;
        const consumoRenovable = $scope.resultados.consumoRenovable;
        const consumoNoRenovable = consumoTotal - consumoRenovable;

        chartBarras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tu Consumo Mensual'],
                datasets: [
                    {
                        label: 'Energía Renovable',
                        data: [consumoRenovable],
                        backgroundColor: '#28a745',
                        borderColor: '#1e7e34',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    },
                    {
                        label: 'Energía No Renovable',
                        data: [consumoNoRenovable],
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 14,
                                weight: '500'
                            },
                            color: '#333'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Consumo (kWh)',
                            font: {
                                size: 14,
                                weight: '600'
                            },
                            color: '#333'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#666'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 13,
                                weight: '500'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#4facfe',
                        borderWidth: 1,
                        callbacks: {
                            afterLabel: function (context) {
                                const porcentaje = ((context.parsed.y / consumoTotal) * 100).toFixed(1);
                                return `(${porcentaje}% del total)`;
                            },
                            footer: function (tooltipItems) {
                                if (tooltipItems.length > 0) {
                                    return `Total: ${consumoTotal} kWh`;
                                }
                                return '';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    };

    // Scroll hacia los resultados
    $scope.scrollToResults = function () {
        setTimeout(() => {
            const element = document.getElementById('resultadosSection');
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 200);
    };

    // Formatear números para mostrar
    $scope.formatearNumero = function (numero, decimales = 1) {
        if (typeof numero !== 'number') return '0';
        return numero.toLocaleString('es-ES', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        });
    };

    // Limpiar formulario y resultados
    $scope.limpiarFormulario = function () {
        $scope.formulario = {
            consumoKwh: null,
            paisSeleccionado: '',
            anioSeleccionado: ''
        };

        $scope.resultados.mostrarResultados = false;

        // Destruir gráficas
        if (chartPastel) {
            chartPastel.destroy();
            chartPastel = null;
        }
        if (chartBarras) {
            chartBarras.destroy();
            chartBarras = null;
        }
    };

    // Obtener recomendaciones basadas en los resultados
    $scope.obtenerRecomendaciones = function () {
        if (!$scope.resultados.mostrarResultados) return [];

        const porcentaje = $scope.resultados.porcentajeRenovable;
        const consumo = $scope.resultados.consumoTotal;
        const pais = $scope.resultados.pais;
        const recomendaciones = [];

        if (porcentaje >= 80) {
            // Muy alta penetración renovable (80%+)
            recomendaciones.push('🌟 ¡Felicitaciones! Tu región es líder mundial en energía renovable.');
            recomendaciones.push('🔋 Considera invertir en baterías domésticas para almacenar energía renovable.');
            recomendaciones.push('⚡ Instala medidores inteligentes para optimizar tu consumo en horarios de alta generación renovable.');
            recomendaciones.push('🏠 Implementa domótica para automatizar el uso de electrodomésticos cuando hay más energía limpia disponible.');
            recomendaciones.push('🚗 Si tienes auto eléctrico, programa la carga durante las horas de mayor producción renovable.');
            if (consumo > 500) {
                recomendaciones.push('💡 Con tu consumo alto, considera actualizar a electrodomésticos más eficientes para maximizar el impacto positivo.');
            }
        } else if (porcentaje >= 60) {
            // Alta penetración renovable (60-79%)
            recomendaciones.push('🌱 ¡Excelente! Tu región tiene un muy buen nivel de energía renovable.');
            recomendaciones.push('🏡 Considera instalar paneles solares domésticos para complementar la red eléctrica.');
            recomendaciones.push('🌡️ Implementa calentadores solares de agua para reducir el consumo eléctrico.');
            recomendaciones.push('💰 Busca programas gubernamentales de incentivos para energías renovables.');
            recomendaciones.push('📊 Usa aplicaciones de monitoreo energético para optimizar tu consumo.');
            if (consumo > 400) {
                recomendaciones.push('🔧 Con tu nivel de consumo, invertir en eficiencia energética tendrá un gran impacto ambiental.');
            }
        } else if (porcentaje >= 40) {
            // Media-alta penetración renovable (40-59%)
            recomendaciones.push('👍 Tu región tiene un buen nivel de energía renovable.');
            recomendaciones.push('🗳️ Apoya políticas locales que promuevan más energías limpias.');
            recomendaciones.push('☀️ Evalúa la instalación de paneles solares según la disponibilidad solar de tu zona.');
            recomendaciones.push('🌊 Si vives cerca del mar o montañas, infórmate sobre proyectos eólicos comunitarios.');
            recomendaciones.push('🏢 Promueve en tu trabajo o comunidad el uso de energías renovables.');
            recomendaciones.push('💡 Cambia todas las bombillas a LED para reducir tu consumo total.');
            if (consumo > 300) {
                recomendaciones.push('❄️ Considera mejorar el aislamiento de tu hogar para reducir el uso de calefacción/refrigeración.');
            }
        } else if (porcentaje >= 25) {
            // Media penetración renovable (25-39%)
            recomendaciones.push('⚠️ Tu región tiene un nivel moderado de energía renovable.');
            recomendaciones.push('🏠 Instala paneles solares domésticos como una excelente inversión a largo plazo.');
            recomendaciones.push('🌿 Participa en programas comunitarios de energía renovable.');
            recomendaciones.push('📧 Contacta a tus representantes locales para apoyar más proyectos de energía limpia.');
            recomendaciones.push('💨 Considera pequeños aerogeneradores domésticos si hay viento constante en tu zona.');
            recomendaciones.push('🔌 Desconecta dispositivos en standby para reducir el consumo fantasma.');
            recomendaciones.push('📱 Usa temporizadores y enchufes inteligentes para optimizar el uso de energia.');
            if (consumo > 250) {
                recomendaciones.push('🌡️ Ajusta la temperatura del termostato: 1°C de diferencia puede ahorrar hasta 10% de energía.');
            }
        } else if (porcentaje >= 10) {
            // Baja penetración renovable (10-24%)
            recomendaciones.push('🚨 Tu región tiene baja penetración de energía renovable.');
            recomendaciones.push('☀️ Los paneles solares domésticos son especialmente importantes en tu caso.');
            recomendaciones.push('🏛️ Únete a organizaciones que promuevan políticas de energía limpia.');
            recomendaciones.push('💰 Busca financiamiento para proyectos de eficiencia energética doméstica.');
            recomendaciones.push('🌡️ Invierte en bombas de calor eficientes en lugar de calentadores eléctricos tradicionales.');
            recomendaciones.push('🪟 Mejora ventanas y aislamiento para reducir drásticamente tu consumo energético.');
            recomendaciones.push('🌊 Considera calentadores solares de agua como primera medida de ahorro.');
            recomendaciones.push('📊 Realiza una auditoría energética de tu hogar para identificar oportunidades de mejora.');
            if (consumo > 200) {
                recomendaciones.push('⚡ Con tu consumo, cada kWh ahorrado tiene mayor impacto ambiental y económico.');
            }
        } else {
            // Muy baja penetración renovable (<10%)
            recomendaciones.push('🔴 Tu región depende fuertemente de combustibles fósiles.');
            recomendaciones.push('🌞 La instalación de paneles solares es crítica para reducir tu huella de carbono.');
            recomendaciones.push('🏠 Considera hacer tu hogar completamente autosuficiente con energía renovable.');
            recomendaciones.push('🔋 Invierte en sistemas de almacenamiento de energía para independizarte de la red.');
            recomendaciones.push('🌡️ Instala bomba de calor geotérmica si tu terreno lo permite.');
            recomendaciones.push('💡 Cada mejora en eficiencia energética tiene un impacto ambiental significativo.');
            recomendaciones.push('🌊 Explora todas las opciones: solar, eólica doméstica, micro-hidráulica si aplica.');
            recomendaciones.push('📈 Únete a cooperativas de energía renovable para acceder a proyectos comunitarios.');
            recomendaciones.push('🎯 Establece como meta reducir tu consumo al menos 30% con eficiencia energética.');
        }

        // Recomendaciones adicionales según el país
        if (['Norway', 'Iceland', 'Costa Rica'].includes(pais)) {
            recomendaciones.push('🏆 Tu país es un ejemplo mundial en energías renovables. ¡Sigue siendo parte de la solución!');
        } else if (['United States', 'China', 'India', 'Germany'].includes(pais)) {
            recomendaciones.push('🌍 Como habitante de una potencia mundial, tu acción individual contribuye a un cambio global significativo.');
        }

        // Recomendaciones según el consumo
        if (consumo > 600) {
            recomendaciones.push('📊 Tu consumo está por encima del promedio. Considera una auditoría energética profesional.');
        } else if (consumo < 150) {
            recomendaciones.push('✅ Tu consumo es eficiente. Comparte tus hábitos de ahorro energético con otros.');
        }

        return recomendaciones;
    };

    // Inicializar cuando se carga el controlador
    $scope.init();

});