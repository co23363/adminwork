// Expense Tracking System
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Add new expense
function addExpense() {
    const type = document.getElementById('expense-type').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transaction = document.getElementById('transaction-type').value;
    const description = document.getElementById('description').value.trim();
    const date = new Date().toISOString().split('T')[0];

    // Validation
    if (!description || isNaN(amount) || amount <= 0) {
        alert("Please enter valid description and amount!");
        return;
    }

    const expense = {
        id: Date.now(),
        type,
        category,
        amount,
        transaction,
        description,
        date
    };

    expenses.push(expense);
    saveExpenses();
    updateDashboard();
    resetForm();
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Load expenses on page load
function loadExpenses() {
    expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    updateDashboard();
}

// Update dashboard with current data
function updateDashboard() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    
    // Calculate totals
    const personalExpenses = monthlyExpenses.filter(e => e.type === 'personal');
    const businessExpenses = monthlyExpenses.filter(e => e.type === 'business');
    
    const totalCredited = monthlyExpenses
        .filter(e => e.transaction === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalDebited = monthlyExpenses
        .filter(e => e.transaction === 'debit')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const balance = totalCredited - totalDebited;
    
    // Personal and business totals (balance)
    const personalBalance = calculateCategoryTotal(personalExpenses);
    const businessBalance = calculateCategoryTotal(businessExpenses);
    
    // Update UI
    document.getElementById('personal-total').textContent = `₹${personalBalance.toFixed(2)}`;
    document.getElementById('business-total').textContent = `₹${businessBalance.toFixed(2)}`;
    document.getElementById('total-credited').textContent = `₹${totalCredited.toFixed(2)}`;
    document.getElementById('total-debited').textContent = `₹${totalDebited.toFixed(2)}`;
    document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
    
    // Display all expenses
    displaySearchResults(expenses);
}

// Calculate balance for a category
function calculateCategoryTotal(expenses) {
    return expenses.reduce((sum, e) => {
        return e.transaction === 'credit' ? sum + e.amount : sum - e.amount;
    }, 0);
}

// Display expenses in table
function displaySearchResults(results) {
    const table = document.getElementById('expense-table').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    
    if (results.length === 0) {
        table.innerHTML = '<tr><td colspan="7">No transactions found</td></tr>';
        document.getElementById('entries-count').textContent = '0';
        return;
    }
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    
    results.forEach(expense => {
        const row = table.insertRow();
        
        // Highlight search term in description
        let highlightedDesc = expense.description;
        if (searchTerm) {
            highlightedDesc = expense.description.replace(
                new RegExp(searchTerm, 'gi'),
                match => `<span class="highlight">${match}</span>`
            );
        }
        
        // Format amount with color based on transaction type
        const amountCell = expense.transaction === 'credit' 
            ? `<span style="color: var(--success)">+₹${expense.amount.toFixed(2)}</span>`
            : `<span style="color: var(--danger)">-₹${expense.amount.toFixed(2)}</span>`;
        
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}</td>
            <td>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
            <td>${highlightedDesc}</td>
            <td>${amountCell}</td>
            <td>${expense.transaction.charAt(0).toUpperCase() + expense.transaction.slice(1)}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        `;
    });
    
    document.getElementById('entries-count').textContent = results.length;
}

// Search expenses by description
function searchExpenses() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let filteredExpenses = expenses;
    
    // Filter by search term
    if (searchTerm) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by date range
    if (startDate) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.date >= startDate
        );
    }
    
    if (endDate) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.date <= endDate
        );
    }
    
    displaySearchResults(filteredExpenses);
}

// Clear search filters
function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    displaySearchResults(expenses);
}

// Apply date filter
function applyDateFilter() {
    searchExpenses();
}

// Reset form after submission
function resetForm() {
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').focus();
}

// Delete an expense
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        updateDashboard();
    }
}

// Export to CSV
function exportToCSV() {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Transaction'];
    const data = expenses.map(expense => [
        expense.date,
        expense.type,
        expense.category,
        expense.description,
        expense.amount,
        expense.transaction
    ]);
    
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
        csv += row.map(item => `"${item}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `expenses_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Initialize on page load
if (document.getElementById('expense-table')) {
    loadExpenses();
}

// In expenses.js - Add this to your existing code
document.getElementById('expense-type').addEventListener('change', function() {
    const categorySelect = document.getElementById('expense-category');
    if (this.value === 'personal') {
        categorySelect.disabled = true;
        categorySelect.value = 'other'; // Set default value
    } else {
        categorySelect.disabled = false;
    }
});

// In expenses.js - Add this function
function checkMonthReset() {
    const lastReset = localStorage.getItem('lastReset') || '';
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (lastReset !== currentMonth) {
        // Reset all displayed values
        document.getElementById('personal-total').textContent = '₹0.00';
        document.getElementById('business-total').textContent = '₹0.00';
        document.getElementById('total-credited').textContent = '₹0.00';
        document.getElementById('total-debited').textContent = '₹0.00';
        document.getElementById('balance').textContent = '₹0.00';
        
        localStorage.setItem('lastReset', currentMonth);
    }
}

// Call this when admin portal loads
checkMonthReset();

// In expenses.js - Add these functions
function generatePDF() {
    const month = document.getElementById('export-month').value;
    if (!month) {
        alert('Please select a month');
        return;
    }

    // Filter expenses for selected month
    const monthlyExpenses = expenses.filter(exp => exp.date.startsWith(month));
    
    if (monthlyExpenses.length === 0) {
        alert('No transactions found for selected month!');
        return;
    }

    // Calculate totals
    const personalExpenses = monthlyExpenses.filter(e => e.type === 'personal');
    const businessExpenses = monthlyExpenses.filter(e => e.type === 'business');
    const credited = monthlyExpenses.filter(e => e.transaction === 'credit').reduce((sum, e) => sum + e.amount, 0);
    const debited = monthlyExpenses.filter(e => e.transaction === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const balance = credited - debited;

    // Format date for title
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    const [year, monthNum] = month.split('-');
    const monthName = monthNames[parseInt(monthNum) - 1];

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
    });

    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`EXPENSE REPORT - ${monthName} ${year}`, 105, 15, { align: 'center' });

    // Add logo (optional)
    // doc.addImage(logoData, 'PNG', 10, 10, 30, 10);

    // Add summary section
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('SUMMARY', 15, 25);
    
    doc.setFontSize(10);
    doc.text(`Personal Expenses: ₹${calculateCategoryTotal(personalExpenses).toFixed(2)}`, 15, 30);
    doc.text(`Business Expenses: ₹${calculateCategoryTotal(businessExpenses).toFixed(2)}`, 15, 35);
    doc.text(`Total Credited: ₹${credited.toFixed(2)}`, 15, 40);
    doc.text(`Total Debited: ₹${debited.toFixed(2)}`, 15, 45);
    doc.text(`Net Balance: ₹${balance.toFixed(2)}`, 15, 50);

    // Add transactions table
    doc.autoTable({
        startY: 60,
        head: [
            [
                { content: 'Date', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } },
                { content: 'Type', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } },
                { content: 'Category', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } },
                { content: 'Description', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } },
                { content: 'Amount (₹)', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } },
                { content: 'Transaction', styles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold' } }
            ]
        ],
        body: monthlyExpenses.map(exp => [
            exp.date,
            exp.type.charAt(0).toUpperCase() + exp.type.slice(1),
            exp.category.charAt(0).toUpperCase() + exp.category.slice(1),
            exp.description,
            { content: exp.amount.toFixed(2), styles: { halign: 'right' } },
            { 
                content: exp.transaction.charAt(0).toUpperCase() + exp.transaction.slice(1),
                styles: { 
                    textColor: exp.transaction === 'credit' ? [40, 167, 69] : [220, 53, 69],
                    fontStyle: 'bold'
                }
            }
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: [67, 97, 238],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 40 },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 20 }
        },
        margin: { top: 60 }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 280, 200, { align: 'right' });
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 200);
    }

    // Save PDF
    doc.save(`Expense_Report_${monthName}_${year}.pdf`);
    document.getElementById('pdfModal').style.display = 'none';
}