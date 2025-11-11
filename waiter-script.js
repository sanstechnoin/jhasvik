// --- 1. PASTE YOUR FIREBASE CONFIG HERE ---
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
// NO POPUP NEEDED FOR WAITER
// const newOrderPopup = document.getElementById('new-order-popup-overlay');
// const popupOrderDetails = document.getElementById('popup-order-details');
// const acceptOrderBtn = document.getElementById('accept-order-btn');

// KDS Login
const loginOverlay = document.getElementById('kitchen-login-overlay');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('kitchen-password');
const loginError = document.getElementById('login-error');
const kdsContentWrapper = document.getElementById('kds-content-wrapper');

const dineInGrid = document.getElementById('dine-in-grid');
const pickupGrid = document.getElementById('pickup-grid');

let allOrders = {}; // Holds all active orders, keyed by order.id
// NO NOTIFICATION NEEDED
// let notificationAudio = new Audio('notification.mp3'); 

const KITCHEN_PASSWORD = "jhasvikkitchen"; 
const TOTAL_DINE_IN_TABLES = 12;

// --- 4. KDS Login Logic ---
loginButton.addEventListener('click', () => {
    if (passwordInput.value === KITCHEN_PASSWORD) {
        loginOverlay.classList.add('hidden');
        kdsContentWrapper.style.opacity = '1';
        initializeWaiterStation(); 
    } else {
        loginError.style.display = 'block';
    }
});
passwordInput.addEventListener('keyup', (e) => e.key === 'Enter' && loginButton.click());


// --- 5. Main Waiter Station Functions ---

function createDineInTables() {
    dineInGrid.innerHTML = ''; // Clear grid
    for (let i = 1; i <= TOTAL_DINE_IN_TABLES; i++) {
        const tableBox = document.createElement('div');
        tableBox.className = 'table-box';
        tableBox.id = `table-${i}`; // e.g., table-1
        tableBox.innerHTML = `
            <div class="table-header">
                <h2>Table ${i}</h2>
            </div>
            <ul class="order-list" data-table-id="${i}">
                <!-- Orders will be injected here -->
            </ul>
            <p class="order-list-empty" data-table-id="${i}">Waiting for order...</p>
            <button class="clear-table-btn" data-table-id="${i}">Clear Table ${i}</button>
        `;
        dineInGrid.appendChild(tableBox);
    }
}

function initializeWaiterStation() {
    createDineInTables();

    // Add listeners for all "Clear" buttons (Dine-In)
    dineInGrid.querySelectorAll('.clear-table-btn').forEach(btn => {
        btn.addEventListener('click', () => handleClearOrder(btn.dataset.tableId, 'dine-in', btn));
    });

    // Start the main listener
    db.collection("orders")
      .where("status", "in", ["new", "seen"]) 
      .onSnapshot(
        (snapshot) => {
            connectionIconEl.textContent = '✅'; 
            
            let changedTables = new Set(); 
            let changedPickupCustomers = new Set(); 

            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                
                if(orderData.orderType === 'pickup') {
                    changedPickupCustomers.add(orderData.customerName);
                } else {
                    changedTables.add(orderData.table); 
                }
                
                if (change.type === "added") {
                    allOrders[orderData.id] = orderData;
                }
                
                if (change.type === "removed") {
                    if (allOrders[orderData.id]) {
                        delete allOrders[orderData.id];
                    }
                }
                
                if (change.type === "modified") {
                    allOrders[orderData.id] = orderData;
                }
            });
            
            renderPickupGrid(); 

            changedTables.forEach(tableIdentifier => {
                if (!isNaN(parseInt(tableIdentifier))) { 
                    renderDineInTable(tableIdentifier);
                }
            });
            
            // --- NEW: Add listeners for all delete 'X' buttons ---
            addDeleteItemListeners();

        },
        (error) => {
            console.error("Error connecting to Firestore: ", error);
            connectionIconEl.textContent = '❌'; 
        }
    );
} // End of initializeWaiterStation()


