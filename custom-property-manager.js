window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    showLoader();
    const periodPicker = document.getElementById('periodPicker');

    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth() + 1; // Months are 0-based
    // Ensure 2-digit month (e.g., 03 instead of 3)
    month = month < 10 ? '0' + month : month;
    periodPicker.value = `${year}-${month}`;
});

let clickCount = 0;
document.querySelector('#headingMain').addEventListener('click', (e) => {
    clickCount++;
    if (clickCount === 3) {
        let toggle = document.querySelector('.adminControlContainer');
        toggle.style.display = toggle.style.display === 'none' ? 'flex' : 'none';
        clickCount = 0;
    }

})

async function checkAuth() {
    try {
        const res = await fetch("/api/checkAuth");

        if (!res.ok) {
            window.location.href = "/login.html";
        }
    } catch (err) {
        window.location.href = "/login.html";
    }
    loadPropertiesForAddTenant();
}


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
        let isElecMonth = false;
        let totalRentReceived = 0;
        let totalElectricityBills = 0;
        const [year, month] = value.split("-");
        const propertyId = document.getElementById("propertySelectForTenant1").value;

        const res = await fetch(`/api/main?action=GET_RENT_RECORDS_LIST&month=${month}&year=${year}&propertyId=${propertyId}`);
        const props = await res.json();
        isElecMonth = props.some(p => p.isElectricityMonth);
        document.getElementById("isElectricityMonth").style.display = isElecMonth ? "none" : "block";

        let html = ``;

        html += `
                <tr>
                    <th>S.No.</th>
                    <th>Tenant Name</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Rent Amount</th>
                    ${isElecMonth ? "<th>Electricity Amount</th>" : ""}
                </tr>
                `;
        if (props.length === 0) {
            html = `<tr><td align="center" colspan="6">
                No records found.
                <a href="#" onclick="initialiseRecords()">Click Here to Initialise</a>
            </td></tr>`;
        } else {
            props.forEach(
                (p, index) => {

                    totalRentReceived += p.rentAmount;
                    totalElectricityBills += p.electricityBill;
                    html += `<tr style="${index % 2 === 0 ? 'background-color: #f2f2f2;' : 'background-color: #ffffff;'}">
                    <td>${index + 1}</td>
                    <td>${p.tenantName}</td>
                    <td>${p.month}</td>
                    <td>${p.year}</td>
                    <td><input data-type="rent" type="number" onblur="updateRentRecord('${p._id}', this)" style="background-color: ${p.rentAmount > 0 ? 'green' : 'red'}; box-sizing: border-box;" value="${p.rentAmount}" /></td>
                    ${isElecMonth ? `<td><input data-type="electricity" type="number" value="${p.electricityBill}" onblur="updateRentRecord('${p._id}', this)"
                                                    style="background-color: ${p.electricityBill > 0 ? '#d4edda' : '#f8d7da'};box-sizing: border-box;"/>
                                                    </td>` : ""}
                    </tr>`;
                });
            html += `<tr style="font-weight: bold; background-color: #f2f2f2;">
                        <td colspan="4" align="right">Total</td>
                        <td>₹${totalRentReceived.toLocaleString("en-IN")}</td>
                        ${isElecMonth ? `<td>₹${totalElectricityBills.toLocaleString("en-IN")}</td>` : ""}
                    </tr>`;
            document.getElementById("rentRecordTable").style.display = "table";
        }

        document.getElementById("rentRecordList").innerHTML = html;

    } finally {
        hideLoader(); // ✅ ALWAYS HIDE
    }
}

async function updateRentRecord(id, element) {
    const tr = element.closest("tr");
    const rentAmountRecieved = tr.querySelector('input[data-type="rent"]').value;
    const electricityInput = tr.querySelector('input[data-type="electricity"]');
    const electricityAmount = electricityInput ? electricityInput.value : undefined;
    const isrentReceived = Number(rentAmountRecieved) > 0;

    const payload ={
                id,
                rentAmountRecieved,
                rentReceived: isrentReceived
                
    };
        if(electricityAmount !== undefined){
        payload.electricityAmount = electricityAmount;
    }
    showLoader();
    await fetch("/api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "UPDATE_RENT_RECORD",
            data: payload
        }),
    });

    onMonthSelected(document.getElementById("periodPicker").value);
    showToast("Rent Record Saved successfully", "success");

}

async function initialiseRecords() {
    console.log("========Initialising records for current month... ========");
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

async function setIselectrictyMonthTrue() {
    alert((document.getElementById("periodPicker").value.split("-")[1]) + '' + (document.getElementById("periodPicker").value.split("-")[0]) + '' + document.getElementById("propertySelectForTenant1").value);
    await fetch("api/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "SET_ELECTRICITY_BILL_RECEIVED_FOR_MONTH_AS_TRUE",
            data: {
                month: Number(document.getElementById("periodPicker").value.split("-")[1]),
                year: Number(document.getElementById("periodPicker").value.split("-")[0]),
                propertyId: document.getElementById("propertySelectForTenant1").value,
                isElectricityMonth: true
            }
        }),
    })
}

function showToast(message, type = "default") {
    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.classList.add(type);
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}