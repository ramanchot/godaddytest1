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
    console.log("Adding property...");
    const name = document.getElementById("propertyName").value.trim();
    console.log(name);
    if (!name) return alert("Enter Property name");

    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  action: "ADD_PROPERTY",
            data : {name}
        }),
    });

    alert("Property added");
    document.getElementById("propertyName").value = "";
}

/* Add Tenant */
async function addTenant() {
    console.log("Adding Tenant...");
    const name = document.getElementById("tenantName").value;
    const selectedProperty = document.getElementById("propertySelectForTenant").value;
    if (!name) return alert("Enter Tenant name");
    if (!selectedProperty) return alert("Select a property");

    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({action: "ADD_TENANT",
            data : {
                name, 
                propertyId: selectedProperty
            }   
        }),
    });
    alert("Tenant added");
    document.getElementById("tenantName").value = "";
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

async function onMonthSelected(value){
    if (!value) return;

        const [year, month] = value.split("-");
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
                <td><button onclick="updateRentRecord('${p._id}', this)">Update</button></td>
                </tr>`)
        );

        document.getElementById("rentRecordList").innerHTML = html;    
}

async function  updateRentRecord(id, element){
    const tr = element.parentElement.parentElement;
    const rentAmountRecieved = tr.querySelector("input").value;
    alert(id);
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "UPDATE_RENT_RECORD",
            data: {
                id,
                rentAmountRecieved 
            }
        }),
    });
}