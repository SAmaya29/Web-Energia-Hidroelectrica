# 💧 Web Energía Hidroeléctrica

Una aplicación web interactiva desarrollada con **AngularJS** para visualizar datos de producción de energía renovable y calcular el impacto del consumo energético personal en diferentes países del mundo.

## 🌟 Características Principales

### 📊 **Módulo de Consultas Energéticas**
- Visualización de datos de producción energética por país y año
- Gráficas interactivas con **Chart.js**
- Filtros dinámicos por país, año y tipo de energía
- Análisis comparativo entre diferentes fuentes renovables

### ⚡ **Calculadora de Consumo Energético**
- **Formulario intuitivo** para ingresar consumo personal (kWh)
- **Selección de país y año** para análisis contextualizado
- **Cálculos automáticos** de:
  - Porcentaje de energía renovable en la región
  - Consumo renovable personal estimado
  - CO₂ evitado (kg)
  - Ahorro económico estimado
- **Visualizaciones dinámicas**:
  - Gráfica de pastel: distribución de fuentes renovables
  - Gráfica de barras: comparación consumo renovable vs no renovable

### 🎯 **Sistema de Recomendaciones Personalizadas**
Recomendaciones inteligentes basadas en 6 categorías de penetración renovable:
- **80%+**: Líderes mundiales (Noruega, Islandia, Costa Rica)
- **60-79%**: Alta penetración (Brasil, Canadá, Suecia)
- **40-59%**: Media-alta (España, Alemania, Francia)
- **25-39%**: Media (EE.UU., China, India)
- **10-24%**: Baja (Arabia Saudí, Singapur)
- **<10%**: Muy baja (países petroleros)

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **AngularJS 1.8.3** - Framework principal SPA
- **Bootstrap 5.3.3** - Framework CSS responsivo
- **Chart.js** - Librería de gráficas interactivas
- **Bootstrap Icons** - Iconografía moderna

### **Backend/Datos**
- **JSON** - Base de datos local con información energética mundial
- **Angular Router** - Navegación SPA
- **HTTP Service** - Consumo de datos

### **Estilos**
- **CSS3** con efectos glassmorphism
- **Responsive Design** - Compatible con dispositivos móviles
- **Animaciones CSS** - Transiciones suaves

## 📁 Estructura del Proyecto

```
WebDatos/
├── 📄 Principal.html           # Página principal y estructura base
├── 📂 codigo/                  # Controladores y lógica JavaScript
│   ├── app.js                  # Configuración de rutas AngularJS
│   ├── ControladorConsultas.js # Lógica del módulo de consultas
│   └── ControladorConsumo.js   # Lógica de la calculadora de consumo
├── 📂 vistas/                  # Plantillas HTML de cada módulo
│   ├── Inicio.html            # Página de bienvenida
│   ├── Consultas.html         # Vista de consultas energéticas
│   └── Consumo.html           # Vista de calculadora de consumo
├── 📂 datos/                   # Datasets en formato JSON
│   ├── ProduccionEnergia.json # Dataset principal con datos mundiales
│   └── EnergiaRenovable.json  # Dataset alternativo
├── 📂 imagenes/               # Recursos gráficos
└── 📄 README.md               # Documentación del proyecto
```

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional pero recomendado)

### **Instalación Rápida**

1. **Clonar el repositorio**
```bash
git clone https://github.com/SAmaya29/Web-Energia-Hidroelectrica.git
cd Web-Energia-Hidroelectrica
```

2. **Servir localmente (Opción 1 - Python)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. **Servir localmente (Opción 2 - Node.js)**
```bash
npx http-server -p 8000
```

4. **Abrir en navegador**
```
http://localhost:8000/Principal.html
```

### **Instalación Directa**
También puedes abrir directamente `Principal.html` en tu navegador, aunque algunos navegadores pueden bloquear solicitudes AJAX locales.

## 📈 Dataset y Fuentes de Datos

### **ProduccionEnergia.json**
Contiene datos históricos de producción energética con los siguientes campos:
- **Entity**: Nombre del país/región
- **Code**: Código ISO del país
- **Year**: Año de los datos (1990-2023)
- **Electricity from hydro (TWh)**: Producción hidroeléctrica
- **Electricity from solar (TWh)**: Producción solar
- **Electricity from wind (TWh)**: Producción eólica
- **Other renewables including bioenergy (TWh)**: Otras renovables

