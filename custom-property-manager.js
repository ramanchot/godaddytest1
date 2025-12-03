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
/* Load Properties into dropdown */
async function loadProperties() {
  const res = await fetch("/api/getProperties");
  const props = await res.json();

  //let html = `<option value=''>Select</option>`;
  props.forEach(
    //(p) => (html += `<input type='text' value='${p._id}'>${p.name}</input>`)
    alert(`ID: ${p._id} Name: ${p.name}`)
  );

 // document.getElementById("propertyDropdown").innerHTML = html;
}

/* Load Properties into dropdown */
async function loadProperties1() {
  const res = await fetch("/api/getProperties");
  const props = await res.json();

  let html = `<option value=''>Select</option>`;
  props.forEach(
    (p) => (html += `<option value='${p._id}'>${p.name}</option>`)
  );

  document.getElementById("propertyDropdown").innerHTML = html;
}