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
const newOrderPopup = document.getElementById('new-order-popup-overlay');
const popupOrderDetails = document.getElementById('popup-order-details');
const acceptOrderBtn = document.getElementById('accept-order-btn');

// KDS Login
const loginOverlay = document.getElementById('kitchen-login-overlay');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('kitchen-password');
const loginError = document.getElementById('login-error');
const kdsContentWrapper = document.getElementById('kds-content-wrapper');

let orderQueue = []; // For stacking popups
let currentPopupOrder = null; // The order currently in the popup
let tableOrders = {}; // Holds all active orders: { "1": [order1, order2], "5": [order3] }
let notificationAudio = new Audio('notification.mp3'); // Cache the audio file

// --- 4. KDS Login Logic ---
// Simple password check. THIS IS NOT SECURE.
const KITCHEN_PASSWORD = "jhasvikkitchen"; 

loginButton.addEventListener('click', () => {
    if (passwordInput.value === KITCHEN_PASSWORD) {
        loginOverlay.classList.add('hidden');
        kdsContentWrapper.style.opacity = '1'; // Show content
        initializeKDS(); // Start the listener *after* login
    } else {
        loginError.style.display = 'block';
    }
});

// Allow pressing Enter to log in
passwordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});


// --- 5. Main KDS Functions ---

/**
 * Initializes the main Firestore listener.
 * This is called AFTER successful login.
 */
function initializeKDS() {
    db.collection("orders")
      .where("status", "in", ["new", "seen"]) // Only listen for active orders
      .onSnapshot(
        (snapshot) => {
            // --- Connection Status ---
            connectionIconEl.textContent = '✅'; 
            
            // --- Process Changes ---
            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                const tableId = orderData.table;

                if (change.type === "added") {
                    console.log("New order received:", orderData.id);
                    
                    // 1. Add to popup queue
                    orderQueue.push(orderData);
                    // If this is the first item and no popup is active, show it.
                    if (orderQueue.length === 1 && newOrderPopup.classList.contains('hidden')) {
                        showNextOrderInQueue();
                    }
                    
                    // 2. Add to internal state
                    if (!tableOrders[tableId]) {
                        tableOrders[tableId] = [];
                    }
                    tableOrders[tableId].push(orderData);
                    
                    // 3. Re-render the table box
                    updateTableBox(tableId);
                }
                
                if (change.type === "removed") {
                    console.log("Order removed:", orderData.id);
                    
                    // 1. Remove from internal state
                    if (tableOrders[tableId]) {
                        tableOrders[tableId] = tableOrders[tableId].filter(o => o.id !== orderData.id);
                    }
                    
                    // 2. Re-render the table box
                    updateTableBox(tableId);
                }
                
                if (change.type === "modified") {
                    // This handles the "status: seen" update
                    console.log("Order modified (seen):", orderData.id);
                    if (tableOrders[tableId]) {
                       const index = tableOrders[tableId].findIndex(o => o.id === orderData.id);
                       if (index > -1) {
                           tableOrders[tableId][index] = orderData;
                       }
                    }
                }
            });
        },
        (error) => {
            // --- Error Handling ---
            console.error("Error connecting to Firestore: ", error);
            connectionIconEl.textContent = '❌'; 
        }
    );

    // --- Add Listeners for ALL Clear Buttons ---
    document.querySelectorAll('.clear-table-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tableId = btn.dataset.tableId;
            
            btn.disabled = true;
            btn.textContent = "Clearing...";

            try {
                // --- NEW CLEAR LOGIC ---
                // 1. Query for all active orders for this table
                const querySnapshot = await db.collection("orders")
                    .where("table", "==", tableId)
                    .where("status", "in", ["new", "seen"])
                    .get();

                if (querySnapshot.empty) {
                    console.log(`No orders to clear for table ${tableId}.`);
                    // This will force a UI update just in case state is mismatched
                    if (tableOrders[tableId]) {
                        tableOrders[tableId] = [];
                    }
                    updateTableBox(tableId);
                    return;
                }

                // 2. Create a batch write to UPDATE them to 'cooked'
                const batch = db.batch();
                querySnapshot.forEach(doc => {
                    // WE NOW UPDATE INSTEAD OF DELETE
                    batch.update(doc.ref, { status: "cooked" }); 
                });
                
                // 3. Commit the batch
                await batch.commit();
                
                console.log(`Successfully cleared all orders for table ${tableId}.`);
                // The 'onSnapshot' listener will automatically handle the "removed"
                // changes and update the UI.

            } catch (e) {
                console.error(`Error clearing table ${tableId}: `, e);
                // --- IMPORTANT ---
                // This is the error that will contain the index link
                alert(`Could not clear table ${tableId}. Check the console (F12) for an error. You may need to create a Firestore index.`);
            } finally {
                btn.disabled = false;
                btn.textContent = `Clear Table ${tableId}`;
            }
        });
    });
} // End of initializeKDS()


