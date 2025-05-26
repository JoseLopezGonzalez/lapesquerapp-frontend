export const darkToastTheme = {
  style: {
    background: '#171717',
    color: '#fff',
    borderColor: '#404040',
    borderWidth: '1px',

  }
}

// customs/reactHotToastTheme.js
export const getToastTheme = () => {
  const isDark = document.documentElement.classList.contains("dark");

  return {
    style: {
      background: isDark ? "#171717" : "#fff",
      color: isDark ? "#fff" : "#000",
      borderColor: isDark ? "#404040" : "#d1d5db", // gris-300
      borderWidth: "1px",
    },
  };
};
