// Expense Tracking System
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Add new expense
function addExpense() {
    // Get all input values
    const type = document.getElementById('expense-type').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transaction = document.getElementById('transaction-type').value;
    const description = document.getElementById('description').value.trim();
    const paymentMode = document.getElementById('payment-mode').value.trim() || 'Cash'; // Default to 'Cash'
    const date = new Date().toISOString().split('T')[0];

    // Validation
    if (!description) {
        alert("Please enter a description!");
        document.getElementById('description').focus();
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0!");
        document.getElementById('amount').focus();
        return;
    }

    // Create expense object
    const expense = {
        id: Date.now(),
        type,
        category,
        amount: parseFloat(amount.toFixed(2)), // Ensure 2 decimal places
        transaction,
        description,
        paymentMode, // Added payment mode
        date
    };

    // Add to expenses array and update
    expenses.push(expense);
    saveExpenses();
    updateDashboard();
    resetForm();
    
    // Optional: Scroll to show new entry
    document.getElementById('expense-table').scrollIntoView({ behavior: 'smooth' });
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
        table.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 2rem;">
                    <i class="fas fa-wallet" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No transactions found</p>
                </td>
            </tr>
        `;
        document.getElementById('entries-count').textContent = '0';
        return;
    }
    
    results.forEach(expense => {
        const row = table.insertRow();
        
        // Format amount with color based on type
        const amountClass = expense.transaction === 'credit' ? 'credit-amount' : 'debit-amount';
        const amountSign = expense.transaction === 'credit' ? '+' : '-';
        
        // Mobile-friendly data labels
        row.innerHTML = `
            <td data-label="Date">${expense.date}</td>
            <td data-label="Type">${expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}</td>
            <td data-label="Payment Mode">${expense.paymentMode || 'Cash'}</td>
            <td data-label="Category">${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
            <td data-label="Description">${expense.description}</td>
            <td data-label="Amount" class="${amountClass}">${amountSign}₹${expense.amount.toFixed(2)}</td>
            <td data-label="Transaction">${expense.transaction.charAt(0).toUpperCase() + expense.transaction.slice(1)}</td>
            <td data-label="Actions">
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
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

function generatePDF() {
    try {
        // Initialize PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm'
        });

        // Get selected month
        const month = document.getElementById('export-month').value;
        if (!month) {
            alert('Please select a month first');
            return;
        }

        // Filter expenses
        const monthlyExpenses = expenses.filter(exp => exp.date.startsWith(month));
        if (monthlyExpenses.length === 0) {
            alert('No transactions found for selected month!');
            return;
        }

        // Format month for title
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        const [year, monthNum] = month.split('-');
        const formattedMonth = `${monthNames[parseInt(monthNum)-1]} ${year}`;

        // ======================
        // PDF CONTENT
        // ======================
        
        // 1. Title Section
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Expense Report - ${formattedMonth}`, 105, 15, { align: 'center' });

        // 2. Summary Section
        const totals = {
            credit: monthlyExpenses.filter(e => e.transaction === 'credit')
                         .reduce((sum, e) => sum + parseFloat(e.amount), 0),
            debit: monthlyExpenses.filter(e => e.transaction === 'debit')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
        };
        totals.balance = totals.credit - totals.debit;

        doc.setFontSize(12);
        doc.text('Summary', 15, 25);
        doc.setFontSize(10);
        doc.text(`Total Credit: ₹${totals.credit.toFixed(2)}`, 15, 30);
        doc.text(`Total Debit: ₹${totals.debit.toFixed(2)}`, 15, 35);
        doc.text(`Net Balance: ₹${totals.balance.toFixed(2)}`, 15, 40);

        // 3. Main Table
        doc.autoTable({
            startY: 50,
            head: [
                ['Date', 'Type', 'Payment Mode', 'Category', 'Description', 'Amount (₹)', 'Transaction']
            ],
            body: monthlyExpenses.map(exp => [
                exp.date,
                exp.type.charAt(0).toUpperCase() + exp.type.slice(1),
                exp.paymentMode || 'Cash',
                exp.category.charAt(0).toUpperCase() + exp.category.slice(1),
                exp.description,
                { 
                    content: exp.amount.toFixed(2),
                    styles: { halign: 'right' } 
                },
                { 
                    content: exp.transaction.charAt(0).toUpperCase() + exp.transaction.slice(1),
                    styles: { 
                        textColor: exp.transaction === 'credit' ? [40, 167, 69] : [220, 53, 69],
                        fontStyle: 'bold'
                    }
                }
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 4,
                valign: 'middle'
            },
            headStyles: {
                fillColor: [67, 97, 238],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 20 }, // Date
                1: { cellWidth: 20 }, // Type
                2: { cellWidth: 25 }, // Payment Mode
                3: { cellWidth: 25 }, // Category
                4: { cellWidth: 50 }, // Description
                5: { cellWidth: 20 }, // Amount
                6: { cellWidth: 25 }  // Transaction
            },
            didDrawPage: function(data) {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, 
                    data.settings.margin.left, 
                    doc.internal.pageSize.height - 10);
                doc.text(`Page ${data.pageNumber} of ${data.pageCount}`, 
                    doc.internal.pageSize.width - 20,
                    doc.internal.pageSize.height - 10,
                    { align: 'right' });
            }
        });

        // Save and close modal
        doc.save(`Expense_Report_${formattedMonth.replace(' ', '_')}.pdf`);
        document.getElementById('pdfModal').style.display = 'none';

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Please check console for details.");
    }
}

// Modal Control (add this to your DOMContentLoaded event)
function setupPdfModal() {
    const modal = document.getElementById('pdfModal');
    const btn = document.getElementById('pdfTriggerBtn');
    const span = document.querySelector('.close-pdf-modal');

    btn.onclick = () => modal.style.display = 'block';
    span.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

document.addEventListener('DOMContentLoaded', setupPdfModal);
