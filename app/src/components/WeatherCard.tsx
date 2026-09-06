import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LATITUDE = 43.183;
const LONGITUDE = 25.617;

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
  `&forecast_days=4&timezone=Europe%2FSofia`;

type WeatherData = {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

function describeWeatherCode(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Ясно" };
  if ([1, 2, 3].includes(code)) return { icon: "⛅", label: "Облачно" };
  if ([45, 48].includes(code)) return { icon: "🌫️", label: "Мъгла" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", label: "Ръмеж" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧️", label: "Дъжд" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️", label: "Сняг" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", label: "Гръмотевична буря" };
  return { icon: "🌡️", label: "" };
}

const DAY_NAMES = ["Нед", "Пон", "Вт", "Ср", "Чет", "Пет", "Съб"];

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(WEATHER_URL)
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!weather) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  const current = describeWeatherCode(weather.current.weather_code);

  return (
    <View style={styles.card}>
      <View style={styles.currentRow}>
        <Text style={styles.currentIcon}>{current.icon}</Text>
        <View>
          <Text style={styles.currentTemp}>{Math.round(weather.current.temperature_2m)}°C</Text>
          <Text style={styles.currentLabel}>{current.label} · Поликраище</Text>
        </View>
      </View>
      <View style={styles.forecastRow}>
        {weather.daily.time.slice(0, 4).map((date, i) => {
          const day = describeWeatherCode(weather.daily.weather_code[i]);
          const dayName = DAY_NAMES[new Date(date).getDay()];
          return (
            <View key={date} style={styles.forecastDay}>
              <Text style={styles.forecastDayName}>{i === 0 ? "Днес" : dayName}</Text>
              <Text style={styles.forecastIcon}>{day.icon}</Text>
              <Text style={styles.forecastTemp}>
                {Math.round(weather.daily.temperature_2m_max[i])}°/
                {Math.round(weather.daily.temperature_2m_min[i])}°
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  center: { alignItems: "center", justifyContent: "center", minHeight: 60 },
  currentRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  currentIcon: { fontSize: 40, marginRight: 12 },
  currentTemp: { fontSize: 26, fontWeight: "700" },
  currentLabel: { fontSize: 13, color: "#666" },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  forecastDay: { alignItems: "center", flex: 1 },
  forecastDayName: { fontSize: 12, color: "#888", marginBottom: 4 },
  forecastIcon: { fontSize: 20, marginBottom: 4 },
  forecastTemp: { fontSize: 12, color: "#333" },
});
