const style = document.createElement('style');
style.textContent = `
  .edit-btn {
    background: none;
    color: #4a6fa5;
    border: none;
    padding: 5px;
    cursor: pointer;
    font-size: 16px;
  }
  .edit-btn:hover {
    color: #3a5a80;
  }
  .action-buttons {
    display: flex;
    gap: 5px;
  }
    .edit-modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
}

.edit-modal label {
    display: block;
    margin-bottom: 10px;
}

.edit-modal input, .edit-modal select {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    box-sizing: border-box;
}

.edit-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.edit-buttons button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.edit-buttons button:first-child {
    background-color: #4CAF50;
    color: white;
}

.edit-buttons button:last-child {
    background-color: #f44336;
    color: white;
}
`;
document.head.appendChild(style);

// Expense Tracking System
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];


// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load expenses first
    loadExpenses();
    
    // Set up event listeners
    setupExpenseTypeListener();
    checkMonthReset();
    setupAddExpenseButton();
    setupPdfModal();
    
    // If in admin portal with tabs
    if (document.getElementById('admin-portal')) {
        openTab('all-transactions');
    }
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const hamburger = document.querySelector('.hamburger');
        
        if (sidebar.classList.contains('active') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.hamburger')) {
            toggleSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
});

// Set up Add Expense button
function setupAddExpenseButton() {
    const addButton = document.getElementById('add-expense-btn') || 
                     document.querySelector('.btn.primary-btn[onclick="addExpense()"]');
    
    if (addButton) {
        addButton.addEventListener('click', addExpense);
        console.log("Add Expense button initialized");
    } else {
        console.error("Add Expense button not found!");
    }
}

// Add new expense
function addExpense() {
    console.log("Add Expense function triggered");
    
    // Get all input values with null checks
    const typeElement = document.getElementById('expense-type');
    const categoryElement = document.getElementById('expense-category');
    const amountElement = document.getElementById('amount');
    const transactionElement = document.getElementById('transaction-type');
    const descriptionElement = document.getElementById('description');
    const paymentModeElement = document.getElementById('payment-mode');
    
    if (!typeElement || !categoryElement || !amountElement || 
        !transactionElement || !descriptionElement || !paymentModeElement) {
        console.error("Missing form elements:", {
            typeElement, categoryElement, amountElement,
            transactionElement, descriptionElement, paymentModeElement
        });
        alert("Form error. Please refresh the page.");
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

    console.log("Adding new expense:", expense);

    // Add to expenses array and update
    expenses.push(expense);
    saveExpenses();
    updateDashboard();
    resetForm();
    
    // Scroll to show new entry
    const expenseTable = document.getElementById('expense-table');
    if (expenseTable) {
        expenseTable.scrollIntoView({ behavior: 'smooth' });
    }
}

// Save expenses to localStorage
function saveExpenses() {
    try {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        console.log("Expenses saved successfully");
    } catch (error) {
        console.error("Error saving expenses:", error);
        alert("Error saving data. Please check console for details.");
    }
}

// Load expenses on page load
function loadExpenses() {
    try {
        const storedExpenses = localStorage.getItem('expenses');
        expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
        console.log("Loaded expenses:", expenses);
        updateDashboard();
    } catch (error) {
        console.error("Error loading expenses:", error);
        expenses = [];
    }
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
    } else {
        console.warn(`Element with ID '${id}' not found`);
    }
}

// Calculate balance for a category
function calculateCategoryTotal(expenses) {
    return expenses.reduce((sum, e) => {
        return e.transaction === 'credit' ? sum + e.amount : sum - e.amount;
    }, 0);
}