function renderDineInTable(tableId) {
    const tableBox = document.getElementById(`table-${tableId}`);
    if (!tableBox) return; 
    
    const orderList = tableBox.querySelector('.order-list');
    const emptyMsg = tableBox.querySelector('.order-list-empty');
    const clearBtn = tableBox.querySelector('.clear-table-btn'); 

    const ordersForThisTable = Object.values(allOrders).filter(o => o.table === tableId && o.orderType !== 'pickup');
    
    orderList.innerHTML = ""; 
    
    if (ordersForThisTable.length === 0) {
        orderList.style.display = 'none';
        emptyMsg.textContent = "Waiting for order..."; 
        emptyMsg.style.display = 'block';
        clearBtn.disabled = false;
        clearBtn.textContent = `Clear Table ${tableId}`;
    } else {
        orderList.style.display = 'block';
        emptyMsg.style.display = 'none';
        
        ordersForThisTable.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
        
        ordersForThisTable.forEach(order => {
            const orderTimestamp = order.createdAt.toDate().toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // --- NEW: Add Delete 'X' button to each item ---
            let itemsHtml = order.items.map((item, index) => `
                <li class="waiter-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <button class="delete-item-btn" data-order-id="${order.id}" data-item-index="${index}">×</button>
                </li>
            `).join('');
            
            let notesHtml = '';
            if (order.notes && order.notes.trim() !== '') {
                notesHtml = `<p class="order-notes">⚠️ Notes: ${order.notes}</p>`;
            }

            const orderGroupHtml = `
                <div class="order-group" id="${order.id}">
                    <h4>Order @ ${orderTimestamp}</h4>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    ${notesHtml} 
                </div>
            `;
            orderList.innerHTML += orderGroupHtml;
        });
    }
}

function renderPickupGrid() {
    pickupGrid.innerHTML = ''; // Clear grid
    
    const pickupOrders = Object.values(allOrders).filter(o => o.orderType === 'pickup');
    pickupOrders.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    if (pickupOrders.length === 0) {
        pickupGrid.innerHTML = `
            <div class="pickup-box-empty">
                <p>Waiting for pickup orders...</p>
            </div>`;
        return;
    }

    pickupOrders.forEach(order => {
        const orderTimestamp = order.createdAt.toDate().toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // --- NEW: Add Delete 'X' button to each item ---
        let itemsHtml = order.items.map((item, index) => `
            <li class="waiter-item">
                <span>${item.quantity}x ${item.name}</span>
                <button class="delete-item-btn" data-order-id="${order.id}" data-item-index="${index}">×</button>
            </li>
        `).join('');

        let notesHtml = '';
        if (order.notes && order.notes.trim() !== '') {
            notesHtml = `<p class="order-notes">⚠️ Notes: ${order.notes}</p>`;
        }

        const pickupBox = document.createElement('div');
        pickupBox.className = 'pickup-box';
        pickupBox.id = `pickup-${order.id}`;
        pickupBox.innerHTML = `
            <div class="table-header">
                <h2>🛍️ ${order.customerName}</h2>
                <span class="order-time">@ ${orderTimestamp}</span>
            </div>
            <ul class="order-list">
                ${itemsHtml}
            </ul>
            ${notesHtml} 
            <button class="clear-pickup-btn" data-order-id="${order.id}">Order Complete</button>
        `;
        pickupGrid.appendChild(pickupBox);

        const clearBtn = pickupBox.querySelector('.clear-pickup-btn');
        clearBtn.addEventListener('click', () => {
            handleClearOrder(order.id, 'pickup', clearBtn);
        });
    });
}

