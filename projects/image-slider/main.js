const slides = [
  {
    src: "https://picsum.photos/seed/1/400/240",
    caption: "Caption for Image 1",
  },
  {
    src: "https://picsum.photos/seed/2/400/240",
    caption: "Caption for Image 2",
  },
  {
    src: "https://picsum.photos/seed/3/400/240",
    caption: "Caption for Image 3",
  },
];


let i = 0;
const img = document.getElementById("img");
const captionEl = document.getElementById("caption");
const indicatorsContainer = document.getElementById("indicators");
let autoplayInterval = null;
const autoplayDelay = 3000;

function render() {
  img.src = slides[i].src;
  img.alt = slides[i].caption || `Slide ${i + 1}`;
  captionEl.textContent = slides[i].caption || "";

  const indicators = indicatorsContainer.children;
  for (let j = 0; j < indicators.length; j++) {
    indicators[j].classList.toggle("active", j === i);
  }
}

function goToSlide(index) {
  i = index;
  render();
  resetAutoplay();
}

function nextSlide() {
  i = (i + 1) % slides.length;
  render();
}

function prevSlide() {
  i = (i - 1 + slides.length) % slides.length;
  render();
}

function startAutoplay() {
  if (autoplayInterval) clearInterval(autoplayInterval);
  autoplayInterval = setInterval(nextSlide, autoplayDelay);
}

function stopAutoplay() {
  clearInterval(autoplayInterval);
  autoplayInterval = null;
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

function handleKeyDown(e) {
  if (e.key === "ArrowLeft") {
    prevSlide();
    resetAutoplay();
  } else if (e.key === "ArrowRight") {
    nextSlide();
    resetAutoplay();
  }
}

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    nextSlide();
    resetAutoplay();
  }
  if (touchEndX > touchStartX + 50) {
    prevSlide();
    resetAutoplay();
  }
}

function initSlider() {
  indicatorsContainer.innerHTML = "";
  slides.forEach((_, index) => {
    const button = document.createElement("button");
    button.classList.add("indicator");
    button.setAttribute("aria-label", `Go to slide ${index + 1}`);
    button.addEventListener("click", () => goToSlide(index));
    indicatorsContainer.appendChild(button);
  });

  render();

  document.getElementById("prev").addEventListener("click", () => {
    prevSlide();
    resetAutoplay();
  });
  document.getElementById("next").addEventListener("click", () => {
    nextSlide();
    resetAutoplay();
  });

  const sliderElement = document.querySelector(".slider");
  sliderElement.addEventListener("mouseenter", stopAutoplay);
  sliderElement.addEventListener("mouseleave", startAutoplay);
  sliderElement.addEventListener("focusin", stopAutoplay);
  sliderElement.addEventListener("focusout", startAutoplay);

  document.addEventListener("keydown", handleKeyDown);

  img.addEventListener("touchstart", handleTouchStart, false);
  img.addEventListener("touchend", handleTouchEnd, false);

  startAutoplay();
}

initSlider();