// Display expenses in table
// Display expenses in table with edit functionality
function displaySearchResults(results, tableId = 'expense-table') {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID '${tableId}' not found`);
        return;
    }
    
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error("Table body not found");
        return;
    }
    
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
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editExpense(${expense.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editExpense(${expense.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editExpense(${expense.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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

// Delete an expense - Updated version
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        // Find the expense index
        const index = expenses.findIndex(expense => expense.id === id);
        
        if (index !== -1) {
            // Remove the expense from the array
            expenses.splice(index, 1);
            
            // Update localStorage
            saveExpenses();
            
            // Refresh the display
            updateDashboard();
            
            // Re-render the current tab
            const activeTab = document.querySelector('.tab-content.active-tab');
            if (activeTab) {
                const tabId = activeTab.id;
                updateTabData(tabId);
            }
            
            console.log(`Expense with ID ${id} deleted successfully`);
        } else {
            console.error(`Expense with ID ${id} not found`);
            alert("Transaction not found!");
        }
    }
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


// Mobile sidebar toggle - Updated version
// Replace the existing toggleSidebar function with this:
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// In your DOMContentLoaded event:
document.addEventListener('DOMContentLoaded', function() {
    // ... other initialization code ...
    
    // Initialize sidebar state
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.add('active');
    }

    // Hamburger click handler
    document.querySelector('.hamburger').addEventListener('click', toggleSidebar);
    
    // Close sidebar when clicking outside or on a tab
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('active') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.hamburger')) {
            toggleSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth > 768) {
            sidebar.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            document.querySelector('.hamburger').classList.remove('open');
            document.querySelector('.sidebar-overlay').style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    loadExpenses();
    setupExpenseTypeListener();
    checkMonthReset();
    setupAddExpenseButton();
    setupPdfModal();
    
    openTab('all-transactions');
});


// Update tab function to work with mobile
function openTab(tabId) {
    // Close sidebar on mobile after selecting tab
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    
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

// PDF Generation Functions - Final Working Version
let jsPDF; // Global reference to jsPDF library

// Initialize PDF functionality
function initializePDF() {
    return new Promise((resolve, reject) => {
        // Check if jsPDF is already loaded
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
            console.log("jsPDF initialized from jspdf namespace");
            resolve();
            return;
        }
        
        if (typeof window.jsPDF !== 'undefined') {
            jsPDF = window.jsPDF;
            console.log("jsPDF already available");
            resolve();
            return;
        }

        // Load the library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            try {
                jsPDF = window.jspdf.jsPDF;
                console.log("jsPDF loaded successfully");
                resolve();
            } catch (e) {
                console.error("jsPDF initialization failed:", e);
                reject(new Error("Failed to initialize PDF library"));
            }
        };
        script.onerror = () => {
            reject(new Error("Failed to load PDF library script"));
        };
        document.head.appendChild(script);
    });
}

// Generate PDF for personal transactions
async function generatePersonalPDF() {
    try {
        await initializePDF();
        const personalExpenses = expenses.filter(e => e.type === 'personal');
        await generateTransactionPDF(personalExpenses, "Personal Transactions Report");
    } catch (error) {
        console.error("Personal PDF Error:", error);
        alert(`Failed to generate Personal PDF: ${error.message}`);
    }
}

// Generate PDF for business transactions
async function generateBusinessPDF() {
    try {
        await initializePDF();
        const businessExpenses = expenses.filter(e => e.type === 'business');
        await generateTransactionPDF(businessExpenses, "Business Transactions Report");
    } catch (error) {
        console.error("Business PDF Error:", error);
        alert(`Failed to generate Business PDF: ${error.message}`);
    }
}

// Generate PDF for loan transactions
async function generateLoanPDF() {
    try {
        await initializePDF();
        const loanExpenses = expenses.filter(e => e.type === 'loan');
        await generateTransactionPDF(loanExpenses, "Loan Transactions Report", true);
    } catch (error) {
        console.error("Loan PDF Error:", error);
        alert(`Failed to generate Loan PDF: ${error.message}`);
    }
}

// Core PDF generation function
async function generateTransactionPDF(transactions, title, isLoan = false) {
    if (!transactions || transactions.length === 0) {
        throw new Error("No transactions found");
    }

    // Create PDF document
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
    });

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });

    // Calculate totals
    const totals = {
        credit: transactions.filter(e => e.transaction === 'credit')
                     .reduce((sum, e) => sum + e.amount, 0),
        debit: transactions.filter(e => e.transaction === 'debit')
                    .reduce((sum, e) => sum + e.amount, 0)
    };
    totals.balance = totals.credit - totals.debit;

    // Add summary section
    doc.setFontSize(12);
    doc.text('Summary', 15, 25);
    doc.setFontSize(10);
    doc.text(`Total Credit: ₹${totals.credit.toFixed(2)}`, 15, 30);
    doc.text(`Total Debit: ₹${totals.debit.toFixed(2)}`, 15, 35);
    doc.text(`Net Balance: ₹${totals.balance.toFixed(2)}`, 15, 40);

    // Prepare table data
    const headers = isLoan ? 
        ['Date', 'Loan Type', 'Payment Mode', 'Description', 'Amount (₹)', 'Transaction', 'Due Date'] :
        ['Date', 'Category', 'Payment Mode', 'Description', 'Amount (₹)', 'Transaction'];

    const body = transactions.map(exp => {
        const baseRow = [
            exp.date || 'N/A',
            exp.category || 'N/A',
            exp.paymentMode || 'Cash',
            exp.description || 'No description',
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
        ];
        
        if (isLoan) {
            baseRow.push(exp.dueDate || 'N/A');
        }
        
        return baseRow;
    });

    // Generate table
    doc.autoTable({
        startY: 50,
        head: [headers],
        body: body,
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
            0: { cellWidth: 20 },  // Date
            1: { cellWidth: isLoan ? 20 : 25 },  // Category/Loan Type
            2: { cellWidth: 25 },  // Payment Mode
            3: { cellWidth: 50 },  // Description
            4: { cellWidth: 20 },  // Amount
            5: { cellWidth: 25 },  // Transaction
            ...(isLoan && { 6: { cellWidth: 25 }})  // Due Date (if loan)
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

    // Save the PDF
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
    
    // Close modal if open
    const pdfModal = document.getElementById('pdfModal');
    if (pdfModal) pdfModal.style.display = 'none';
}

// Initialize PDF library when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePDF().catch(error => {
        console.error("PDF initialization error:", error);
    });
});

function searchAllTransactions() {
    const searchTerm = document.getElementById('all-transactions-search').value.toLowerCase();
    const table = document.getElementById('all-transactions-table');
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const descriptionCell = rows[i].cells[4]; // Description is in 5th column (0-indexed)
      if (descriptionCell) {
        const descriptionText = descriptionCell.textContent || descriptionCell.innerText;
        if (descriptionText.toLowerCase().indexOf(searchTerm) > -1) {
          rows[i].style.display = '';
        } else {
          rows[i].style.display = 'none';
        }
      }
    }
}

function clearSearch() {
    document.getElementById('all-transactions-search').value = '';
    searchAllTransactions();
}

// Modify your createAllTransactionsRow function to make cells editable
function createAllTransactionsRow(table, transaction) {
    const row = table.insertRow(-1);
    
    // Date cell
    const dateCell = row.insertCell(0);
    dateCell.textContent = transaction.date || '-';
    
    // Type cell
    const typeCell = row.insertCell(1);
    typeCell.textContent = transaction.transactionType === 'credit' ? 'Credit' : 'Debit';
    
    // Payment Mode cell
    const paymentModeCell = row.insertCell(2);
    paymentModeCell.textContent = transaction.paymentMode || '-';
    
    // Category cell
    const categoryCell = row.insertCell(3);
    categoryCell.textContent = transaction.category ? 
        transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1) : 
        '-';
    
    // Description cell
    const descCell = row.insertCell(4);
    descCell.textContent = transaction.description || '-';
    
    // Amount cell
    const amountCell = row.insertCell(5);
    amountCell.textContent = '₹' + transaction.amount.toFixed(2);
    amountCell.className = transaction.transactionType === 'credit' ? 
        'credit-amount' : 'debit-amount';
    
    // Transaction Type cell
    const transTypeCell = row.insertCell(6);
    transTypeCell.textContent = transaction.transactionType === 'credit' ? 
        'Income' : 'Expense';
    
    // Actions cell with edit and delete buttons
    const actionsCell = row.insertCell(7);
    actionsCell.className = 'action-buttons';
    
    // Add edit button with pencil icon
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editTransaction(transaction);
    };
    
    // Keep existing delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this transaction?')) {
            deleteTransaction(transaction.id);
        }
    };
    
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
}

function editTransaction(transaction) {
    const newDescription = prompt("Edit description:", transaction.description);
    if (newDescription === null) return;
    
    const newAmount = parseFloat(prompt("Edit amount:", transaction.amount));
    if (isNaN(newAmount)) return;
    
    const newCategory = prompt("Edit category:", transaction.category);
    if (newCategory === null) return;
    
    const newPaymentMode = prompt("Edit payment mode:", transaction.paymentMode);
    if (newPaymentMode === null) return;
    
    // Update the transaction
    transaction.description = newDescription;
    transaction.amount = newAmount;
    transaction.category = newCategory;
    transaction.paymentMode = newPaymentMode;
    
    // Save to localStorage
    saveExpenses();
    
    // Refresh the view
    loadAllTransactions();
    updateSummaryCards();
}

// Helper function for editing text/number cells
function editCell(cell, property, transaction, inputType = 'text') {
  if (cell.querySelector('input')) return; // Already in edit mode

  const originalValue = transaction[property] || '';
  const input = document.createElement('input');
  input.type = inputType;
  input.className = 'edit-input';
  input.value = inputType === 'date' ? originalValue.split('T')[0] : originalValue;
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = '✓';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = '✕';

  cell.innerHTML = '';
  cell.appendChild(input);
  cell.appendChild(saveBtn);
  cell.appendChild(cancelBtn);
  input.focus();

  const saveEdit = () => {
    let newValue = input.value;
    if (inputType === 'number') newValue = parseFloat(newValue);
    if (inputType === 'date') newValue = new Date(newValue).toISOString();
    
    if (newValue !== originalValue) {
      transaction[property] = newValue;
      saveTransactions();
      loadAllTransactions(); // Refresh the view
      updateSummaryCards();
    } else {
      cell.textContent = inputType === 'date' ? originalValue.split('T')[0] : originalValue;
      cell.className = 'editable';
      cell.onclick = () => editCell(cell, property, transaction, inputType);
    }
  };

  const cancelEdit = () => {
    cell.textContent = inputType === 'date' ? originalValue.split('T')[0] : originalValue;
    cell.className = 'editable';
    cell.onclick = () => editCell(cell, property, transaction, inputType);
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  });

  saveBtn.addEventListener('click', saveEdit);
  cancelBtn.addEventListener('click', cancelEdit);
}

// Special function for editing transaction type
function editTypeCell(cell, transaction) {
  if (cell.querySelector('select')) return;

  const originalValue = transaction.transactionType;
  const select = document.createElement('select');
  select.className = 'edit-input';
  
  const optionCredit = document.createElement('option');
  optionCredit.value = 'credit';
  optionCredit.textContent = 'Credit';
  if (originalValue === 'credit') optionCredit.selected = true;
  
  const optionDebit = document.createElement('option');
  optionDebit.value = 'debit';
  optionDebit.textContent = 'Debit';
  if (originalValue === 'debit') optionDebit.selected = true;
  
  select.appendChild(optionCredit);
  select.appendChild(optionDebit);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = '✓';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = '✕';

  cell.innerHTML = '';
  cell.appendChild(select);
  cell.appendChild(saveBtn);
  cell.appendChild(cancelBtn);
  select.focus();

  const saveEdit = () => {
    if (select.value !== originalValue) {
      transaction.transactionType = select.value;
      saveTransactions();
      loadAllTransactions(); // Refresh the view
      updateSummaryCards();
    } else {
      cell.textContent = originalValue === 'credit' ? 'Credit' : 'Debit';
      cell.className = 'editable';
      cell.onclick = () => editTypeCell(cell, transaction);
    }
  };

  const cancelEdit = () => {
    cell.textContent = originalValue === 'credit' ? 'Credit' : 'Debit';
    cell.className = 'editable';
    cell.onclick = () => editTypeCell(cell, transaction);
  };

  select.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  });

  saveBtn.addEventListener('click', saveEdit);
  cancelBtn.addEventListener('click', cancelEdit);
}

// Special function for editing category
function editCategoryCell(cell, transaction) {
  if (cell.querySelector('select')) return;

  const originalValue = transaction.category;
  const select = document.createElement('select');
  select.className = 'edit-input';
  
  // Add all possible categories
  const categories = [
    'shopping', 'food', 'transport', 'other',
    'shop', 'property', 'supplies'
  ];
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    if (category === originalValue) option.selected = true;
    select.appendChild(option);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = '✓';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = '✕';

  cell.innerHTML = '';
  cell.appendChild(select);
  cell.appendChild(saveBtn);
  cell.appendChild(cancelBtn);
  select.focus();

  const saveEdit = () => {
    if (select.value !== originalValue) {
      transaction.category = select.value;
      saveTransactions();
      loadAllTransactions(); // Refresh the view
      updateSummaryCards();
    } else {
      cell.textContent = originalValue ? 
        originalValue.charAt(0).toUpperCase() + originalValue.slice(1) : '-';
      cell.className = 'editable';
      cell.onclick = () => editCategoryCell(cell, transaction);
    }
  };

  const cancelEdit = () => {
    cell.textContent = originalValue ? 
      originalValue.charAt(0).toUpperCase() + originalValue.slice(1) : '-';
    cell.className = 'editable';
    cell.onclick = () => editCategoryCell(cell, transaction);
  };

  select.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  });

  saveBtn.addEventListener('click', saveEdit);
  cancelBtn.addEventListener('click', cancelEdit);
}

// Update your loadAllTransactions function to use the new row creation
function loadAllTransactions() {
    const table = document.getElementById('all-transactions-table').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    
    // Make sure you're using the correct transactions array
    const transactionsToDisplay = expenses; // or allTransactions if you have that variable
    
    transactionsToDisplay.forEach(transaction => {
      createAllTransactionsRow(table, transaction);
    });
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
        alert("Expense not found!");
        return;
    }

    // Create a modal or form for editing
    const editForm = `
        <div class="edit-modal">
            <h3>Edit Transaction</h3>
            <label>Description: <input type="text" id="edit-description" value="${expense.description}"></label>
            <label>Amount: <input type="number" step="0.01" id="edit-amount" value="${expense.amount}"></label>
            <label>Category: 
                <select id="edit-category">
                    <option value="shopping" ${expense.category === 'shopping' ? 'selected' : ''}>Shopping</option>
                    <option value="food" ${expense.category === 'food' ? 'selected' : ''}>Food</option>
                    <option value="transport" ${expense.category === 'transport' ? 'selected' : ''}>Transport</option>
                    <option value="other" ${expense.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </label>
            <label>Payment Mode: 
                <select id="edit-payment-mode">
                    <option value="Cash" ${expense.paymentMode === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option value="Card" ${expense.paymentMode === 'Card' ? 'selected' : ''}>Card</option>
                    <option value="Bank Transfer" ${expense.paymentMode === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                    <option value="UPI" ${expense.paymentMode === 'UPI' ? 'selected' : ''}>UPI</option>
                </select>
            </label>
            <div class="edit-buttons">
                <button onclick="saveEdit(${expense.id})">Save</button>
                <button onclick="closeEditModal()">Cancel</button>
            </div>
        </div>
    `;

    // Create modal container if it doesn't exist
    let modal = document.getElementById('edit-modal-container');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-modal-container';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        document.body.appendChild(modal);
    }

    modal.innerHTML = editForm;
}

function saveEdit(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const description = document.getElementById('edit-description').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const category = document.getElementById('edit-category').value;
    const paymentMode = document.getElementById('edit-payment-mode').value;

    if (!description || isNaN(amount)) {
        alert("Please enter valid description and amount!");
        return;
    }

    expense.description = description;
    expense.amount = amount;
    expense.category = category;
    expense.paymentMode = paymentMode;

    saveExpenses();
    updateDashboard();
    closeEditModal();
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal-container');
    if (modal) {
        modal.remove();
    }
}
