window.onload = function() {
    createFlooDetailstable();
}
const flats =['1f','1b','2f','2b','3f','3b'];
function createFlooDetailstable() {
   // alert("Creating Floor Details Table");
    const tbody = document.getElementById('flooDetailsTableBody');

    flats.forEach(flat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" id="${flat}" value="${flat.toUpperCase()}" readonly style="background-color: #f0f0f0;"></td>
            <td><input id ="${flat}_rs" name="Reading Start" type ="number"  oninput="calculateNetUnits(this)"></td>
            <td><input id ="${flat}_re" name="Reading End" type ="number" oninput="calculateNetUnits(this)"></td>
            <td><input id ="${flat}_nuc" name="Net Unit Consumption" type ="number" readonly style="background-color: #f0f0f0;"></td>
            <td><input id ="${flat}_caa" name="Common Area Amount" type ="number" oninput="calculateTotalBill(this)"></td>
            <td><input id ="${flat}_tb" name="Total Bill" type ="number" readonly style="background-color: #f0f0f0;"    ></td>
        `;
        tbody.appendChild(row);
    });
}

const scriptURL = 'https://script.google.com/macros/s/AKfycbzTXzxR7sbvrAQEdBOATQsWymlVEHzp0pzuV6h1oMlVFQ-MYRa138iqM-rrkcC1k1rXMA/exec'
            const form = document.forms['detailsForm']
          
            form.addEventListener('submit', e => {
              e.preventDefault()
              fetch(scriptURL, { method: 'POST', body: new FormData(form)})
                .then(response => alert("Details Saved."))
                .catch(error => console.error('Error!', error.message))
            })

function calculateNetUnits(input) {

    const flatId = input.id.split('_')[0];
    const start = document.getElementById(`${flatId}_rs`).valueAsNumber || 0;
    const end = document.getElementById(`${flatId}_re`).valueAsNumber || 0;
    const diff = end - start;
    document.getElementById(`${flatId}_nuc`).valueAsNumber = diff >= 0 ? diff : 0;

    calculateTotalBill(input);
}

function calculateTotalBill(input){
    const flatId = input.id.split('_')[0];
    document.getElementById(`${flatId}_tb`).valueAsNumber = ((document.getElementById(`${flatId}_nuc`).valueAsNumber*document.getElementById('mm_r').valueAsNumber)+document.getElementById(`${flatId}_caa`).valueAsNumber).toFixed(2);
}

function calculateMMNetUnits(){ 
    const diff = (document.getElementById('mm_re').valueAsNumber || 0)-(document.getElementById('mm_rs').valueAsNumber || 0 );
    document.getElementById('mm_nuc').valueAsNumber = diff >= 0 ? diff : 0;
    calculateMMTotalBill();
}

function calculateMMTotalBill(){
    document.getElementById('mm_tb').valueAsNumber = (document.getElementById('mm_nuc').valueAsNumber*document.getElementById('mm_r').valueAsNumber);
}

function loadData() {
  const flatNo = document.querySelector('input[name="Flat No"]').value;
  const urlWithParam = `${scriptURL}?flat=${encodeURIComponent(flatNo)}`;

  fetch(urlWithParam)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Flat not found.");
        return;
      }

      document.getElementById('1f_rs').value = data['Reading Start'] || '';
      document.getElementById('1f_re').value = data['Reading End'] || '';
      document.getElementById('1f_nuc').value = data['Net Unit Consumption'] || '';
      document.getElementById('1f_caa').value = data['Common Area Amount'] || '';
      document.getElementById('1f_tb').value = data['Total Bill'] || '';
    })
    .catch(err => {
      alert("Error loading data: " + err);
    });
}
