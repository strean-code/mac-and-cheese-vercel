fetch("/partials/menu.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("menu").innerHTML = data;
  });

function toggleMenu(){
const nav = document.getElementById("navLinks");
nav.classList.toggle("show");
}