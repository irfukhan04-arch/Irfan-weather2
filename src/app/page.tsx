"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Place = { name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone?: string };
type Weather = {
  timezone: string;
  current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; is_day: number; precipitation: number; weather_code: number; wind_speed_10m: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[] };
};

const DEFAULT_PLACE: Place = { name: "Mumbai", admin1: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" };
const codeInfo: Record<number, [string, string]> = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"], 61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"], 71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"], 82: ["Heavy showers", "⛈️"], 85: ["Snow showers", "🌨️"], 86: ["Snow showers", "❄️"], 95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};
const weatherInfo = (code: number): [string, string] => codeInfo[code] ?? ["Weather update", "🌤️"];
const round = (value: number) => Math.round(value);

export default function Home() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState<"C" | "F">("C");

  const loadWeather = useCallback(async (selected: Place) => {
    setBusy(true); setError(""); setPlace(selected);
    try {
      const params = new URLSearchParams({ latitude: String(selected.latitude), longitude: String(selected.longitude), timezone: "auto", forecast_days: "7", current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m", hourly: "temperature_2m,precipitation_probability,weather_code", daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error("The forecast service is unavailable. Please try again.");
      setWeather(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the weather."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { void loadWeather(DEFAULT_PLACE); }, [loadWeather]);

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim().length < 2) { setError("Enter at least two letters to search."); return; }
    setSearching(true); setError("");
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: query.trim(), count: "6", language: "en", format: "json" })}`);
      const data = await response.json();
      setResults((data.results ?? []).map((item: Place) => item));
      if (!data.results?.length) setError("No matching places found. Try another city name.");
    } catch { setError("Could not search for that place. Please try again."); }
    finally { setSearching(false); }
  };

  const temperature = (celsius: number) => round(unit === "C" ? celsius : (celsius * 9) / 5 + 32);
  const currentCode = weather?.current.weather_code ?? 0;
  const [condition, icon] = weatherInfo(currentCode);
  const hourlyIndices = useMemo(() => {
    if (!weather) return [];
    const now = new Date(weather.current.time).getTime();
    const index = Math.max(0, weather.hourly.time.findIndex((time) => new Date(time).getTime() >= now));
    return Array.from({ length: 12 }, (_, i) => index + i).filter((i) => i < weather.hourly.time.length);
  }, [weather]);
  const locationLabel = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  const formatTime = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en", { ...options, timeZone: weather?.timezone || place.timezone || "UTC" }).format(new Date(value));

  return <main className="page-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">✳</span><span>skylight<span className="brand-light"> weather</span></span></a><div className="topbar-right"><span className="live-dot"/> LIVE FORECAST</div></header>
    <section className="intro"><p className="eyebrow">YOUR DAILY OUTLOOK</p><h1>Weather, at a glance.</h1><p className="subhead">A little more clarity for whatever the day brings.</p></section>
    <section className="search-wrap"><form className="searchbar" onSubmit={search}><span className="search-icon">⌕</span><input aria-label="Search city" value={query} onChange={(e) => { setQuery(e.target.value); setResults([]); }} placeholder="Search city or place..."/><button type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</button></form>
      {results.length > 0 && <div className="search-results">{results.map((result, i) => <button key={`${result.latitude}-${i}`} className="result-item" onClick={() => { setResults([]); setQuery(""); void loadWeather(result); }}><span>📍</span><span><b>{result.name}</b><small>{[result.admin1, result.country].filter(Boolean).join(", ")}</small></span><span className="result-arrow">↗</span></button>)}</div>}
    </section>
    {error && <div className="notice" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
    <section className="dashboard" aria-live="polite">
      <article className="current-card glass-card">
        <div className="card-heading"><div><p className="eyebrow">CURRENT WEATHER</p><h2>{locationLabel}</h2></div><button className="unit-toggle" aria-label="Toggle temperature units" onClick={() => setUnit(unit === "C" ? "F" : "C")}><span className={unit === "C" ? "selected" : ""}>°C</span><i>/</i><span className={unit === "F" ? "selected" : ""}>°F</span></button></div>
        {busy ? <div className="loading"><span className="loader"/> Gathering your forecast…</div> : weather && <><div className="hero-weather"><div><div className="temperature">{temperature(weather.current.temperature_2m)}<sup>°{unit}</sup></div><p className="condition">{condition}</p><p className="feels">Feels like {temperature(weather.current.apparent_temperature)}°{unit}</p></div><div className="hero-icon" aria-hidden="true">{icon}</div></div>
          <div className="sunline"><span>☀ Sunrise <b>{formatTime(weather.daily.sunrise[0], { hour: "numeric", minute: "2-digit" })}</b></span><span className="sun-track"><i/></span><span>☾ Sunset <b>{formatTime(weather.daily.sunset[0], { hour: "numeric", minute: "2-digit" })}</b></span></div>
          <div className="stats-grid"><div className="stat"><span className="stat-icon">◉</span><span className="stat-label">HUMIDITY</span><b>{weather.current.relative_humidity_2m}%</b></div><div className="stat"><span className="stat-icon">≋</span><span className="stat-label">WIND</span><b>{round(weather.current.wind_speed_10m)} <small>km/h</small></b></div><div className="stat"><span className="stat-icon">☂</span><span className="stat-label">PRECIPITATION</span><b>{weather.current.precipitation} <small>mm</small></b></div></div>
        </>}
      </article>
      <article className="hourly-card glass-card"><div className="section-heading"><div><p className="eyebrow">THE NEXT 12 HOURS</p><h2>Today, hour by hour</h2></div><span className="tiny-pill">LOCAL TIME</span></div>
        {busy ? <div className="loading compact"><span className="loader"/> Loading hourly forecast…</div> : weather && <div className="hourly-scroll">{hourlyIndices.map((index, n) => { const [label, emoji] = weatherInfo(weather.hourly.weather_code[index]); return <div className={`hour-item ${n === 0 ? "hour-now" : ""}`} key={weather.hourly.time[index]}><span className="hour-time">{n === 0 ? "Now" : formatTime(weather.hourly.time[index], { hour: "numeric" })}</span><span className="hour-icon" title={label}>{emoji}</span><b>{temperature(weather.hourly.temperature_2m[index])}°</b><small>💧 {weather.hourly.precipitation_probability[index] ?? 0}%</small></div>; })}</div>}
      </article>
      <article className="week-card glass-card"><div className="section-heading"><div><p className="eyebrow">PLAN AHEAD</p><h2>Your 7-day forecast</h2></div><span className="tiny-pill">7 DAYS</span></div>
        {busy ? <div className="loading compact"><span className="loader"/> Loading weekly forecast…</div> : weather && <div className="week-list">{weather.daily.time.map((day, i) => { const [label, emoji] = weatherInfo(weather.daily.weather_code[i]); const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)); return <div className="week-row" key={day}><span className="week-day">{i === 0 ? "Today" : weekday}</span><span className="week-condition"><span title={label}>{emoji}</span><small>{label}</small></span><span className="rain-chance">💧 {weather.daily.precipitation_probability_max[i] ?? 0}%</span><div className="range"><span>{temperature(weather.daily.temperature_2m_min[i])}°</span><i><b style={{ left: `${Math.max(0, Math.min(84, (weather.daily.temperature_2m_min[i] + 5) * 2))}%`, width: `${Math.max(16, Math.min(78, (weather.daily.temperature_2m_max[i] - weather.daily.temperature_2m_min[i]) * 3))}%` }}/></i><strong>{temperature(weather.daily.temperature_2m_max[i])}°</strong></div></div>; })}</div>}
      </article>
    </section>
    <footer><span>Made for clear days and curious minds.</span><span>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span></footer>
  </main>;
}