### **Cobertura Geográfica**
- **180+ países y territorios**
- **Datos históricos desde 1990**
- **Actualización anual**
- **Fuentes verificadas**: Agencias internacionales de energía

## 🔧 Funcionalidades Técnicas

### **Algoritmo de Estimación**
La aplicación utiliza un algoritmo inteligente para estimar el porcentaje de energía renovable:

```javascript
// Factores por categoría de país
Muy Alta Penetración (85%): Noruega, Islandia, Costa Rica...
Alta Penetración (70%): Brasil, Canadá, Suecia...
Media-Alta (50%): España, Alemania, Francia...
Media (32%): EE.UU., China, India...
Baja (17%): Arabia Saudí, Singapur...
Muy Baja (8%): Países petroleros

// Estimación dinámica para países no clasificados
if (produccionRenovable > 100 TWh) → 60%
if (produccionRenovable > 50 TWh) → 45%
if (produccionRenovable > 10 TWh) → 30%
else → estimación basada en datos
```

### **Cálculos de Impacto**
```javascript
// Fórmulas utilizadas
porcentajeRenovable = (produccionRenovable / consumoTotalEstimado) × 100
consumoRenovableUsuario = consumoUsuario × (porcentajeRenovable / 100)
co2Evitado = consumoRenovableUsuario × 0.5 kg/kWh
ahorroEconomico = consumoRenovableUsuario × $0.12/kWh
```

## 🎨 Características de Diseño

### **Interfaz de Usuario**
- **Design System**: Basado en Bootstrap 5
- **Glassmorphism**: Efectos de vidrio moderno
- **Responsive**: Adaptable a móviles, tablets y desktop
- **Accesibilidad**: Contraste optimizado y navegación por teclado

### **Experiencia de Usuario**
- **Carga progresiva**: Datos se cargan de forma asíncrona
- **Feedback visual**: Indicadores de carga y mensajes de estado
- **Navegación intuitiva**: Menú lateral fijo con iconos claros
- **Animaciones suaves**: Transiciones CSS optimizadas

## 📊 Casos de Uso

### **Para Individuos**
- Calcular el impacto ambiental del consumo energético personal
- Obtener recomendaciones personalizadas de ahorro energético
- Comparar la situación energética entre diferentes países

### **Para Educadores**
- Enseñar conceptos de energías renovables con datos reales
- Demostrar el impacto de las políticas energéticas
- Visualizar tendencias globales de transición energética

### **Para Investigadores**
- Analizar datos históricos de producción energética
- Comparar el desarrollo de energías renovables por región
- Identificar patrones y tendencias energéticas

## 🌍 Impacto y Objetivos

### **Educación Ambiental**
- Concientizar sobre el consumo energético personal
- Mostrar el impacto de las energías renovables
- Promover hábitos de consumo responsable

### **Objetivos de Desarrollo Sostenible (ODS)**
- **ODS 7**: Energía asequible y no contaminante
- **ODS 11**: Ciudades y comunidades sostenibles  
- **ODS 13**: Acción por el clima

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el proyecto
2. Crear una **rama feature** (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** los cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un **Pull Request**

### **Áreas de Mejora**
- Integración con APIs de datos energéticos en tiempo real
- Módulo de comparación de costos por región
- Sistema de notificaciones por metas de ahorro
- Exportación de reportes en PDF
- Modo oscuro/claro

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Sebastián Amaya**
- GitHub: [@SAmaya29](https://github.com/SAmaya29)
- Proyecto: [Web-Energia-Hidroelectrica](https://github.com/SAmaya29/Web-Energia-Hidroelectrica)

## 🙏 Agradecimientos

- **Our World in Data** - Por proporcionar datasets energéticos globales
- **Chart.js** - Por la excelente librería de visualización
- **Bootstrap** - Por el framework CSS robusto
- **AngularJS** - Por el framework JavaScript confiable

---

### 📞 Soporte

Si tienes preguntas o encuentras algún problema:
1. Revisa la documentación en este README
2. Busca en los [Issues](https://github.com/SAmaya29/Web-Energia-Hidroelectrica/issues) existentes
3. Crea un nuevo Issue si es necesario

---

**¡Únete al movimiento de la energía sostenible! 🌱⚡🌍**
