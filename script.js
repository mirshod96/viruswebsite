const sections = [
  { folder: "logo", start: 0, end: 10 },
  { folder: "01_adenovirus_aylanishi", start: 10, end: 20 },
  { folder: "02_adenovirus_tuzilishi", start: 20, end: 30 },
  { folder: "04_virusni_tozalash", start: 30, end: 40 },
  { folder: "03_virusni_tozalash", start: 40, end: 50 },
  { folder: "05_vektor_qoplash", start: 50, end: 60 },
  { folder: "06_vaksina_yuborish", start: 60, end: 70 },
  { folder: "07_hujayra_ichiga", start: 70, end: 80 },
  { folder: "08_hujayra_ichiga", start: 80, end: 90 },
  { folder: "09_antitelalar_javobi", start: 90, end: 100 }
];

const canvas = document.getElementById("scrolly-canvas");
const ctx = canvas.getContext("2d");

// Responsive canvas size setup
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Single image object for Ultra-Low Memory usage (Safari Fix)
const renderImage = new Image();

const steps = document.querySelectorAll(".step");

// A target frame and current frame for smooth interpolation
let targetSectionIndex = 0;
let targetFrameIndex = 0;

let currentSectionIndex = 0;
let currentFrameIndex = 0;

function updateScrollState() {
  const scrollTop = document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  let scrollFraction = scrollTop / maxScroll;
  if(isNaN(scrollFraction)) scrollFraction = 0;

  // Convert to percentage
  const scrollPercent = scrollFraction * 100;
  
  // Find current section based on scroll percent
  let activeSectionIdx = 0;
  let activeSection = null;
  
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (scrollPercent >= s.start && scrollPercent <= s.end) {
      activeSection = s;
      activeSectionIdx = i;
      break;
    }
  }

  if (!activeSection) {
    if (scrollPercent < sections[0].start) {
      activeSection = sections[0];
      activeSectionIdx = 0;
    } else if (scrollPercent > sections[sections.length - 1].end) {
      activeSection = sections[sections.length - 1];
      activeSectionIdx = sections.length - 1;
    } else {
      activeSection = sections[0];
      for(let i=0; i<sections.length; i++) {
        if(scrollPercent < sections[i].start) {
          activeSection = sections[i-1] ? sections[i-1] : sections[0];
          activeSectionIdx = i-1 < 0 ? 0 : i-1;
          break;
        }
      }
    }
  }

  const sectionRange = Math.max(0.0001, activeSection.end - activeSection.start);
  let localProgress = (scrollPercent - activeSection.start) / sectionRange;
  localProgress = Math.min(Math.max(localProgress, 0), 1);
  
  steps.forEach((step, idx) => {
    if (idx === activeSectionIdx) {
      step.classList.add("active");
      step.style.opacity = 1;
    } else {
      step.classList.remove("active");
      step.style.opacity = 0;
    }
  });

  const folderName = activeSection.folder;
  const folderFrames = framesData[folderName];
  
  const maxFrameIndex = folderFrames.length - 1;
  targetSectionIndex = activeSectionIdx;
  targetFrameIndex = Math.floor(localProgress * maxFrameIndex);
  
  // Handle static logo visibility dynamically
  const staticLogo = document.querySelector('.logo-container');
  if (staticLogo) {
    if (activeSectionIdx === 0) {
      staticLogo.style.opacity = '0';
      staticLogo.style.pointerEvents = 'none';
    } else {
      staticLogo.style.opacity = '1';
      staticLogo.style.pointerEvents = 'auto';
    }
  }
}

// Auto-scroll logic to make it continue without looping
let isManualScrolling = false;
let interactionTimeout;

function handleInteraction() {
  isManualScrolling = true;
  clearTimeout(interactionTimeout);
  interactionTimeout = setTimeout(() => {
    isManualScrolling = false;
  }, 1500);
}

window.addEventListener('wheel', handleInteraction, { passive: true });
window.addEventListener('touchstart', handleInteraction, { passive: true });
window.addEventListener('touchmove', handleInteraction, { passive: true });

// Audio Logic Integration
const startOverlay = document.getElementById("start-overlay");
if (startOverlay) {
  startOverlay.style.display = "none";
}
const muteBtn = document.getElementById("mute-btn");

