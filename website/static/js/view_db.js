const editForm = document.getElementById('edit-form');
const addForm = document.getElementById('add-form')
const menu = document.getElementById('menu');
const addButton = document.getElementById('add-button')

document.addEventListener('DOMContentLoaded', () => {
    fetch("./get_tables").then(response =>{
        if (response.ok) {
            return response.json();
        }else{
            return response.text().then(error => {
                throw new Error(`Error fetching data: ${error}`);
            })
        }
    }).then(tables => {
        tables = [...tables, "Python Script"];
        tables.forEach((table, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            if (table !== "Python Script") {
                table = table.split(/[^a-zA-Z0-9]/).map(word => capitalize(word)).join('');
            }
            a.textContent = table;
            a.onclick = () => {
                switchTable(table)
                for (let i = 0; i < menu.children.length; i++) {
                    const child = menu.children[i];
                    child.style.backgroundColor = 'transparent';
                }           
                li.style.backgroundColor = '#385576';
            };
            if (index === 0) {
                switchTable(table);
                li.style.backgroundColor = '#385576';
            }
            li.appendChild(a);
            menu.appendChild(li);
        });  
    })
});

function switchTable(tableName) {
    displayTable(tableName);
    document.getElementById('table-title').innerText = `Viewing ${tableName}`;
    editForm.classList.add('hidden');
    addForm.classList.add('hidden');
}


