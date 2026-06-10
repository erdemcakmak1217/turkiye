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