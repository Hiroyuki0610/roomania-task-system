@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'M PLUS Rounded 1c', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9fafb;
}

* {
  box-sizing: border-box;
}

/* PWA用のアニメーション */
@keyframes slide-in-from-top {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-in {
  animation-fill-mode: both;
}

.slide-in-from-top {
  animation-name: slide-in-from-top;
}

.fade-in {
  animation-name: fade-in;
}

.duration-200 {
  animation-duration: 200ms;
}

.duration-500 {
  animation-duration: 500ms;
}