/**
 * Re-renders a specific table box based on the 'tableOrders' state.
 */
function updateTableBox(tableId) {
    const tableBox = document.getElementById(`table-${tableId}`);
    if (!tableBox) return; // Safety check
    
    // Get the list AND the empty message elements
    const orderList = tableBox.querySelector('.order-list');
    const emptyMsg = tableBox.querySelector('.order-list-empty');
    
    const orders = tableOrders[tableId];
    
    // Clear only the list, not the empty message
    orderList.innerHTML = ""; 
    
    if (!orders || orders.length === 0) {
        // Hide the list, show the empty message
        orderList.style.display = 'none';
        emptyMsg.style.display = 'block';
    } else {
        // Show the list, hide the empty message
        orderList.style.display = 'block';
        emptyMsg.style.display = 'none';
        
        // Sort orders by time, oldest first
        orders.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
        
        orders.forEach(order => {
            const orderTimestamp = order.createdAt.toDate().toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
            
            // This part creates the order group and adds it to the list
            const orderGroupHtml = `
                <div class="order-group" id="${order.id}">
                    <h4>Order @ ${orderTimestamp}</h4>
                    <ul>
                        ${itemsHtml}
                    </ul>
                </div>
            `;
            orderList.innerHTML += orderGroupHtml;
        });

        // Flash the box
        tableBox.classList.add('new-order-flash');
        setTimeout(() => {
            tableBox.classList.remove('new-order-flash');
        }, 1500);
    }
}

// --- 6. Popup Queue Functions ---

/**
 * Gets the next order from the queue and displays it in the popup.
 */
function showNextOrderInQueue() {
    if (orderQueue.length === 0) {
        currentPopupOrder = null;
        return; // No orders left in queue
    }
    
    currentPopupOrder = orderQueue.shift(); // Get the first order
    
    // Build popup content
    let itemsHtml = currentPopupOrder.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
    popupOrderDetails.innerHTML = `
        <h4>Table ${currentPopupOrder.table}</h4>
        <ul>${itemsHtml}</ul>
    `;
    
    // Show popup and play sound
    newOrderPopup.classList.remove('hidden');
    notificationAudio.play().catch(e => console.warn("Could not play audio:", e));
}

/**
 * Hides the popup.
 */
function hideNewOrderPopup() {
    newOrderPopup.classList.add('hidden');
    currentPopupOrder = null;
}

// --- 7. Event Listener for Popup Button ---

acceptOrderBtn.addEventListener('click', () => {
    const acceptedOrder = currentPopupOrder; // Save ref to the order
    
    // 1. Hide the current popup
    hideNewOrderPopup();
    
    // 2. Immediately try to show the next one
    showNextOrderInQueue();
    
    // 3. Update the accepted order's status in Firebase
    // This prevents it from re-appearing in the queue on a page refresh
    if (acceptedOrder) {
         db.collection("orders").doc(acceptedOrder.id).update({
             status: "seen"
         }).catch(e => console.error("Error updating doc status:", e));
    }
});
