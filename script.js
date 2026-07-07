const todayKey = new Date().toISOString().slice(0, 10);
const mealStorageKey = `meals-${todayKey}`;

let meals = JSON.parse(localStorage.getItem(mealStorageKey)) || [];
let targets = JSON.parse(localStorage.getItem("targets")) || {
  calories: 2100,
  protein: 130
};

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

function quickAdd(name, calories, protein, carbs, fat) {
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
        <div class="meal-title">${meal.name}</div>
        <div class="meal-meta">${meal.time} · ${meal.calories} kcal · P ${meal.protein}g · C ${meal.carbs}g · F ${meal.fat}g</div>
      </div>
      <button class="danger" onclick="deleteMeal(${meal.id})">Delete</button>
    `;
    mealList.appendChild(li);
  });
}
