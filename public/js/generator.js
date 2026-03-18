const btn = document.getElementById("generateBtn");

document.getElementById("generateBtn").addEventListener("click", async () => {

  btn.textContent = "Generating...";
  btn.disabled = true;   // ✅ disable once user clicks

  const pasta = document.getElementById("pasta").value;

  const cheeseSelect = document.getElementById("cheese");
  const selectedCheeses = Array.from(cheeseSelect.selectedOptions)
    .map(option => option.value);

  const addinsSelect = document.getElementById("addins");
  const selectedAddins = Array.from(addinsSelect.selectedOptions)
    .map(option => option.value);

  const topping = document.getElementById("topping").value;
  const heat = document.getElementById("heat").value;

  const recaptchaToken = grecaptcha.getResponse();

if (!recaptchaToken) {
  btn.textContent = "Generate My Mac";
  btn.disabled = false;   // ✅ re-enable on failure
  alert("Please complete the reCAPTCHA.");
  return;
}

  const resultDiv = document.getElementById("result");

  resultDiv.innerHTML = `
  <div class="spinner"></div>
  <p style="text-align:center;">🧀 Crafting the perfect mac and cheese recipe...</p>
`;
// show red box instead of message for testing
// <div style="width:40px;height:40px;background:red;margin:auto;"></div>
// `;
  try {
    const res = await fetch("/generate-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pasta, selectedCheeses, selectedAddins, topping, heat, recaptchaToken })
    });

 
  if (!res.ok) {
    const errData = await res.json();
    console.log(errData);
    resultDiv.innerHTML = `<p>${errData.error}</p>`;
    grecaptcha.reset();
    return;
  }

    const data = await res.json();
    //To add image, change server.js and umcomment the 2 imageSrc lines
    const imageSrc = `data:image/png;base64,${data.image}`;
    // This goes right after the end h2 tag
    //   <img src="${imageSrc}" style="max-width:400px;border-radius:10px;margin-bottom:15px;">

    resultDiv.innerHTML = `
      <h2>${data.title}</h2>
      <img src="${imageSrc}" style="max-width:400px;border-radius:10px;margin-bottom:15px;">

      <h3>Ingredients</h3>
      <ul>
        ${data.ingredients.map(i => `<li>${i}</li>`).join("")}
      </ul>

      <h3>Instructions</h3>
      <ol>
        ${data.instructions.map(step => `<li>${step}</li>`).join("")}
      </ol>

      <p><b>Prep Time:</b> ${data.prep_time}</p>
      <p><b>Cook Time:</b> ${data.cook_time}</p>
      <p><b>Creaminess:</b> ${data.creaminess_rating}/10</p>
      <p><b>Flavor Profile:</b> ${data.flavor_profile}</p>
    `;

    btn.textContent = "Generate My Mac";
    btn.disabled = false;

    grecaptcha.reset();

} catch (err) {
  console.error("Generator error:", err);
  resultDiv.innerHTML = `<p>Error generating recipe.</p><pre>${err}</pre>`;
  btn.textContent = "Generate My Mac";
  btn.disabled = false;   // ✅ re-enable on failure
}

});