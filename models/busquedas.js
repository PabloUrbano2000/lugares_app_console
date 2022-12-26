import fs from "fs";
import axios from "axios";
class Busquedas {
  historial = [];
  dbPath = "./db/database.json";

  constructor() {
    // Leer BD si existe
    this.leerDB();
  }

  get historialCapitalizado() {
    return this.historial.map((lugar) => {
      let palabras = lugar?.nombre?.split(" ");
      palabras = palabras.map((p) => p[0].toUpperCase() + p.substring(1));
      return palabras.join(" ");
    });
  }

  get paramsMapBox() {
    return {
      access_token: process.env.MAPBOX_KEY || "",
      limit: 5,
      language: "es",
    };
  }

  get paramsWeather() {
    return {
      appid: process.env.OPENWEATHER_KEY || "",
      unit: "metric",
      lang: "es",
    };
  }

  async ciudad(lugar) {
    try {
      // peticion http
      const instance = axios.create({
        baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
        params: this.paramsMapBox,
      });

      const resp = await instance.get();
      return resp?.data?.features.map((lugar) => ({
        id: lugar.id,
        nombre: lugar.place_name,
        lng: lugar.center[0],
        lat: lugar.center[1],
      }));
    } catch (error) {
      return [];
    }
  }

  async climaLugar(lat, lon) {
    try {
      // instance
      const instance = axios.create({
        baseURL: "https://api.openweathermap.org/data/2.5/weather",
        params: { ...this.paramsWeather, lat: lat, lon: lon },
      });

      const resp = await instance.get();
      const { weather, main } = resp.data || {};
      return {
        desc: weather[0]?.description,
        min: main?.temp_min,
        max: main?.temp_max,
        temp: main?.temp,
      };
    } catch (error) {
      console.log(error);
    }
  }

  agregarHistorial(lugar = "") {
    // Prevenir duplicados
    if (this.historial.includes(lugar?.nombre?.toLocaleLowerCase())) {
      return;
    }

    this.historial = this.historial.splice(0, 5);

    this.historial.unshift(lugar);
    // Grabar en DB
    this.guardarDB();
  }

  guardarDB() {
    const payload = {
      historial: this.historial,
    };
    fs.writeFileSync(this.dbPath, JSON.stringify(payload));
  }

  leerDB() {
    // Debe de existir...
    if (!fs.existsSync(this.dbPath)) {
      return;
    }
    const info = fs.readFileSync(this.dbPath, { encoding: "utf-8" });

    const data = JSON.parse(info);
    this.historial = data.historial;
  }
}

export default Busquedas;
