const c = document.getElementById('clock');
const ctx = c.getContext('2d');
const timezoneSelect = document.getElementById('timezone-select');

let selectedTimezone = 'local';

timezoneSelect.addEventListener('change', (e) => {
    selectedTimezone = e.target.value;
});

function getCurrentTime() {
    const now = new Date();
    if (selectedTimezone === 'local') {
        return now;
    }
    
    try {
        const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: selectedTimezone}));
        const localTime = new Date(now.toLocaleString("en-US"));
        const diff = localTime.getTime() - timeInTimezone.getTime();
        return new Date(now.getTime() - diff);
    } catch (error) {
        return now;
    }
}

function draw() {
    const now = getCurrentTime();
    const w = c.width, h = c.height, r = w / 2;
    
    ctx.clearRect(0, 0, w, h);
    ctx.translate(r, r);
    ctx.strokeStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
    ctx.stroke();
    
    function hand(angle, len, width) {
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len);
        ctx.stroke();
        ctx.restore();
    }
    
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr = ((now.getHours() % 12) + min / 60);
    
    hand(hr * Math.PI / 6, r * 0.5, 4);
    hand(min * Math.PI / 30, r * 0.75, 3);
    hand(sec * Math.PI / 30, r * 0.85, 1);
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    requestAnimationFrame(draw);
}

ctx.strokeStyle = '#6ee7b7';
ctx.lineCap = 'round';
draw();
