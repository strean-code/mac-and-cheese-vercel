fetch("/partials/menu.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("menu").innerHTML = data;
  });

function toggleMenu() {

const nav = document.getElementById("navLinks");

if(nav.style.display === "flex"){
nav.style.display = "none";
}else{
nav.style.display = "flex";
}

}