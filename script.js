const todayKey = new Date().toISOString().slice(0, 10);
const mealStorageKey = `meals-${todayKey}`;

let meals = JSON.parse(localStorage.getItem(mealStorageKey)) || [];
let targets = JSON.parse(localStorage.getItem("targets")) || {
  calories: 2100,
  protein: 130
};

const localFoodEstimates = [
  { keywords: ["chicken rice", "steamed chicken rice"], name: "Chicken rice", calories: 650, protein: 32, carbs: 75, fat: 22, source: "Local estimate" },
  { keywords: ["fried chicken rice"], name: "Fried chicken rice", calories: 800, protein: 35, carbs: 80, fat: 35, source: "Local estimate" },
  { keywords: ["extra chicken rice", "chicken rice extra chicken"], name: "Chicken rice with extra chicken", calories: 850, protein: 55, carbs: 80, fat: 30, source: "Local estimate" },
  { keywords: ["kaya toast"], name: "Kaya toast, 2 slices", calories: 420, protein: 8, carbs: 52, fat: 20, source: "Local estimate" },
  { keywords: ["kaya toast set"], name: "Kaya toast set with 2 eggs", calories: 560, protein: 22, carbs: 55, fat: 28, source: "Local estimate" },
  { keywords: ["soft boiled eggs", "4 eggs", "four eggs"], name: "4 soft boiled eggs", calories: 288, protein: 24, carbs: 2, fat: 20, source: "Local estimate" },
  { keywords: ["kopi o"], name: "Kopi O", calories: 60, protein: 0, carbs: 15, fat: 0, source: "Local estimate" },
  { keywords: ["kopi", "coffee milk"], name: "Kopi with milk/sugar", calories: 150, protein: 4, carbs: 24, fat: 4, source: "Local estimate" },
  { keywords: ["teh", "milk tea"], name: "Teh with milk/sugar", calories: 160, protein: 4, carbs: 26, fat: 4, source: "Local estimate" },
  { keywords: ["nasi lemak"], name: "Nasi lemak", calories: 700, protein: 24, carbs: 85, fat: 30, source: "Local estimate" },
  { keywords: ["roti prata", "prata"], name: "Roti prata, 1 piece with curry", calories: 300, protein: 7, carbs: 38, fat: 13, source: "Local estimate" },
  { keywords: ["fried chicken wing"], name: "Fried chicken wing", calories: 180, protein: 12, carbs: 5, fat: 13, source: "Local estimate" },
  { keywords: ["fried chicken drumstick"], name: "Fried chicken drumstick", calories: 250, protein: 20, carbs: 8, fat: 16, source: "Local estimate" },
  { keywords: ["fried chicken thigh"], name: "Fried chicken thigh", calories: 330, protein: 24, carbs: 10, fat: 23, source: "Local estimate" }
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("targetCalories").value = targets.calories;
  document.getElementById("targetProtein").value = targets.protein;
  render();
});

function saveTargets() {
  targets.calories = Number(document.getElementById("targetCalories").value) || 2100;
  targets.protein = Number(document.getElementById("targetProtein").value) || 130;
  localStorage.setItem("targets", JSON.stringify(targets));
  render();
}

