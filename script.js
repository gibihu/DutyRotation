// โหลดการตั้งค่าโหมดมืด/สว่าง จาก LocalStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
}

// 1. ระบบจัดการสีและการตั้งค่า (LocalStorage)
const defaultColors = {
    "ผลัด 1": "#FFD700",
    "ผลัด 2": "#00BFFF",
    "ผลัด 3": "#32CD32",
    "ผลัด 4": "#FF4500"
};

let shiftColors = JSON.parse(localStorage.getItem('shiftColors')) || defaultColors;

// ข้อมูลวงรอบเวลาตามที่กำหนด
const periodsData = [
    {
        label: "รอบที่ 1",
        baseRadius: 130,
        shifts: [
            { name: "ผลัด 1", type: 'x', start: '06.45', end: '08.45' },
            { name: "ผลัด 1", type: 'x.1', start: '08.45', end: '10.45' },
            { name: "ผลัด 2", type: 'x', start: '08.45', end: '10.45' },
            { name: "ผลัด 2", type: 'x.1', start: '10.45', end: '12.45' },
            { name: "ผลัด 3", type: 'x', start: '10.45', end: '12.45' },
            { name: "ผลัด 3", type: 'x.1', start: '12.45', end: '14.45' },
            { name: "ผลัด 4", type: 'x', start: '12.45', end: '14.45' },
            { name: "ผลัด 4", type: 'x.1', start: '14.45', end: '16.45' }
        ]
    },
    {
        label: "รอบที่ 2",
        baseRadius: 180,
        shifts: [
            { name: "ผลัด 1", type: 'x', start: '14.45', end: '16.45' },
            { name: "ผลัด 1", type: 'x.1', start: '16.45', end: '18.45' },
            { name: "ผลัด 2", type: 'x', start: '16.45', end: '18.45' },
            { name: "ผลัด 2", type: 'x.1', start: '18.45', end: '20.45' },
            { name: "ผลัด 3", type: 'x', start: '18.45', end: '20.45' },
            { name: "ผลัด 3", type: 'x.1', start: '20.45', end: '22.45' },
            { name: "ผลัด 4", type: 'x.1', start: '22.45', end: '00.45' }
        ]
    },
    {
        label: "รอบที่ 3",
        baseRadius: 230,
        shifts: [
            { name: "ผลัด 1", type: 'x.1', start: '00.45', end: '02.45' },
            { name: "ผลัด 2", type: 'x.1', start: '02.45', end: '04.45' },
            { name: "ผลัด 3", type: 'x.1', start: '04.45', end: '06.45' },
            { name: "ผลัด 4", type: 'x', start: '04.45', end: '06.45' },
            { name: "ผลัด 4", type: 'x.1', start: '06.45', end: '08.45' }
        ]
    }
];

const svg = document.getElementById('clock-svg');
const tooltip = document.getElementById('tooltip');
const centerX = 270;
const centerY = 270;

let activeTooltipPath = null;
let focusedShift = null; 

// 2. ฟังก์ชันคณิตศาสตร์และการวาด
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle){
    if (endAngle < startAngle) endAngle += 360; 
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

function timeToAngle(timeStr) {
    let parts = timeStr.split('.');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) || 0;
    let decimalHours = (h % 12) + (m / 60);
    return decimalHours * 30; 
}

