window.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');

    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth() + 1; // Months are 0-based
    // Ensure 2-digit month (e.g., 03 instead of 3)
    month = month < 10 ? '0' + month : month;
    periodPicker.value = `${year}-${month}`;
});

loadPropertiesForAddTenant();

function togglePropertiesContainer() {
    const container = document.querySelector('.propertiesContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

function toggleTenantsContainer() {
    const container = document.querySelector('.tenantsContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}


/* Populate property into select box */
async function loadPropertiesForAddTenant() {
    const res = await fetch("/api/getProperties");
    const props = await res.json();
    let html = `<option value=''>Select</option>`;
    props.forEach(
        (p) => (html += `<option value='${p._id}'>${p.name}</option>`)
    );
    document.getElementById("propertySelectForTenant").innerHTML = html;
    const getdataselect = document.getElementById("propertySelectForTenant1");
    getdataselect.innerHTML = html

    if (getdataselect.options.length > 1) {
        getdataselect.selectedIndex = 1;
    }
    const rentRecordsContainer = document.querySelector('.rentRecordsContainer');
    rentRecordsContainer.style.display = 'block';
    onMonthSelected(document.getElementById("periodPicker").value);
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
        body: JSON.stringify({
            action: "ADD_PROPERTY",
            data: { name }
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
        body: JSON.stringify({
            action: "ADD_TENANT",
            data: {
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
    document.getElementById('propertiesList').style.display = 'table';
    const res = await fetch("/api/getProperties");
    const props = await res.json();
    let html = ``;
    props.forEach((p, index) => {
    html += `<tr style="${index % 2 === 0 ? 'background-color: #f2f2f2;' : 'background-color: #ffffff;'}">
                <td>${p.name}</td>
                <td align="center">
                    <button onclick="deleteProperty('${p._id}')">Delete Property</button>
                </td>
            </tr>`;
    });

    document.getElementById("propertiesListBody").innerHTML = html;
}

async function deleteProperty(propertyId) {
    if (!confirm("Are you sure you want to delete this property? This will also delete all tenants and rent records associated with this property.")) {
        return;
    }
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "DELETE_PROPERTY",
            data: { propertyId }
        }),
    });
    alert("Property deleted");
    loadProperties();
}

/* Load Tenants */
async function loadTenants() {
    html = '';
    const tenants = await fetch("/api/main?action=GET_ALL_TENANTS_LIST&propertyId=" + document.getElementById("propertySelectForTenant").value, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const tenantsList = await tenants.json();

    if (tenantsList.length === 0) {
        document.getElementById("tenantsListBody").innerHTML = `<tr><td align="center" colspan="3">No tenants found for selected property</td></tr>`;
        return;
    } else {
        tenantsList.forEach(
            (t) => (html += `<tr><td type='text' value='${t._id}'>${t.name}</td>
                                <td align="center"><button onclick="markTenantInactive('${t._id}')">Mark Inactive</button></td>
                                <td><label style="color: ${t.isActive ? 'green' : 'red'}" value='${t.isActive}'>${t.isActive ? 'Active' : 'Inactive'}</label></td>
                                </tr>`)
        );
        document.getElementById("tenantsListBody").innerHTML = html;
    }
}

async function markTenantInactive(tenantId) {
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "MARK_TENANT_INACTIVE",
            data: {
                tenantId
            }
        }),
    });
    alert("Tenant marked inactive");
    loadTenants();
}

async function onMonthSelected(value) {
    if (!value) return;

    showLoader(); // ✅ START

    try {
        let totalRentReceived = 0;
        const [year, month] = value.split("-");
        const propertyId = document.getElementById("propertySelectForTenant1").value;

        const res = await fetch(`/api/main?action=GET_RENT_RECORDS_LIST&month=${month}&year=${year}&propertyId=${propertyId}`);
        const props = await res.json();

        let html = ``;

        if (props.length === 0) {
            html = `<tr><td align="center" colspan="6">
                No records found.
                <a href="#" onclick="initialiseRecords()">Click Here to Initialise</a>
            </td></tr>`;
        } else {
            props.forEach(
                (p,index) => {
                    
                        totalRentReceived += p.rentAmount;
                    
                html += `<tr style="${index % 2 === 0 ? 'background-color: #f2f2f2;' : 'background-color: #ffffff;'}">
                    <td>${index+1}</td>
                    <td>${p.tenantName}</td>
                    <td>${p.month}</td>
                    <td>${p.year}</td>
                    <td><input type="number" onblur="updateRentRecord('${p._id}', this)" style="background-color: ${p.rentAmount > 0 ? 'green' : 'red'}; box-sizing: border-box;" value="${p.rentAmount}" /></td>
                </tr>`;
        });
            html += `<tr style="font-weight: bold; background-color: #f2f2f2;">
                        <td colspan="3" align="right">Total</td>
                        <td>₹${totalRentReceived.toLocaleString("en-IN")}</td>
                    </tr>`;
            document.getElementById("rentRecordTable").style.display = "table";
        }

        document.getElementById("rentRecordList").innerHTML = html;

    } finally {
        hideLoader(); // ✅ ALWAYS HIDE
    }
}

async function updateRentRecord(id, element) {
    const tr = element.parentElement.parentElement;
    const rentAmountRecieved = tr.querySelector("input").value;
    const isrentReceived = Number(rentAmountRecieved) > 0;
    showLoader();
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "UPDATE_RENT_RECORD",
            data: {
                id,
                rentAmountRecieved,
                rentReceived: isrentReceived
            }
        }),
    });
    
    onMonthSelected(document.getElementById("periodPicker").value);
    alert("Rent record updated");
}

async function initialiseRecords() {
    console.log("========Initialising records for current month...=======");
    const [year, month] = document.getElementById("periodPicker").value.split("-");

    const tenants = await fetch("/api/main?action=GET_ACTIVE_TENANTS_LIST&propertyId=" + document.getElementById("propertySelectForTenant1").value).then(res => res.json());
    if (tenants.length === 0) {
        return alert("No tenants found to initialise records");
    }

    const recordsToInsert = [];
    for (const tenant of tenants) {
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
function showLoader() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoader() {
    document.getElementById("loadingOverlay").style.display = "none";
}