// This "Clear" function is the same as the KDS one
async function handleClearOrder(identifier, type, buttonElement) {
    let ordersToClear = [];
    let buttonsToDisable = [buttonElement]; 

    if (type === 'dine-in') {
        ordersToClear = Object.values(allOrders).filter(o => o.table === identifier && o.orderType !== 'pickup');
        buttonsToDisable = document.querySelectorAll(`button[data-table-id="${identifier}"]`);
    } else {
        const orderToClear = allOrders[identifier];
        if (orderToClear) {
            ordersToClear = [orderToClear];
        }
    }

    if (ordersToClear.length === 0) {
        return;
    }

    buttonsToDisable.forEach(btn => {
        btn.disabled = true;
        btn.textContent = "Clearing...";
    });

    const batch = db.batch();
    ordersToClear.forEach(order => {
        const docRef = db.collection("orders").doc(order.id);
        batch.update(docRef, { status: "cooked" }); 
    });

    try {
        await batch.commit();
    } catch (e) {
        console.error(`Error clearing ${identifier}: `, e);
        buttonsToDisable.forEach(btn => {
            btn.disabled = false;
            if (type === 'dine-in') btn.textContent = `Clear Table ${identifier}`;
            if (type === 'pickup') btn.textContent = `Order Complete`;
        });
    }
}

// --- 6. NEW: Logic to delete a single item ---
// This is copied from billing-script.js
function addDeleteItemListeners() {
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        // A simple way to prevent duplicate listeners
        btn.onclick = async () => {
            const orderId = btn.dataset.orderId;
            const itemIndex = parseInt(btn.dataset.itemIndex); 
            
            if (isNaN(itemIndex)) return;

            btn.disabled = true;

            try {
                const docRef = db.collection("orders").doc(orderId);
                const doc = await docRef.get();

                if (!doc.exists) {
                    console.error("Document does not exist, cannot delete item.");
                    return;
                }

                const orderData = doc.data();
                const items = orderData.items;

                if (!items) return; // Safety check

                // Case 1: The order has only one item.
                // Delete the entire order document.
                if (items.length === 1) {
                    await docRef.delete();
                } else {
                // Case 2: The order has multiple items.
                    // Remove just the one item at that index
                    items.splice(itemIndex, 1);
                    // Update the document with the smaller items array
                    await docRef.update({ items: items });
                }
                
                // The onSnapshot listener will automatically handle the UI update

            } catch (err) {
                console.error("Error deleting item:", err);
                btn.disabled = false; // Re-enable on error
            }
        };
    });
}

// --- 7. Popup Functions (NOT USED, but kept for compatibility) ---
function showNextOrderInQueue() { /* Waiter page doesn't need popups */ }
function hideNewOrderPopup() { /* Waiter page doesn't need popups */ }
// acceptOrderBtn.addEventListener('click', () => { /* No accept button */ });
```

---

### **Step 3: `style.css` (Additions)**

Please **add this new code** to the very **end** of your `style.css` file. This will style the new "X" buttons.

```css
/* ===============================================
   NEW WAITER STATION STYLES
=============================================== 
*/

/* Styles the <li> for an item on the waiter page */
.waiter-item {
    display: flex !important; /* Override default */
    justify-content: space-between !important;
    align-items: center !important;
    padding: 5px 0 !important;
    border-bottom: 1px dotted var(--border-color) !important;
}
.waiter-item:last-child {
    border-bottom: none !important;
}

/* Styles the "X" button */
.delete-item-btn {
    background-color: #8B0000;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    line-height: 24px;
    padding: 0;
    margin-left: 10px;
    flex-shrink: 0;
    transition: background-color 0.2s;
}
.delete-item-btn:hover {
    background-color: #a10000;
}
.delete-item-btn:disabled {
    background-color: #555;
    cursor: not-allowed;
}
```

---

### **Step 4: `firestore.rules` (The FINAL, FINAL Version)**

This is **CRITICAL**. Your new `waiter.html` page will get a "Permission Denied" error unless we update the rules.

The `update` rule in our file is too strict. It *only* allows changing the `status` field. We must *also* allow changing the `items` field (for when you delete an item).

Please **replace your entire `firestore.rules` file** with this new version. This is the **most important step**.