// 3. ฟังก์ชันหลักสำหรับวาดหน้าปัด
function renderClock() {
    svg.innerHTML = '';
    
    // วาดพื้นหลังหน้าปัด
    let dial = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dial.setAttribute("cx", centerX);
    dial.setAttribute("cy", centerY);
    dial.setAttribute("r", 260);
    dial.setAttribute("fill", "var(--dial-bg)");
    dial.setAttribute("stroke", "var(--dial-stroke)");
    dial.setAttribute("stroke-width", "3");
    svg.appendChild(dial);

    // วาดเส้นไกด์ไลน์
    periodsData.forEach(p => {
        let ref = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ref.setAttribute("cx", centerX);
        ref.setAttribute("cy", centerY);
        ref.setAttribute("r", p.baseRadius);
        ref.setAttribute("fill", "none");
        ref.setAttribute("stroke", "var(--text-color)");
        ref.setAttribute("stroke-opacity", "0.05");
        ref.setAttribute("stroke-width", "28"); 
        svg.appendChild(ref);
    });

    // วาดส่วนโค้งเวลา (Path)
    periodsData.forEach(period => {
        period.shifts.forEach(shift => {
            let startAngle = timeToAngle(shift.start);
            let endAngle = timeToAngle(shift.end);
            
            let actualRadius = period.baseRadius;
            if (shift.type === 'x') {
                actualRadius -= 7;
            } else {
                actualRadius += 7;
            }

            let pathD = describeArc(centerX, centerY, actualRadius, startAngle, endAngle);
            
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", shiftColors[shift.name]);
            path.setAttribute("stroke-width", "14");
            path.setAttribute("stroke-linecap", "butt");
            path.setAttribute("class", "shift-path");
            
            path.setAttribute("data-shift", shift.name);
            path.setAttribute("data-type", shift.type);
            
            // เก็บเวลาเริ่มและจบไว้ใช้ในฟังก์ชันค้นหาเวลาปัจจุบันด้วย
            path.setAttribute("data-start", shift.start);
            path.setAttribute("data-end", shift.end);

            const content = `${period.label}<br>${shift.start}-${shift.end}`;
            
            const handleShowTooltip = (e) => {
                e.stopPropagation();
                let clientX, clientY;
                if(e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                tooltip.innerHTML = content;
                tooltip.style.left = clientX + 'px';
                tooltip.style.top = clientY + 'px';
                tooltip.style.opacity = '1';
                activeTooltipPath = path;
            };

            path.addEventListener('click', handleShowTooltip);
            path.addEventListener('mouseenter', (e) => {
                if(window.matchMedia("(pointer: fine)").matches) handleShowTooltip(e);
            });
            path.addEventListener('mouseleave', () => {
                if(window.matchMedia("(pointer: fine)").matches) tooltip.style.opacity = '0';
            });

            svg.appendChild(path);
        });
    });

    // วาดขีดชี้บอกเวลา 60 นาที
    for (let m = 0; m < 60; m++) {
        let angle = m * 6;
        let isHour = m % 5 === 0;
        
        let tickStart = polarToCartesian(centerX, centerY, isHour ? 95 : 100, angle);
        let tickEnd = polarToCartesian(centerX, centerY, 105, angle);
        
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", tickStart.x);
        line.setAttribute("y1", tickStart.y);
        line.setAttribute("x2", tickEnd.x);
        line.setAttribute("y2", tickEnd.y);
        line.setAttribute("stroke", "var(--tick-color)");
        line.setAttribute("stroke-width", isHour ? "3" : "1");
        line.setAttribute("stroke-opacity", isHour ? "0.8" : "0.3");
        line.setAttribute("stroke-linecap", "butt");
        svg.appendChild(line);
    }

    // วาดตัวเลขนาฬิกา
    for (let i = 1; i <= 12; i++) {
        let angle = i * 30;
        let coords = polarToCartesian(centerX, centerY, 75, angle);
        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", coords.x);
        text.setAttribute("y", coords.y + 4);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("fill", "var(--tick-color)");
        text.setAttribute("font-size", "24");
        text.setAttribute("font-weight", "bold");
        text.textContent = i;
        svg.appendChild(text);
    }

    // สร้างเข็มนาฬิกา
    const createHand = (id, length, width, color) => {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("id", id);
        line.setAttribute("x1", centerX);
        line.setAttribute("y1", centerY + (id === 'sec-hand' ? 25 : 10));
        line.setAttribute("x2", centerX);
        line.setAttribute("y2", centerY - length);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", width);
        line.setAttribute("stroke-linecap", "round");
        if(id === 'sec-hand') line.setAttribute("filter", "drop-shadow(0 0 2px rgba(0,0,0,0.5))");
        svg.appendChild(line);
        return line;
    };

    createHand('hr-hand', 90, 8, "var(--tick-color)");
    createHand('min-hand', 140, 5, "var(--tick-color)");
    createHand('sec-hand', 160, 2, "#FF3333");
    
    let centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerDot.setAttribute("cx", centerX);
    centerDot.setAttribute("cy", centerY);
    centerDot.setAttribute("r", "8");
    centerDot.setAttribute("fill", "#FF3333");
    centerDot.setAttribute("stroke", "var(--tick-color)");
    centerDot.setAttribute("stroke-width", "2");
    svg.appendChild(centerDot);

    renderLegend();
    updateFocusUI(); 
}

// 4. Render กล่องสีด้านล่าง (Legend V2.0)
function renderLegend() {
    const legendBox = document.getElementById('legend-box');
    legendBox.innerHTML = '';
    
    // 4.1 ปุ่ม "รอบปัจจุบัน"
    let currentBtn = document.createElement('div');
    currentBtn.className = 'legend-item';
    currentBtn.id = 'current-mode-btn';
    currentBtn.style.border = '1px solid var(--text-color)';
    currentBtn.innerHTML = `<span>📍 รอบปัจจุบัน</span>`;
    
    currentBtn.addEventListener('click', () => {
        if (focusedShift === "CURRENT_MODE") {
            focusedShift = null; // ยกเลิกการโฟกัสถ้าระบบกดซ้ำ
            updateFocusUI();
        } else {
            focusCurrentShift();
        }
    });
    legendBox.appendChild(currentBtn);
    
    // 4.2 ปุ่มผลัดปกติ
    for(let i=1; i<=4; i++) {
        let name = `ผลัด ${i}`;
        let item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="color-box" style="background:${shiftColors[name]};"></div>
            <span>${name}</span>
        `;
        
        item.addEventListener('click', () => {
            focusedShift = (focusedShift === name) ? null : name;
            updateFocusUI();
        });
        
        legendBox.appendChild(item);
    }
}

// 5. ฟังก์ชันคำนวณและโฟกัสรอบปัจจุบัน + รอบที่จะถึง
function focusCurrentShift() {
    const now = new Date();
    const bkkHours = now.getHours();
    const bkkMinutes = now.getMinutes();
    const currentTimeVal = bkkHours + (bkkMinutes / 100); 

    let activeShifts = [];
    let nextStartTimes = new Set(); // ใช้ Set เก็บเวลาจบของผลัดปัจจุบัน เพื่อเอาไปหาผลัดถัดไป

    // 1. หาผลัดที่ Active ในเวลาปัจจุบัน
    periodsData.forEach(period => {
        period.shifts.forEach(shift => {
            let start = parseFloat(shift.start);
            let end = parseFloat(shift.end);
            
            let isActive = false;
            if (start > end) { // กรณีข้ามวัน
                if (currentTimeVal >= start || currentTimeVal < end) isActive = true;
            } else {
                if (currentTimeVal >= start && currentTimeVal < end) isActive = true;
            }

            if (isActive) {
                activeShifts.push(shift);
                nextStartTimes.add(shift.end); // เก็บเวลาจบของเวรนี้เอาไว้เป็นเป้าหมาย
            }
        });
    });

    // 2. หาผลัดถัดไป (Upcoming) ที่กำลังจะถึง
    let upcomingShifts = [];
    periodsData.forEach(period => {
        period.shifts.forEach(shift => {
            // ถ้าเวลาเริ่มของผลัดนี้ ตรงกับเวลาจบของผลัดปัจจุบัน แปลว่าเป็นรอบถัดไปทันที
            if (nextStartTimes.has(shift.start)) {
                upcomingShifts.push(shift);
            }
        });
    });

    focusedShift = "CURRENT_MODE"; 
    
    // อัปเดต UI ของปุ่ม Legend
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        if (item.id === 'current-mode-btn') {
            item.style.opacity = '1';
            item.style.transform = 'scale(1.05)';
            item.style.backgroundColor = 'var(--panel-border)';
        } else {
            item.style.opacity = '0.3';
            item.style.transform = 'scale(0.95)';
            item.style.backgroundColor = 'transparent';
        }
    });

    // อัปเดต Path บนหน้าปัด
    const paths = document.querySelectorAll('.shift-path');
    paths.forEach(path => {
        const shiftName = path.getAttribute('data-shift');
        const shiftType = path.getAttribute('data-type');
        const shiftStart = path.getAttribute('data-start');
        const shiftEnd = path.getAttribute('data-end');
        
        // ตรวจสอบว่าเส้นนี้คือเวรปัจจุบัน หรือเวรที่จะถึง
        const isMatchActive = activeShifts.some(s => s.name === shiftName && s.type === shiftType && s.start === shiftStart && s.end === shiftEnd);
        const isMatchUpcoming = upcomingShifts.some(s => s.name === shiftName && s.type === shiftType && s.start === shiftStart && s.end === shiftEnd);
        
        if (isMatchActive) {
            // เวรปัจจุบัน: สว่างชัดเจน + แสง Glow เข้ม
            let baseOpacity = (shiftType === 'x') ? "0.6" : "1.0";
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = `drop-shadow(0 0 8px ${shiftColors[shiftName]})`;
        } else if (isMatchUpcoming) {
            // เวรที่จะถึง: สว่างรองลงมา + แสง Glow อ่อนๆ (ดูรู้ว่าเตรียมตัว)
            let baseOpacity = (shiftType === 'x') ? "0.3" : "0.7";
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = `drop-shadow(0 0 3px ${shiftColors[shiftName]})`;
        } else {
            // ไม่เกี่ยวข้อง: จางลงและเป็นสีเทา
            path.setAttribute("stroke-opacity", "0.05");
            path.style.filter = 'grayscale(100%)';
        }
    });
}



// 6. ฟังก์ชันจัดการการแสดงผลเวลา Focus แบบกดเลือกผลัดปกติ
function updateFocusUI() {
    if (focusedShift === "CURRENT_MODE") return; // ข้ามฟังก์ชันนี้ถ้ากำลังเปิดโหมดปัจจุบันอยู่

    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        if (item.id === 'current-mode-btn') {
            item.style.opacity = '0.7';
            item.style.transform = 'scale(1)';
            item.style.backgroundColor = 'transparent';
            return;
        }

        const shiftName = item.querySelector('span').textContent.trim();
        item.style.backgroundColor = 'transparent';

        if (focusedShift === null) {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        } else if (shiftName === focusedShift) {
            item.style.opacity = '1';
            item.style.transform = 'scale(1.1)';
        } else {
            item.style.opacity = '0.3';
            item.style.transform = 'scale(0.95)';
        }
    });

    const paths = document.querySelectorAll('.shift-path');
    paths.forEach(path => {
        const shiftName = path.getAttribute('data-shift');
        const shiftType = path.getAttribute('data-type');
        let baseOpacity = (shiftType === 'x') ? "0.5" : "1.0";
        
        if (focusedShift === null) {
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = 'none';
        } else if (shiftName === focusedShift) {
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = `drop-shadow(0 0 5px ${shiftColors[shiftName]})`;
        } else {
            path.setAttribute("stroke-opacity", "0.08");
            path.style.filter = 'grayscale(100%)';
        }
    });
}

// 7. อัปเดตเวลาเข็มทิศ (แบบ Real-time)
function updateRealTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    const hAngle = (h % 12 + m / 60) * 30;
    const mAngle = (m + s / 60) * 6;
    const sAngle = s * 6;

    const hrHand = document.getElementById('hr-hand');
    const minHand = document.getElementById('min-hand');
    const secHand = document.getElementById('sec-hand');

    if(hrHand && minHand && secHand) {
        hrHand.setAttribute('transform', `rotate(${hAngle} ${centerX} ${centerY})`);
        minHand.setAttribute('transform', `rotate(${mAngle} ${centerX} ${centerY})`);
        secHand.setAttribute('transform', `rotate(${sAngle} ${centerX} ${centerY})`);
    }

    document.getElementById('digital-clock').textContent = 
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// 8. จัดการอีเวนต์พื้นฐาน

document.addEventListener('click', (e) => {
    if(!e.target.classList.contains('shift-path')) {
        tooltip.style.opacity = '0';
        activeTooltipPath = null;
    }
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
});

const modal = document.getElementById('settings-modal');
document.getElementById('settings-toggle').addEventListener('click', () => {
    document.getElementById('color-p1').value = shiftColors["ผลัด 1"];
    document.getElementById('color-p2').value = shiftColors["ผลัด 2"];
    document.getElementById('color-p3').value = shiftColors["ผลัด 3"];
    document.getElementById('color-p4').value = shiftColors["ผลัด 4"];
    modal.classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.remove('active');
});

document.getElementById('save-settings').addEventListener('click', () => {
    shiftColors["ผลัด 1"] = document.getElementById('color-p1').value;
    shiftColors["ผลัด 2"] = document.getElementById('color-p2').value;
    shiftColors["ผลัด 3"] = document.getElementById('color-p3').value;
    shiftColors["ผลัด 4"] = document.getElementById('color-p4').value;
    
    localStorage.setItem('shiftColors', JSON.stringify(shiftColors));
    
    modal.classList.remove('active');
    renderClock(); 
});

// เริ่มต้นระบบ
renderClock();
updateRealTime();
setInterval(updateRealTime, 1000);
