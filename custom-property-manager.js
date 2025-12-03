/* Add Property */
async function addProperty() {
  const name = document.getElementById("propertyName").value.trim();
  if (!name) return alert("Enter name");

  await fetch("/api/addProperty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  loadProperties();
  document.getElementById("propertyName").value = "";
}