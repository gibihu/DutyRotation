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

// ข้อมูลตามที่ผู้ใช้กำหนด
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
let focusedShift = null; // สถานะการ Focus ผลัด

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

    // วาดส่วนโค้งเวลา
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
            
            // เก็บข้อมูลไว้สำหรับการทำ Focus
            path.setAttribute("data-shift", shift.name);
            path.setAttribute("data-type", shift.type);

            // จัดการ Event สำหรับ Tooltip
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
                if(window.matchMedia("(pointer: fine)").matches) {
                    handleShowTooltip(e);
                }
            });
            
            path.addEventListener('mouseleave', () => {
                if(window.matchMedia("(pointer: fine)").matches) {
                    tooltip.style.opacity = '0';
                }
            });

            svg.appendChild(path);
        });
    });

    // วาดขีดชี้บอกเวลา
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
        
        if(id === 'sec-hand'){
            line.setAttribute("filter", "drop-shadow(0 0 2px rgba(0,0,0,0.5))");
        }
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
    updateFocusUI(); // อัปเดตสถานะ Focus ล่าสุด
}

// Render กล่องสีด้านล่าง (Legend) และระบบ Focus
function renderLegend() {
    const legendBox = document.getElementById('legend-box');
    legendBox.innerHTML = '';
    
    for(let i=1; i<=4; i++) {
        let name = `ผลัด ${i}`;
        
        let item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="color-box" style="background:${shiftColors[name]};"></div>
            <span>${name}</span>
        `;
        
        // เมื่อคลิกที่ปุ่ม Legend
        item.addEventListener('click', () => {
            // ถัาคลิกซ้ำผลัดเดิม ให้ยกเลิก Focus
            if (focusedShift === name) {
                focusedShift = null; 
            } else {
                focusedShift = name; // กำหนดผลัดที่ถูก Focus
            }
            updateFocusUI();
        });
        
        legendBox.appendChild(item);
    }
}

// ฟังก์ชันจัดการการแสดงผลเวลา Focus ผลัด
function updateFocusUI() {
    // 1. จัดการ UI ของปุ่ม Legend
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        const shiftName = item.querySelector('span').textContent.trim();
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

    // 2. จัดการเส้นผลัด (Path) ในนาฬิกา
    const paths = document.querySelectorAll('.shift-path');
    paths.forEach(path => {
        const shiftName = path.getAttribute('data-shift');
        const shiftType = path.getAttribute('data-type');
        
        // ค่า Opacity พื้นฐาน (นั่งหนุนจางกว่าเข้าจุด)
        let baseOpacity = (shiftType === 'x') ? "0.5" : "1.0";
        
        if (focusedShift === null) {
            // ไม่มี Focus กลับสู่สภาพเดิม
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = 'none';
        } else if (shiftName === focusedShift) {
            // ผลัดที่ถูก Focus โชว์สีปกติ (หรือใส่ Glow สว่างขึ้นนิดหน่อยได้)
            path.setAttribute("stroke-opacity", baseOpacity);
            path.style.filter = `drop-shadow(0 0 5px ${shiftColors[shiftName]})`;
        } else {
            // ผลัดที่ไม่ถูก Focus ให้จางลงและลดสี (Grayscale)
            path.setAttribute("stroke-opacity", "0.08");
            path.style.filter = 'grayscale(100%)';
        }
    });
}

// 4. อัปเดตเวลาเข็มทิศ (ตามเวลาโลก UTC+7)
function updateRealTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bkkTime = new Date(utc + (3600000 * 7));

    const h = bkkTime.getHours();
    const m = bkkTime.getMinutes();
    const s = bkkTime.getSeconds();

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

// 5. จัดการอีเวนต์ต่าง ๆ (Events)

// คลิกพื้นที่ว่างปิด Tooltip
document.addEventListener('click', (e) => {
    if(!e.target.classList.contains('shift-path')) {
        tooltip.style.opacity = '0';
        activeTooltipPath = null;
    }
});

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
});

// Settings Modal
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
    updateRealTime(); 
});

// รันครั้งแรก
renderClock();
updateRealTime();
setInterval(updateRealTime, 1000);
