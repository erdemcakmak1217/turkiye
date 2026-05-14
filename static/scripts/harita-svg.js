fetch("../static/css/turkiye.svg")
.then(res => res.text())
.then(svg => {
    document.getElementById("harita").innerHTML = svg;
});