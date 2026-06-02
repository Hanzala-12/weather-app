export interface Suggestion {
  message: string;
  icon: string;
}

export function getTravelSuggestion(
  condition: string,
  temperature: number,
  humidity: number,
  windSpeed: number,
  description: string
): Suggestion {
  const desc = description.toLowerCase();

  if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("thunderstorm")) {
    return {
      message: "Carry an umbrella today. Rain is expected.",
      icon: "🌂",
    };
  }

  if (desc.includes("snow") || desc.includes("sleet")) {
    return {
      message: "Snow expected! Dress warmly and drive carefully.",
      icon: "⛄",
    };
  }

  if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) {
    return {
      message: "Low visibility due to fog. Drive safely.",
      icon: "🌫️",
    };
  }

  if (condition === "Clear" || condition === "Sunny") {
    if (temperature > 30) {
      return {
        message: "Very hot today! Stay hydrated and wear sunscreen.",
        icon: "☀️",
      };
    }
    if (temperature > 20) {
      return {
        message: "Good weather for outdoor activities. Enjoy your day!",
        icon: "😎",
      };
    }
    return {
      message: "Clear skies. A pleasant day ahead!",
      icon: "🌤️",
    };
  }

  if (condition === "Clouds") {
    if (temperature > 25) {
      return {
        message: "Cloudy but warm. A good day for a walk.",
        icon: "⛅",
      };
    }
    return {
      message: "Overcast skies. Might be a good day to stay indoors.",
      icon: "☁️",
    };
  }

  if (windSpeed > 30) {
    return {
      message: "Very windy! Secure loose items outdoors.",
      icon: "💨",
    };
  }

  if (humidity > 80) {
    return {
      message: "High humidity today. Stay cool and hydrated.",
      icon: "💧",
    };
  }

  return {
    message: "Weather looks neutral. Check back for updates!",
    icon: "🌡️",
  };
}
