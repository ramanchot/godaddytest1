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
    document.getElementById("propertySelectForTenant1").innerHTML = html;
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
        const propertyId = document.getElementById("propertySelectForTenant1").value;
        const res = await fetch(`/api/main?action=GET_RENT_RECORDS_LIST&month=${month}&year=${year}&propertyId=${propertyId}`);
        const props = await res.json();
        let html = ``;
        if(props.length === 0){
            html = `<tr><td align="center" colspan="6">No records found for selected month and year.<a href="#" onclick="initialiseRecords()">Click Here to Initialise Records for Current Month</a></td></tr>`;
        }else{
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
        }
        

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

async function initialiseRecords(){
    console.log("========Initialising records for current month...=======");
    const [year, month] = document.getElementById("periodPicker").value.split("-");

    const tenants = await fetch("/api/main?action=GET_TENANTS_LIST&propertyId="+document.getElementById("propertySelectForTenant1").value).then(res => res.json());
    if(tenants.length === 0){
        return alert("No tenants found to initialise records");
    }
     alert("tenant length"+tenants.length);
     const recordsToInsert =[];
    for(const tenant of tenants){
        tenant.propertyId = document.getElementById("propertySelectForTenant1").value;
        tenant.name = tenant.name;
        tenant.rentAmount = 0;
        recordsToInsert.push({
            tenantId: tenant._id.toString(),
            tenantName: tenant.name,
            propertyId: tenant.propertyId,
            month: Number(month),
            year: Number(year),
            rentAmount: 0,
            rentReceived: false,
            electricityBill: 0,
            electricityPaid: false
        });
    }
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "INIT_RENT_RECORDS",
            data: {
                records: recordsToInsert
            }
        }),
    });
}