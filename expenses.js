
// Add new expense
function addExpense() {
    // Get all input values with null checks
    const typeElement = document.getElementById('expense-type');
    const categoryElement = document.getElementById('expense-category');
    const amountElement = document.getElementById('amount');
    const transactionElement = document.getElementById('transaction-type');
    const descriptionElement = document.getElementById('description');
    const paymentModeElement = document.getElementById('payment-mode');
    
    if (!typeElement || !categoryElement || !amountElement || 
        !transactionElement || !descriptionElement || !paymentModeElement) {
        console.error("One or more form elements not found");
        return;
    }
    
    const type = typeElement.value;
    const category = categoryElement.value;
    const amount = parseFloat(amountElement.value);
    const transaction = transactionElement.value;
    const description = descriptionElement.value.trim();
    const paymentMode = paymentModeElement.value.trim() || 'Cash';
    const date = new Date().toISOString().split('T')[0];

    // Validation
    if (!description) {
        alert("Please enter a description!");
        descriptionElement.focus();
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0!");
        amountElement.focus();
        return;
    }

    // Create expense object
    const expense = {
        id: Date.now(),
        type,
        category,
        amount: parseFloat(amount.toFixed(2)),
        transaction,
        description,
        paymentMode,
        date
    };

    // Debug log
    console.log("Adding new expense:", expense);

    // Add to expenses array and update
    expenses.push(expense);
    saveExpenses();
    updateDashboard();
    resetForm();
    
    // Optional: Scroll to show new entry
    const expenseTable = document.getElementById('expense-table');
    if (expenseTable) {
        expenseTable.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Debug log
    console.log("Updated expenses array:", expenses);
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Load expenses on page load
function loadExpenses() {
    const storedExpenses = localStorage.getItem('expenses');
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
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
    
    // Personal and business totals
    const personalBalance = calculateCategoryTotal(personalExpenses);
    const businessBalance = calculateCategoryTotal(businessExpenses);
    
    // Update UI
    updateElementText('personal-total', `₹${personalBalance.toFixed(2)}`);
    updateElementText('business-total', `₹${businessBalance.toFixed(2)}`);
    updateElementText('total-credited', `₹${totalCredited.toFixed(2)}`);
    updateElementText('total-debited', `₹${totalDebited.toFixed(2)}`);
    updateElementText('balance', `₹${balance.toFixed(2)}`);
    
    // Display all expenses
    displaySearchResults(expenses);
}

// Helper function to safely update element text
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Calculate balance for a category
function calculateCategoryTotal(expenses) {
    return expenses.reduce((sum, e) => {
        return e.transaction === 'credit' ? sum + e.amount : sum - e.amount;
    }, 0);
}

// Display expenses in table
function displaySearchResults(results, tableId = 'expense-table') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 2rem;">
                    <i class="fas fa-wallet" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No transactions found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    results.forEach(expense => {
        const row = tbody.insertRow();
        
        const amountClass = expense.transaction === 'credit' ? 'credit-amount' : 'debit-amount';
        const amountSign = expense.transaction === 'credit' ? '+' : '-';
        
        // Determine which columns to show based on tableId
        if (tableId === 'loan-transactions-table') {
            row.innerHTML = `
                <td data-label="Date">${expense.date}</td>
                <td data-label="Loan Type">${expense.category || 'N/A'}</td>
                <td data-label="Payment Mode">${expense.paymentMode || 'Cash'}</td>
                <td data-label="Description">${expense.description}</td>
                <td data-label="Amount" class="${amountClass}">${amountSign}₹${expense.amount.toFixed(2)}</td>
                <td data-label="Transaction">${expense.transaction.charAt(0).toUpperCase() + expense.transaction.slice(1)}</td>
                <td data-label="Due Date">${expense.dueDate || 'N/A'}</td>
                <td data-label="Actions">
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
        } else if (tableId === 'all-transactions-table') {
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
        } else {
            // For personal and business tables
            row.innerHTML = `
                <td data-label="Date">${expense.date}</td>
                <td data-label="Category">${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
                <td data-label="Payment Mode">${expense.paymentMode || 'Cash'}</td>
                <td data-label="Description">${expense.description}</td>
                <td data-label="Amount" class="${amountClass}">${amountSign}₹${expense.amount.toFixed(2)}</td>
                <td data-label="Transaction">${expense.transaction.charAt(0).toUpperCase() + expense.transaction.slice(1)}</td>
                <td data-label="Actions">
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
        }
    });
}

// Search expenses by description
function searchExpenses() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    
    let filteredExpenses = [...expenses];
    
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
    const searchInput = document.getElementById('search-input');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (searchInput) searchInput.value = '';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    
    displaySearchResults(expenses);
}

// Apply date filter
function applyDateFilter() {
    searchExpenses();
}

// Reset form after submission
function resetForm() {
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    
    if (descriptionInput) descriptionInput.value = '';
    if (amountInput) amountInput.value = '';
    
    if (descriptionInput) descriptionInput.focus();
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

// Expense type change handler
function setupExpenseTypeListener() {
    const expenseType = document.getElementById('expense-type');
    if (expenseType) {
        expenseType.addEventListener('change', function() {
            const categorySelect = document.getElementById('expense-category');
            if (categorySelect) {
                if (this.value === 'personal') {
                    categorySelect.disabled = true;
                    categorySelect.value = 'other';
                } else {
                    categorySelect.disabled = false;
                }
            }
        });
    }
}

// Check month reset
function checkMonthReset() {
    const lastReset = localStorage.getItem('lastReset') || '';
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (lastReset !== currentMonth) {
        // Reset all displayed values
        updateElementText('personal-total', '₹0.00');
        updateElementText('business-total', '₹0.00');
        updateElementText('total-credited', '₹0.00');
        updateElementText('total-debited', '₹0.00');
        updateElementText('balance', '₹0.00');
        
        localStorage.setItem('lastReset', currentMonth);
    }
}

// PDF Generation
function generatePDF() {
    try {
        if (typeof jsPDF === 'undefined') {
            alert("PDF library not loaded. Please try again.");
            return;
        }

        const month = document.getElementById('export-month')?.value;
        if (!month) {
            alert('Please select a month first');
            return;
        }

        const monthlyExpenses = expenses.filter(exp => exp.date.startsWith(month));
        if (monthlyExpenses.length === 0) {
            alert('No transactions found for selected month!');
            return;
        }

        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        const [year, monthNum] = month.split('-');
        const formattedMonth = `${monthNames[parseInt(monthNum)-1]} ${year}`;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm'
        });

        // Title Section
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Expense Report - ${formattedMonth}`, 105, 15, { align: 'center' });

        // Summary Section
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

        // Main Table
        doc.autoTable({
            startY: 50,
            head: [['Date', 'Type', 'Payment Mode', 'Category', 'Description', 'Amount (₹)', 'Transaction']],
            body: monthlyExpenses.map(exp => [
                exp.date,
                exp.type.charAt(0).toUpperCase() + exp.type.slice(1),
                exp.paymentMode || 'Cash',
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
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 50 },
                5: { cellWidth: 20 },
                6: { cellWidth: 25 }
            },
            didDrawPage: function(data) {
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

        doc.save(`Expense_Report_${formattedMonth.replace(' ', '_')}.pdf`);
        const pdfModal = document.getElementById('pdfModal');
        if (pdfModal) pdfModal.style.display = 'none';

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Please check console for details.");
    }
}

// Modal Control
function setupPdfModal() {
    const modal = document.getElementById('pdfModal');
    const btn = document.getElementById('pdfTriggerBtn');
    const span = document.querySelector('.close-pdf-modal');

    if (btn) btn.onclick = () => modal && (modal.style.display = 'block');
    if (span) span.onclick = () => modal && (modal.style.display = 'none');
    
    window.onclick = (event) => {
        if (event.target === modal && modal) {
            modal.style.display = 'none';
        }
    };
}

// Tab Management
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active-tab');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabContent = document.getElementById(tabId);
    const tabButton = document.querySelector(`.tab-btn[onclick="openTab('${tabId}')"]`);
    
    if (tabContent) tabContent.classList.add('active-tab');
    if (tabButton) tabButton.classList.add('active');
    
    updateTabData(tabId);
}

function updateTabData(tabId) {
    switch(tabId) {
        case 'all-transactions':
            displayAllTransactions();
            break;
        case 'personal':
            displayPersonalTransactions();
            break;
        case 'business':
            displayBusinessTransactions();
            break;
        case 'loan':
            displayLoanTransactions();
            break;
    }
}

// Display functions for each tab
function displayAllTransactions() {
    displaySearchResults(expenses, 'all-transactions-table');
    updateSummaryCards('all', expenses);
}

function displayPersonalTransactions() {
    const personalExpenses = expenses.filter(e => e.type === 'personal');
    displaySearchResults(personalExpenses, 'personal-transactions-table');
    updateSummaryCards('personal', personalExpenses);
}

function displayBusinessTransactions() {
    const businessExpenses = expenses.filter(e => e.type === 'business');
    displaySearchResults(businessExpenses, 'business-transactions-table');
    updateSummaryCards('business', businessExpenses);
}

function displayLoanTransactions() {
    const loanExpenses = expenses.filter(e => e.type === 'loan');
    displaySearchResults(loanExpenses, 'loan-transactions-table');
    updateSummaryCards('loan', loanExpenses);
}

function updateSummaryCards(prefix, expenses) {
    const credited = expenses.filter(e => e.transaction === 'credit').reduce((sum, e) => sum + e.amount, 0);
    const debited = expenses.filter(e => e.transaction === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const balance = credited - debited;

    updateElementText(`${prefix}-credited`, `₹${credited.toFixed(2)}`);
    updateElementText(`${prefix}-debited`, `₹${debited.toFixed(2)}`);
    updateElementText(`${prefix}-balance`, `₹${balance.toFixed(2)}`);
}

// Add expense functions for each type
function addPersonalExpense() {
    addTypedExpense('personal', 'personal-amount', 'personal-description', 
                   'personal-transaction-type', 'personal-category', 'personal-payment-mode');
}

function addBusinessExpense() {
    addTypedExpense('business', 'business-amount', 'business-description', 
                   'business-transaction-type', 'business-category', 'business-payment-mode');
}

function addLoanExpense() {
    const amount = parseFloat(document.getElementById('loan-amount')?.value);
    const description = document.getElementById('loan-description')?.value.trim();
    const transaction = document.getElementById('loan-transaction-type')?.value;
    const loanType = document.getElementById('loan-type')?.value;
    const paymentMode = document.getElementById('loan-payment-mode')?.value.trim() || 'Cash';
    const dueDate = document.getElementById('loan-due-date')?.value;

    if (!description || isNaN(amount)) {
        alert("Please enter valid description and amount!");
        return;
    }

    const expense = {
        id: Date.now(),
        type: 'loan',
        category: loanType,
        amount: parseFloat(amount.toFixed(2)),
        transaction,
        description,
        paymentMode,
        date: new Date().toISOString().split('T')[0],
        dueDate: dueDate || undefined
    };

    expenses.push(expense);
    saveExpenses();
    displayLoanTransactions();
    resetLoanForm();
}

function addTypedExpense(type, amountId, descId, transId, categoryId, paymentId) {
    const amount = parseFloat(document.getElementById(amountId)?.value);
    const description = document.getElementById(descId)?.value.trim();
    const transaction = document.getElementById(transId)?.value;
    const category = document.getElementById(categoryId)?.value;
    const paymentMode = document.getElementById(paymentId)?.value.trim() || 'Cash';

    if (!description || isNaN(amount)) {
        alert("Please enter valid description and amount!");
        return;
    }

    const expense = {
        id: Date.now(),
        type,
        category,
        amount: parseFloat(amount.toFixed(2)),
        transaction,
        description,
        paymentMode,
        date: new Date().toISOString().split('T')[0]
    };

    expenses.push(expense);
    saveExpenses();
    
    if (type === 'personal') {
        displayPersonalTransactions();
        resetPersonalForm();
    } else {
        displayBusinessTransactions();
        resetBusinessForm();
    }
}

function resetPersonalForm() {
    const descInput = document.getElementById('personal-description');
    const amountInput = document.getElementById('personal-amount');
    if (descInput) descInput.value = '';
    if (amountInput) amountInput.value = '';
    if (descInput) descInput.focus();
}

function resetBusinessForm() {
    const descInput = document.getElementById('business-description');
    const amountInput = document.getElementById('business-amount');
    if (descInput) descInput.value = '';
    if (amountInput) amountInput.value = '';
    if (descInput) descInput.focus();
}

function resetLoanForm() {
    const descInput = document.getElementById('loan-description');
    const amountInput = document.getElementById('loan-amount');
    const dueDateInput = document.getElementById('loan-due-date');
    if (descInput) descInput.value = '';
    if (amountInput) amountInput.value = '';
    if (dueDateInput) dueDateInput.value = '';
    if (descInput) descInput.focus();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    if (document.getElementById('expense-table')) {
        // Original expense tracker page
        loadExpenses();
        setupExpenseTypeListener();
        checkMonthReset();
    }
    
    if (document.getElementById('admin-portal')) {
        // New admin portal with tabs
        openTab('all-transactions');
        loadExpenses();
        setupPdfModal();
    }
});

// Add to your JavaScript
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
  }
  
  // Add hamburger button to your HTML (near top of body)
  <button class="hamburger-btn" onclick="toggleSidebar()">☰</button>

// Expense Tracking System
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
