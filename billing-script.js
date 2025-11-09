// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCV6u4t8vLDbrEH_FsBrZHXsG8auh-gOP8",
    authDomain: "jhasvik-de.firebaseapp.com",
    projectId: "jhasvik-de",
    storageBucket: "jhasvik-de.firebasestorage.app",
    messagingSenderId: "415679545793",
    appId: "1:415679545793:web:880c5963d930f6ea4bef40"
};
// --- END OF FIREBASE CONFIG ---

// --- 2. Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 3. Global State and DOM Elements ---
const connectionIconEl = document.getElementById('connection-icon');
const loginOverlay = document.getElementById('billing-login-overlay');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('billing-password');
const loginError = document.getElementById('login-error');
const contentWrapper = document.getElementById('billing-content-wrapper');

const tableListEl = document.getElementById('table-list');
const billViewEl = document.getElementById('bill-view-container');
const billTableNumberEl = document.getElementById('bill-table-number');
const billItemListEl = document.getElementById('bill-item-list');
const billTotalAmountEl = document.getElementById('bill-total-amount');
const addItemForm = document.getElementById('add-item-form');
const closeBillBtn = document.getElementById('close-bill-btn');

let allCookedOrders = []; // Full list of 'cooked' orders
let currentSelectedTable = null; // Which table bill is being viewed
const BILLING_PASSWORD = "jhasvikkitchen"; // Same password as KDS for simplicity

// --- 4. Login Logic ---
loginButton.addEventListener('click', () => {
    if (passwordInput.value === BILLING_PASSWORD) {
        loginOverlay.classList.add('hidden');
        contentWrapper.style.opacity = '1'; 
        initializeBilling(); // Start the listener *after* login
    } else {
        loginError.style.display = 'block';
    }
});
passwordInput.addEventListener('keyup', (e) => e.key === 'Enter' && loginButton.click());


// --- 5. Main Billing Functions ---

/**
 * Initializes the main Firestore listener.
 */
function initializeBilling() {
    db.collection("orders")
      .where("status", "==", "cooked") // <-- LISTENS ONLY FOR 'cooked' ORDERS
      .onSnapshot(
        (snapshot) => {
            connectionIconEl.textContent = '✅';
            
            // Store all 'cooked' orders
            allCookedOrders = snapshot.docs.map(doc => doc.data());
            
            // Re-render the left-hand table list
            renderTableList();
            
            // Re-render the currently selected bill (if one is selected)
            // This ensures it updates live if an item is deleted
            if (currentSelectedTable) {
                renderBillForTable(currentSelectedTable);
            }
        },
        (error) => {
            console.error("Error connecting to Firestore: ", error);
            connectionIconEl.textContent = '❌';
        }
    );
    
    // --- Add Listeners for Form and Close Button ---
    
    // Add Manual Item Form
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentSelectedTable) return;

        const name = document.getElementById('item-name').value;
        const qty = parseInt(document.getElementById('item-qty').value);
        const price = parseFloat(document.getElementById('item-price').value);
        
        if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
            alert("Please enter valid item details.");
            return;
        }

        const newOrderId = `${currentSelectedTable}-manual-${new Date().getTime()}`;
        
        const newItem = {
            id: newOrderId,
            table: currentSelectedTable,
            items: [{ name: name, quantity: qty, price: price }], // Stored as an array to match
            status: "cooked", // Add directly to the bill
            createdAt: new Date(),
            
            // To make it compatible with our 'render' function
            name: name,
            quantity: qty,
            price: price
        };
        
        try {
            await db.collection("orders").doc(newOrderId).set(newItem);
            addItemForm.reset();
        } catch (err) {
            console.error("Error adding manual item: ", err);
            alert("Failed to add item. Check console.");
        }
    });

    // Close Bill Button
    closeBillBtn.addEventListener('click', async () => {
        if (!currentSelectedTable) return;

        // Simple confirmation
        if (!confirm(`Are you sure you want to CLOSE and CLEAR the bill for Table ${currentSelectedTable}? This cannot be undone.`)) {
            return;
        }
        
        // Find all orders for this table
        const ordersToClose = allCookedOrders.filter(order => order.table === currentSelectedTable);
        
        if (ordersToClose.length === 0) return;
        
        // Use a batch to delete them all
        const batch = db.batch();
        ordersToClose.forEach(order => {
            batch.delete(db.collection("orders").doc(order.id));
        });
        
        try {
            await batch.commit();
            console.log(`Bill for Table ${currentSelectedTable} has been closed.`);
            billViewEl.classList.add('hidden'); // Hide the bill view
            currentSelectedTable = null;
            // The onSnapshot listener will automatically update the table list
        } catch (err) {
            console.error("Error closing bill: ", err);
        }
    });

} // End initializeBilling()


