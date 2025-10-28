 document.addEventListener('DOMContentLoaded', () => {
  console.log('Drawing Canvas ready');
  
  // TODO: Canvas setup and draw handlers
  const canvas = document.getElementById('drawingCanvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = document.getElementById('colorPicker');
  const brushSize = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const clearButton = document.getElementById('clearButton');
  const saveButton = document.getElementById('saveButton');
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let dpr = window.devicePixelRatio || 1;
  
  // Initialize canvas
  function initCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Set canvas size with DPR scaling
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context for high DPI displays
    ctx.scale(dpr, dpr);
    
    // Set initial drawing styles
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Drawing functions
  function startDrawing(e) {
    isDrawing = true;
    const pos = getPointerPos(e);
    [lastX, lastY] = [pos.x, pos.y];
  }
  
  function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    const pos = getPointerPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    [lastX, lastY] = [pos.x, pos.y];
  }
  
  function stopDrawing() {
    isDrawing = false;
  }
  
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (canvas.width / dpr / rect.width),
      y: (clientY - rect.top) * (canvas.height / dpr / rect.height)
    };
  }
  
  // Event handlers for controls
  colorPicker.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
  });
  
  brushSize.addEventListener('input', (e) => {
    const size = e.target.value;
    ctx.lineWidth = size;
    brushSizeValue.textContent = size;
  });
  
  clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  });
  
  saveButton.addEventListener('click', () => {
    // Create a temporary canvas for saving at original resolution
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Draw the high-resolution content to temp canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `drawing-${new Date().getTime()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  });
  
  // Pointer event handlers for drawing
  canvas.addEventListener('pointerdown', startDrawing);
  canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointerout', stopDrawing);
  
  // Touch event handlers for mobile devices
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  
  canvas.addEventListener('touchend', stopDrawing);
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (confirm('Resizing will clear your current drawing. Continue?')) {
        initCanvas();
      }
    }, 250);
  });
  
  // Prevent context menu on canvas
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Initialize the canvas
  initCanvas();
});