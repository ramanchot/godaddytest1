/* Add Property */
async function addProperty() {
  const name = document.getElementById("propertyName").value.trim();
  if (!name) return alert("Enter name");

  await fetch("/api/addProperty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  alert("Property added");
  document.getElementById("propertyName").value = "";
}