async function searchFood() {
  const query = document.getElementById("searchFood").value.trim();
  const status = document.getElementById("searchStatus");
  const resultsBox = document.getElementById("searchResults");

  resultsBox.innerHTML = "";
  if (!query) {
    status.textContent = "Enter a food name first.";
    return;
  }

  status.textContent = "Searching food database and local estimates...";
  const results = [];

  const queryLower = query.toLowerCase();
  localFoodEstimates.forEach(item => {
    if (item.keywords.some(keyword => queryLower.includes(keyword))) {
      results.push(item);
    }
  });

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,quantity`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.products && data.products.length) {
      data.products.forEach(product => {
        const n = product.nutriments || {};
        const calories = n["energy-kcal_100g"];
        const protein = n["proteins_100g"];
        const carbs = n["carbohydrates_100g"];
        const fat = n["fat_100g"];

        if (calories !== undefined) {
          results.push({
            name: product.product_name || query,
            brand: product.brands || "",
            quantity: product.quantity || "per 100g",
            calories: Math.round(Number(calories)),
            protein: round1(Number(protein || 0)),
            carbs: round1(Number(carbs || 0)),
            fat: round1(Number(fat || 0)),
            source: "Open Food Facts, per 100g"
          });
        }
      });
    }
  } catch (error) {
    console.error(error);
  }

  if (results.length === 0) {
    status.textContent = "No estimate found. Enter calories manually or try another food name.";
    return;
  }

  status.textContent = `Found ${results.length} estimate(s). Tap Log to add one.`;
  renderSearchResults(results.slice(0, 8));
}

function renderSearchResults(results) {
  const resultsBox = document.getElementById("searchResults");
  resultsBox.innerHTML = "";

  results.forEach(item => {
    const div = document.createElement("div");
    div.className = "search-result";
    div.innerHTML = `
      <strong>${escapeHtml(item.name)}</strong>
      <div class="meta">
        ${item.brand ? escapeHtml(item.brand) + " · " : ""}
        ${item.quantity ? escapeHtml(item.quantity) + " · " : ""}
        ${item.source}
      </div>
      <div class="meta">
        ${item.calories} kcal · P ${item.protein}g · C ${item.carbs}g · F ${item.fat}g
      </div>
      <button onclick='logSearchResult(${JSON.stringify(item)})'>Log</button>
      <button onclick='fillManualForm(${JSON.stringify(item)})'>Edit first</button>
    `;
    resultsBox.appendChild(div);
  });
}

function logSearchResult(item) {
  meals.push({
    id: Date.now(),
    name: item.name,
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  saveMeals();
  render();
}

function fillManualForm(item) {
  document.getElementById("foodName").value = item.name;
  document.getElementById("foodCalories").value = item.calories;
  document.getElementById("foodProtein").value = item.protein;
  document.getElementById("foodCarbs").value = item.carbs;
  document.getElementById("foodFat").value = item.fat;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function addMeal() {
  const name = document.getElementById("foodName").value.trim();
  const calories = Number(document.getElementById("foodCalories").value);
  const protein = Number(document.getElementById("foodProtein").value) || 0;
  const carbs = Number(document.getElementById("foodCarbs").value) || 0;
  const fat = Number(document.getElementById("foodFat").value) || 0;

  if (!name || !calories) {
    alert("Please enter food name and calories.");
    return;
  }

  meals.push({
    id: Date.now(),
    name,
    calories,
    protein,
    carbs,
    fat,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });

  saveMeals();
  clearForm();
  render();
}

function deleteMeal(id) {
  meals = meals.filter(meal => meal.id !== id);
  saveMeals();
  render();
}

function clearToday() {
  if (confirm("Clear all meals for today?")) {
    meals = [];
    saveMeals();
    render();
  }
}

function saveMeals() {
  localStorage.setItem(mealStorageKey, JSON.stringify(meals));
}

function clearForm() {
  document.getElementById("foodName").value = "";
  document.getElementById("foodCalories").value = "";
  document.getElementById("foodProtein").value = "";
  document.getElementById("foodCarbs").value = "";
  document.getElementById("foodFat").value = "";
}

function render() {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const remaining = targets.calories - totalCalories;
  const percentage = Math.min((totalCalories / targets.calories) * 100, 100);

  document.getElementById("totalCalories").textContent = Math.round(totalCalories);
  document.getElementById("targetCaloriesDisplay").textContent = targets.calories;
  document.getElementById("remainingCalories").textContent = Math.round(remaining);
  document.getElementById("totalProtein").textContent = `${Math.round(totalProtein)}g`;
  document.getElementById("totalCarbs").textContent = `${Math.round(totalCarbs)}g`;
  document.getElementById("totalFat").textContent = `${Math.round(totalFat)}g`;
  document.getElementById("calorieBar").style.width = `${percentage}%`;

  const mealList = document.getElementById("mealList");
  mealList.innerHTML = "";

  if (meals.length === 0) {
    mealList.innerHTML = "<li>No meals logged yet.</li>";
    return;
  }

  meals.slice().reverse().forEach(meal => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div class="meal-title">${escapeHtml(meal.name)}</div>
        <div class="meal-meta">${meal.time} · ${meal.calories} kcal · P ${meal.protein}g · C ${meal.carbs}g · F ${meal.fat}g</div>
      </div>
      <button class="danger" onclick="deleteMeal(${meal.id})">Delete</button>
    `;
    mealList.appendChild(li);
  });
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