/**
 * Populates the left column with buttons for each table that has a bill.
 */
function renderTableList() {
    // Get a unique list of table numbers from all 'cooked' orders
    const tablesWithBills = [...new Set(allCookedOrders.map(order => order.table))];
    tablesWithBills.sort((a, b) => a - b); // Sort tables numerically
    
    tableListEl.innerHTML = ""; // Clear the list
    
    if (tablesWithBills.length === 0) {
        tableListEl.innerHTML = "<p>No open bills.</p>";
        return;
    }

    tablesWithBills.forEach(tableNumber => {
        const button = document.createElement('button');
        button.className = 'table-list-btn';
        button.textContent = `Table ${tableNumber}`;
        button.dataset.tableId = tableNumber;
        
        // Highlight the currently selected table
        if (tableNumber === currentSelectedTable) {
            button.classList.add('selected');
        }
        
        button.addEventListener('click', () => {
            renderBillForTable(tableNumber);
        });
        tableListEl.appendChild(button);
    });
}

/**
 * Renders the full bill details for the selected table in the right column.
 */
function renderBillForTable(tableNumber) {
    currentSelectedTable = tableNumber;
    
    // Highlight the selected button in the left list
    document.querySelectorAll('.table-list-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tableId === tableNumber);
    });

    // Get all orders for just this table
    const tableOrders = allCookedOrders.filter(order => order.table === tableNumber);
    
    if (tableOrders.length === 0) {
        // This can happen if the bill was just closed
        billViewEl.classList.add('hidden');
        currentSelectedTable = null;
        renderTableList(); // Refresh the list
        return;
    }
    
    billViewEl.classList.remove('hidden');
    billTableNumberEl.textContent = tableNumber;
    billItemListEl.innerHTML = "";
    let total = 0;

    tableOrders.forEach(order => {
        // Handle both single-item "manual" orders and multi-item "dine-in" orders
        const items = order.items || [{ name: order.name, quantity: order.quantity, price: order.price }];
        
        items.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            total += itemTotal;
            
            const li = document.createElement('li');
            li.className = 'bill-item';
            li.innerHTML = `
                <span class="item-name">${item.quantity}x ${item.name}</span>
                <span class="item-price">${itemTotal.toFixed(2)} €</span>
                <button class="bill-delete-item" data-order-id="${order.id}">×</button>
            `;
            billItemListEl.appendChild(li);
        });
    });

    billTotalAmountEl.textContent = `${total.toFixed(2)} €`;
    
    // Add listeners to the new 'delete' buttons
    addDeleteButtonListeners();
}

/**
 * Adds click handlers to all 'X' buttons on the bill.
 */
function addDeleteButtonListeners() {
    document.querySelectorAll('.bill-delete-item').forEach(btn => {
        // Use 'replaceWith' to avoid duplicate listeners
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.bill-delete-item').forEach(btn => {
        btn.addEventListener('click', async () => {
            const orderId = btn.dataset.orderId;
            btn.disabled = true;
            try {
                // Just delete this one document
                await db.collection("orders").doc(orderId).delete();
                // The onSnapshot listener will do the rest
            } catch (err) {
                console.error("Error deleting item:", err);
            }
        });
    });
}
