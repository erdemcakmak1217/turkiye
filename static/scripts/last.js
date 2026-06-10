async function initYoutube(){
    const res = await fetch("../static/css/turkiye.svg");
    const svgText = await res.text();

    const container = document.getElementById("harita");
    container.innerHTML = svgText;
        
    const iller = container.querySelectorAll("path");
    const bilgiDiv = document.getElementById("bilgi");
    const videoContainer = document.getElementById("videoContainer");


    iller.forEach(il => {
        il.addEventListener("click", async () => {

            if(currentMode !== null){
                return;
            }
            // Seçili efekti
            document.querySelectorAll("path").forEach(p => p.classList.remove("selected"));
            il.classList.add("selected");

            const ilAdi = il.getAttribute("name");



            // Bilgi panelini temizle ve loading göster
            bilgiDiv.innerHTML = "";
            //loading.classList.add("active");

            try {
                // Backend'e POST isteği
                const res = await fetch("/il-bilgi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ il: ilAdi })
                });

                const data = await res.json();

                // İl bilgilerini göster
                bilgiDiv.innerHTML = data.cevap;

                // Videoları göster
                videoContainer.innerHTML = ""; // önceki videoları temizle

                data.videolar.slice(0,5).forEach(video => {
                    const div = document.createElement("div");
                    div.className = "videoCard";
                    div.innerHTML = `
                        <iframe 
                            src="https://www.youtube.com/embed/${video.videoId}" 
                            frameborder="0" 
                            allowfullscreen>
                        </iframe>
                    `;
                    videoContainer.appendChild(div);
                });

            } catch (error) {
                console.error(error);
                bilgiDiv.innerHTML = "Hata oluştu!";
            }

            //loading.classList.remove("active");

        });
    });

    let currentMode = null;
    let cityStates = JSON.parse(localStorage.getItem("cityStates")) || {};

    const toolButtons = document.querySelectorAll(".toolBtn");

    toolButtons.forEach(btn => {
    btn.addEventListener("click", () => {

        toolButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentMode = btn.dataset.mode;

        console.log("Mode:", currentMode);
    });
    });
        

    iller.forEach(il => {

        const ilAdi = il.getAttribute("name");

        applyCityColor(il, cityStates[ilAdi]);

        il.addEventListener("click", () => {

            if (!currentMode) return;

            cityStates[ilAdi] = currentMode;

            saveAndRender(il, ilAdi);
        });

        il.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            delete cityStates[ilAdi];

            saveAndRender(il, ilAdi);
        });

    });

        function applyCityColor(il, mode) {

        il.classList.remove("visited", "lived", "wanted");

        if (mode === "visited") il.classList.add("visited");
        if (mode === "lived") il.classList.add("lived");
        if (mode === "wanted") il.classList.add("wanted");
    }

        function saveAndRender(il, ilAdi) {

        localStorage.setItem("cityStates", JSON.stringify(cityStates));

        applyCityColor(il, cityStates[ilAdi]);

    }
}

window.addEventListener("DOMContentLoaded", initYoutube);