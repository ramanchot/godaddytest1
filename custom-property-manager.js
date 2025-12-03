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
 // const res = await fetch("/api/getProperties");
  const props = await res.json();
  /*[
    {
        "_id": "692033a92f3bb2bcbfa56122",
        "name": "A94"
    },
    {
        "_id": "692034032f3bb2bcbfa56123",
        "name": "Mirzapur"
    },
    {
        "_id": "692fe81ac0bd468df852ec4e",
        "name": "ABC"
    }
]*/
  

 let html = ``;
  props.forEach(
    (p) => (html += `<li type='text' value='${p._id}'>${p.name}</li>`)
  );

  document.getElementById("propertiesList").innerHTML = html;
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