/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gold:    { DEFAULT: "#F8AC12", light: "#FFF3DC", dark: "#C98A00" },
        ink:     { DEFAULT: "#000000", 90: "#111111", 80: "#1C1C1C", 70: "#2A2A2A", 60: "#3D3D3D", 40: "#666666", 20: "#999999", 10: "#CCCCCC" },
        snow:    { DEFAULT: "#FFFFFF", 90: "#F5F5F5", 80: "#EBEBEB" },
        success: "#22C55E",
        error:   "#EF4444",
        whatsapp:"#25D366",
      },
      fontFamily: {
        regular: ["AmazonEmber-Regular"],
        medium:  ["AmazonEmber-Medium"],
        bold:    ["AmazonEmber-Bold"],
        mono:    ["AmazonEmber-Mono"],
      },
    },
  },
  plugins: [],
};
