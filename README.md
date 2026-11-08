 <div align="center">

# 🌍 EcoPulse Mumbai

### Understand Your City. Protect Its Environment.

An environmental intelligence platform focused on Mumbai, combining air quality, weather and satellite observations to understand changing urban environmental conditions.

<br>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Open Data](https://img.shields.io/badge/Open-Data-2E8B57?style=for-the-badge)
![Mumbai](https://img.shields.io/badge/Mumbai-14_Locations-FF8C00?style=for-the-badge)

<br>

**ENVIRONMENTAL INTELLIGENCE FOR MUMBAI**

<sub>🌫️ Air Quality &nbsp; · &nbsp; 🌳 Green Cover &nbsp; · &nbsp; 🌡️ Urban Heat &nbsp; · &nbsp; 🌦️ Weather</sub>

</div>

---

## 🌱 Overview

EcoPulse Mumbai brings environmental data together in one platform to make it easier to understand the city's environmental conditions.

It combines weather and air-quality information with satellite-based environmental analysis to explore pollution, vegetation, urban heat and environmental trends across Mumbai.

The project focuses on **14 registered locations across Mumbai**, providing a city-specific view of environmental conditions.

## ✨ Key Features

| Feature | Description |
|---|---|
| 🌫️ Air Quality Monitoring | Track AQI and PM2.5 levels across selected locations |
| 🌦️ Weather Monitoring | View temperature, humidity and weather conditions |
| 🌳 Green Cover Analysis | Study vegetation using satellite observations |
| 🌡️ Urban Heat Analysis | Explore temperature patterns and urban heat conditions |
| 🔮 Environmental Forecast | View environmental forecasts up to 72 hours |
| ⚠️ Risk Analysis | Identify locations that may require environmental attention |
| 📊 Historical Trends | Understand changes in environmental conditions over time |
| 📍 Location-Based Dashboard | Explore information across 14 Mumbai locations |

## 🛰️ How It Works

```mermaid
flowchart TB
    USER(["👤 User"])

    subgraph SOURCES["🌐 ENVIRONMENTAL DATA SOURCES"]
        direction LR
        WEATHER["🌦️ Open-Meteo<br/>Weather Data"]
        SATELLITE["🛰️ Sentinel-2<br/>Satellite Data"]
        AIR["🌫️ Air Quality<br/>Data"]
    end

    USER --> DASHBOARD["📊 EcoPulse Dashboard"]

    WEATHER --> API["⚡ FastAPI Backend"]
    SATELLITE --> API
    AIR --> API

    DASHBOARD <--> API

    API --> PROCESS["⚙️ Data Processing & Analysis"]

    subgraph ANALYSIS["🔬 ENVIRONMENTAL ANALYSIS"]
        direction LR
        AQI["🌫️ Air Quality"]
        GREEN["🌳 Green Cover"]
        HEAT["🌡️ Urban Heat"]
        FORECAST["🔮 Forecasting"]
    end

    PROCESS --> AQI
    PROCESS --> GREEN
    PROCESS --> HEAT
    PROCESS --> FORECAST

    AQI --> INSIGHTS["💡 Environmental Insights"]
    GREEN --> INSIGHTS
    HEAT --> INSIGHTS
    FORECAST --> INSIGHTS

    INSIGHTS --> STORAGE[("🗄️ SQLite Database")]
    STORAGE --> API

    API --> OUTPUT["📈 Charts · Maps · Trends"]
    OUTPUT --> USER

    classDef user fill:#E0F2FE,stroke:#0284C7,color:#075985,stroke-width:2px
    classDef source fill:#DCFCE7,stroke:#16A34A,color:#14532D,stroke-width:2px
    classDef backend fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
    classDef analysis fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:2px
    classDef insights fill:#F3E8FF,stroke:#9333EA,color:#581C87,stroke-width:2px
    classDef output fill:#FFE4E6,stroke:#E11D48,color:#881337,stroke-width:2px

    class USER user
    class WEATHER,SATELLITE,AIR source
    class API,PROCESS backend
    class AQI,GREEN,HEAT,FORECAST analysis
    class INSIGHTS,STORAGE insights
    class DASHBOARD,OUTPUT output
```

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| 💻 Language | Python 3.12 |
| ⚡ Backend | FastAPI, Uvicorn |
| ✅ Data Validation | Pydantic |
| 🔗 API Communication | HTTPX |
| 🗄️ Database | SQLite |
| ⚙️ Database Configuration | WAL Mode |
| 🌦️ Weather Data | Open-Meteo API |
| 🛰️ Satellite Data | Sentinel-2 |
| 🔬 Environmental Analysis | AQI, PM2.5, NDVI and urban heat analysis |

## 📍 Mumbai Coverage

EcoPulse is designed specifically for Mumbai, covering 14 registered locations.

| 📌 Area | 📌 Area | 📌 Area |
|---|---|---|
| Borivali | Kandivali | Malad |
| Andheri | Bandra | BKC |
| Dadar | Worli | Colaba |
| Sion | Kurla | Powai |
| Chembur | Mulund | — |

## 📊 Data & Analysis

EcoPulse combines multiple environmental data sources and analysis methods:

- 🌫️ **Air Quality:** AQI and PM2.5 monitoring.
- 🌦️ **Weather:** Temperature and humidity tracking.
- 🛰️ **Satellite Observations:** Satellite-based vegetation analysis.
- 🌳 **NDVI:** Understanding vegetation and green cover.
- 🌡️ **Urban Heat:** Exploring heat patterns across urban locations.
- 🔮 **Forecasting:** Environmental outlook for the next 72 hours.

<sub>Satellite observations and API-based measurements have their own update cycles; the platform does not imply that every dataset is real-time.</sub>

## 🔒 Reliability & Data Handling

- FastAPI backend with Pydantic validation.
- External API communication handled using HTTPX.
- SQLite persistence with WAL mode.
- Environmental information organized around registered Mumbai locations.
- Multiple environmental indicators combined to support location-based analysis.

## 🎯 Project Goal

Mumbai faces several interconnected environmental challenges, including air pollution, urban heat and changing green cover.

EcoPulse aims to make environmental information easier to access, understand and compare — helping people explore their city's environmental conditions through data.

---

<div align="center">

### 🌍 See the Environment. Understand the Change.

<sub>💚 Built with Python &nbsp; · &nbsp; 📍 Focused on Mumbai &nbsp; · &nbsp; 📊 Driven by Environmental Data</sub>

</div>
