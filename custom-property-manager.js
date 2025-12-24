loadPropertiesForAddTenant();

/* Populate property into select box */
async function loadPropertiesForAddTenant() {
    const res = await fetch("/api/getProperties");
    const props = await res.json();
    let html = `<option value=''>Select</option>`;
    props.forEach(
        (p) => (html += `<option value='${p._id}'>${p.name}</option>`)
    );
    document.getElementById("propertySelectForTenant").innerHTML = html;
}

/* Add Property */
async function addProperty() {
    const name = document.getElementById("propertyName").value.trim();
    if (!name) return alert("Enter Property name");

    await fetch("/api/addProperty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });

    alert("Property added");
    document.getElementById("propertyName").value = "";
}

/* Load Properties */
async function loadProperties() {
    const res = await fetch("/api/getProperties");
    const props = await res.json();
    let html = ``;
    props.forEach(
        (p) => (html += `<li type='text' value='${p._id}'>${p.name}</li>`)
    );

    document.getElementById("propertiesList").innerHTML = html;
}

/* Add Tenant */
async function addTenant() {
    const name = document.getElementById("tenantName").value;
    const selectedProperty = document.getElementById("propertySelectForTenant").value;
    if (!name) return alert("Enter Tenant name");
    if (!selectedProperty) return alert("Select a property");

    await fetch("/api/addTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            propertyId: selectedProperty,
            name
        }),
    });
    alert("Tenant added");
    document.getElementById("tenantName").value = "";
}

async function onMonthSelected(value){
    if (!value) return;

        const [year, month] = value.split("-");

        alert("Year: " + year + "\nMonth: " + month);
        const res = await fetch(`/api/getRentRecordList?month=${month}&year=${year}`);
        const props = await res.json();
        let html = ``;
        props.forEach(
            (p) => (html += `<tr>
                <td>${p.tenantName}</td>
                <td>${p.month}</td>
                <td>${p.year}</td>
                <td><input type="number" value="${p.rentAmount}" /></td>
                <td>${p.rentReceived}</td>
                <td><a onclick="updateRentRecord('${p._id}', this)">Update</a></td>
                </tr>`)
        );

        document.getElementById("rentRecordList").innerHTML = html;    
}

async function  updateRentRecord(id, element){
    const tr = element.parentElement.parentElement;
    const rentAmountRecieved = tr.querySelector("input").value;
    await fetch("/api/updateRentRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id,
            rentAmountRecieved
        }),
    });
}