function capitalize(input){
    const str = String(input);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


function displayTable(tableName) { 
    fetch(`./table/${encodeURIComponent(tableName)}`)
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.text().then(error => {
                alert(`Error fetching data: ${error}`);
                throw new Error(`Error fetching data: ${error}`);
            });
        }
    }).then(data => {
        const currentTable = data;
        const tableContainer = document.getElementById('data-table');
        tableContainer.innerHTML = '';  // Clear existing table content

        const columns = [...currentTable.columns, 'Actions'];
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = capitalize(column);
            headerRow.appendChild(th);
        });
        tableContainer.appendChild(headerRow);
        const type_datas = currentTable.type_data;
        currentTable.rows.forEach(row => {
            const rowElement = document.createElement('tr');
            let editElement = document.createElement('form');
            columns.forEach(column =>{            
                const td = document.createElement('td');
                const input = document.createElement('input');
                const name = document.createElement('span');
                let value = row[column];
                if (value === undefined){
                    return;
                } else if (Object.prototype.toString.call(value) === "[object Object]"){
                    value = JSON.stringify(value)
                }
                if (column === 'id') {
                    input.readOnly = true;
                }
                const type_data = type_datas[column][0];
                const default_value = type_datas[column][2];
                name.textContent = `${column} - ${type_data} ${ default_value !== null ? `| default: ${JSON.stringify(default_value)}` : ':' }`;
                name.style.fontWeight = 'bold';
                input.type = 'text';
                input.value = value;
                input.name = column;
                input.placeholder = column;
                if (type_datas[column][1] === false && !default_value && column !== 'id') {
                    input.required = true;
                    
                }
                if (value && value.length > 10) {
                    value = value.substring(0, 10) + '...';
                }
                td.textContent = value;
                rowElement.appendChild(td);
                editElement.appendChild(name);
                editElement.appendChild(document.createElement('br'));
                editElement.appendChild(input);
            });

            // Actions: Edit and Delete
            const actionsTd = document.createElement('td');
            actionsTd.style.display = 'flex';
            actionsTd.style.flexDirection = 'column';
            actionsTd.style.gap = '5px';
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => {
                addForm.classList.add('hidden');
                editForm.innerHTML = '<h3>Edit Row</h3><br />';
                editForm.appendChild(editElement);
                const buttons = document.createElement('div');
                buttons.style.display = 'flex';
                buttons.style.gap = '10px';
                const saveButton = document.createElement('button');
                saveButton.type = 'submit';
                saveButton.textContent = 'Save';
                saveButton.onclick = () => {
                    const formData = new FormData(editElement);
                    const data = {}
                    formData.forEach((value, key) => {
                        try{
                            value = JSON.parse(value);
                        }catch{
                            value = value;
                        }
                        data[key] = value;
                    });
                    fetch(`/view_db/update_row/${encodeURIComponent(tableName)}/${encodeURIComponent(row.id)}`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data)
                    }).then(response => {
                        if (response.ok) {
                            displayTable(tableName);
                            editForm.classList.add('hidden');
                            alert("Your change is sucessfully applied")
                        } else {
                            response.text().then(error => {
                                alert(`Error updating row: ${error}`);
                                throw new Error(`Error updating row: ${error}`);
                            });
                        }
                    })
                };
                buttons.appendChild(saveButton);
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.textContent = 'Cancel';
                cancelButton.onclick = () => {
                    editForm.classList.add('hidden');
                };
                cancelButton.style.backgroundColor = 'red';
                buttons.appendChild(cancelButton);
                editForm.appendChild(buttons);
                editForm.classList.remove('hidden');
            };
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this row?')){
                    fetch(`/view_db/delete_row/${encodeURIComponent(tableName)}/${encodeURIComponent(row.id)}`).then(response => {
                        if (response.ok) {
                            displayTable(tableName);
                            alert("You have been deleted a row")
                        } else {
                            response.text().then(error => {
                                alert(`Error deleting row: ${error}`);
                                throw new Error(`Error deleting row: ${error}`);
                            });
                        }
                    })
                }
                editForm.classList.add('hidden');
            };
            actionsTd.appendChild(editButton);
            actionsTd.appendChild(deleteButton);
            rowElement.appendChild(actionsTd);
            tableContainer.appendChild(rowElement);
        });
        addButton.onclick = () =>{
            addForm.innerHTML = '<h3>Add Row</h3><br />';
            editForm.classList.add('hidden');
            const FormAdd = document.createElement('form');
            columns.forEach((column) =>{
                const input = document.createElement('input');
                const name = document.createElement('span');
                if(type_datas[column] === undefined){
                    return;
                } 
                const type_data = type_datas[column][0];
                const default_value = type_datas[column][2];
                name.textContent = `${column} - ${type_data} ${ default_value !== null ? `| default: ${JSON.stringify(default_value)}` : ':' } `;
                name.style.fontWeight = 'bold';
                input.type = 'text';
                input.name = column;
                input.placeholder = column;
                if(type_datas[column][1] === false && !default_value && column !== 'id'){
                    input.required = true;
                }
                FormAdd.appendChild(name);
                FormAdd.appendChild(document.createElement('br'));
                FormAdd.appendChild(input);
            });
            addForm.appendChild(FormAdd);
            const buttons = document.createElement('div');
            buttons.style.display = 'flex';
            buttons.style.gap = '10px';
            const saveButton = document.createElement('button');
            saveButton.type = 'submit';
            saveButton.textContent = 'Save';
            saveButton.onclick= () =>{
                const formData = new FormData(FormAdd);
                const data = {}
                formData.forEach((value, key) => {
                    try{
                        value = JSON.parse(value);
                    }catch{
                        value = value;
                    }
                    data[key] = value;
                });
                fetch(`./add_row/${encodeURIComponent(tableName)}`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data)
                }).then(response => {
                    if (response.ok) {
                        displayTable(tableName);
                        addForm.classList.add('hidden');
                        alert("Your change is sucessfully applied")
                    } else {
                        response.text().then(error => {
                            alert(`Error updating row: ${error}`);
                            throw new Error(`Error updating row: ${error}`);
                        });
                    }
                })
            };
            buttons.appendChild(saveButton);
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel';
            cancelButton.onclick = () => {
                addForm.classList.add('hidden');
            };
            cancelButton.style.backgroundColor = 'red';
            buttons.appendChild(cancelButton);
            addForm.appendChild(buttons);
            addForm.classList.remove('hidden');
        }
    }).catch(error => {
        alert(error);
        throw new Error(`Error fetching data: ${error}`);
    })
}