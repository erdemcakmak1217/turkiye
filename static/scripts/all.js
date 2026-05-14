window.addEventListener("load", async () => {
    const res = await fetch("../static/css/turkiye.svg");
    const svgText = await res.text();

    const container = document.getElementById("harita");
    container.innerHTML = svgText;
    
    let iller = container.querySelectorAll("path");

    iller.forEach(function(il){

        il.addEventListener("click", async function(){

            iller.forEach(i=>i.classList.remove("selected")); 
            this.classList.add("selected");

            let ilAdi = this.id;

            document.getElementById("loading").classList.add("active");
            document.getElementById("bilgi").innerHTML="";

            try {
                const response = await fetch("/il-bilgi", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ il: ilAdi })
                });

                const data = await response.json();

                let bilgiDiv = document.getElementById("bilgi");
                bilgiDiv.innerHTML = data.cevap;
                

            } catch (error) {
                bilgiDiv.innerHTML = "Hata oluştu!";
            }

            document.getElementById("loading").classList.remove("active");
        });
    });
});


/* =========================
   ZOOM + PAN SİSTEMİ
========================= */

let stepIndex = 0;

let zoomLevels = [
1000000,900000,800000,700000,600000,
500000,400000,300000,200000,100000
];

let translateX = 0;
let translateY = 0;

const harita = document.getElementById("harita");
const mapContainer = document.getElementById("mapContainer");


/* =========================
   TRANSFORM + SINIR
========================= */

function applyTransform(){

    let base = 1000000;
    let scale = base / zoomLevels[stepIndex];

    const rect = mapContainer.getBoundingClientRect();

    const mapWidth = 900 * scale;
    const mapHeight = 600 * scale;

    const containerWidth = rect.width;
    const containerHeight = rect.height;

    let minX = containerWidth - mapWidth;
    let minY = containerHeight - mapHeight;

    let maxX = 0;
    let maxY = 0;

    translateX = Math.max(minX, Math.min(maxX, translateX));
    translateY = Math.max(minY, Math.min(maxY, translateY));

    harita.style.transform =
    `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    updateScale(scale);
}


/* =========================
   BUTON ZOOM (MERKEZ ODAKLI)
========================= */

function zoomIn(){

    if(stepIndex >= zoomLevels.length - 1) return;

    const rect = mapContainer.getBoundingClientRect();

    let centerX = rect.width / 2;
    let centerY = rect.height / 2;

    let oldScale = 1000000 / zoomLevels[stepIndex];

    let worldX = (centerX - translateX) / oldScale;
    let worldY = (centerY - translateY) / oldScale;

    stepIndex++;

    let newScale = 1000000 / zoomLevels[stepIndex];

    translateX = centerX - worldX * newScale;
    translateY = centerY - worldY * newScale;

    applyTransform();
}


function zoomOut(){

    if(stepIndex <= 0) return;

    const rect = mapContainer.getBoundingClientRect();

    let centerX = rect.width / 2;
    let centerY = rect.height / 2;

    let oldScale = 1000000 / zoomLevels[stepIndex];

    let worldX = (centerX - translateX) / oldScale;
    let worldY = (centerY - translateY) / oldScale;

    stepIndex--;

    let newScale = 1000000 / zoomLevels[stepIndex];

    translateX = centerX - worldX * newScale;
    translateY = centerY - worldY * newScale;

    applyTransform();
}


/* =========================
   SCROLL ZOOM (MOUSE ODAKLI)
========================= */

mapContainer.addEventListener("wheel", (e) => {

    e.preventDefault();

    const rect = mapContainer.getBoundingClientRect();

    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    let oldScale = 1000000 / zoomLevels[stepIndex];

    let worldX = (mouseX - translateX) / oldScale;
    let worldY = (mouseY - translateY) / oldScale;

    if(e.deltaY < 0){
        if(stepIndex < zoomLevels.length - 1){
            stepIndex++;
        }
    } else {
        if(stepIndex > 0){
            stepIndex--;
        }
    }

    let newScale = 1000000 / zoomLevels[stepIndex];

    translateX = mouseX - worldX * newScale;
    translateY = mouseY - worldY * newScale;

    applyTransform();
});


/* =========================
   DRAG 
========================= */

harita.style.cursor = "grab";

harita.addEventListener("mousedown", e => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = Date.now();

    velocityX = 0;
    velocityY = 0;

    harita.style.cursor = "grabbing";
});
document.addEventListener("mousemove", e => {
    if(!isDragging) return;

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    const now = Date.now();
    const dt = now - lastTime;

    velocityX = (e.clientX - lastX) / dt;
    velocityY = (e.clientY - lastY) / dt;

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;

    applyTransform();
});
document.addEventListener("mouseup", () => {
    if(!isDragging) return;
    isDragging = false;
    harita.style.cursor = "grab";

    startInertia();
});

/* =========================
   INERTIA
========================= */
function startInertia(){
    let friction = 0.95;
    let minVelocity = 0.01;

    function animate(){
        velocityX *= friction;
        velocityY *= friction;

        if(Math.abs(velocityX) < minVelocity) velocityX = 0;
        if(Math.abs(velocityY) < minVelocity) velocityY = 0;

        translateX += velocityX;
        translateY += velocityY;

        applyBounds(); // 🔥 yeni sistem

        applyTransform();

        if(Math.abs(velocityX) > 0 || Math.abs(velocityY) > 0){
            requestAnimationFrame(animate);
        }
    }

    function applyBounds(){

        const mapWidth = 3000;   // haritanın gerçek genişliği
        const mapHeight = 2000;
    
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
    
        // 🔥 SCALE EKLENDİ
        let scaledWidth = mapWidth * scale;
        let scaledHeight = mapHeight * scale;
    
        let minX = containerWidth - scaledWidth;
        let maxX = 0;
    
        let minY = containerHeight - scaledHeight;
        let maxY = 0;
    
        // X
        if(translateX < minX){
            translateX = minX;
            velocityX *= 0.3;
        }
        if(translateX > maxX){
            translateX = maxX;
            velocityX *= 0.3;
        }
    
        // Y
        if(translateY < minY){
            translateY = minY;
            velocityY *= 0.3;
        }
        if(translateY > maxY){
            translateY = maxY;
            velocityY *= 0.3;
        }
    }
    requestAnimationFrame(animate);
}

  
/* =========================
   SCALE
========================= */

function updateScale(scale){

    let base = 1000000;

    let currentScale = Math.round(base / scale);

    document.getElementById("scale").innerText =
    "1 / " + currentScale.toLocaleString("tr-TR");
}