let isAudioStarted = true; // start automatically
let isMuted = false;
let currentPlayingAudio = null;
let lastPlayedFolder = "";

// Attempt to start audio immediately or on first user interaction if blocked
setTimeout(() => {
  if (sections.length > 0) {
    playSectionAudio(sections[currentSectionIndex].folder);
  }
}, 500);

let interactionEvents = ['click', 'touchstart', 'keydown'];
function unlockAudio() {
    if (sections.length > 0) {
        if (currentPlayingAudio && currentPlayingAudio.paused) {
            playSectionAudio(sections[currentSectionIndex].folder, true);
        }
    }
    interactionEvents.forEach(e => document.removeEventListener(e, unlockAudio));
}
interactionEvents.forEach(e => document.addEventListener(e, unlockAudio));

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.innerText = isMuted ? "🔇 Ovoz o'chirilgan" : "🔊 Ovoz yoqilgan";
  
  if (currentPlayingAudio) {
    currentPlayingAudio.muted = isMuted;
  }
});

function playSectionAudio(folderName, forceReplay = false) {
  if (!isAudioStarted) return;
  if (!forceReplay && lastPlayedFolder === folderName) return; 
  
  if (currentPlayingAudio && currentPlayingAudio !== document.getElementById(`video-${folderName}`)) {
    currentPlayingAudio.pause();
    // Do NOT reset currentTime for video scrubbing, just pause sound if needed
    // Actually, for scrollytelling videos, we keep them paused and just scrub currentTime
  }
  
  const videoElement = document.getElementById(`video-${folderName}`);
  if (videoElement) {
    currentPlayingAudio = videoElement;
    currentPlayingAudio.muted = isMuted;
    
    // We don't "play" the video in the traditional sense for scrollytelling, 
    // but we need it to be "playing" or "active" for audio if there's sound.
    // However, scrubbing works best when paused or carefully managed.
    let playPromise = currentPlayingAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        lastPlayedFolder = folderName;
      }).catch(error => {
        lastPlayedFolder = ""; 
      });
    } else {
      lastPlayedFolder = folderName;
    }
  }
}

let targetVideoTime = 0;
let currentVideoTime = 0;

function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (!isManualScrolling && isAudioStarted) {
    window.scrollBy(0, 3);
  }

  const section = sections[targetSectionIndex];
  
  if (currentSectionIndex !== targetSectionIndex) {
    currentSectionIndex = targetSectionIndex;
    currentFrameIndex = targetFrameIndex;
    playSectionAudio(section.folder);
  } else {
    currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.1;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (section.folder === "logo") {
    // Frame-based rendering for Logo
    const frames = framesData[section.folder];
    if (!frames || frames.length === 0) return;

    let drawIndex = Math.round(currentFrameIndex);
    if (drawIndex < 0) drawIndex = 0;
    if (drawIndex >= frames.length) drawIndex = frames.length - 1;
    
    const desiredSrc = frames[drawIndex];
    if (renderImage.getAttribute("data-src") !== desiredSrc) {
      renderImage.src = desiredSrc;
      renderImage.setAttribute("data-src", desiredSrc);
    }
    
    if (renderImage.complete && renderImage.width > 0) {
      const scale = Math.max(canvas.width / renderImage.width, canvas.height / renderImage.height);
      const w = renderImage.width * scale;
      const h = renderImage.height * scale;
      ctx.drawImage(renderImage, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }
  } else {
    // Video-based scrubbing for Virus sections
    const video = document.getElementById(`video-${section.folder}`);
    if (video && video.readyState >= 2) {
      // Smoothly interpolate time for better Safari feel
      const maxFrameIndex = (framesData[section.folder] || {length: 100}).length;
      const progress = currentFrameIndex / (maxFrameIndex - 1);
      
      const targetTime = progress * video.duration;
      video.currentTime = targetTime;
      
      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const w = video.videoWidth * scale;
      const h = video.videoHeight * scale;
      ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }
  }
}

// Background preloader only for Logo (others use Video native preloading)
function preloadLogoFrames() {
  const logoFrames = framesData["logo"] || [];
  logoFrames.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}
preloadLogoFrames();

// Ensure clean start on page load/refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Initialize
window.addEventListener("scroll", updateScrollState);
updateScrollState();
renderLoop();
