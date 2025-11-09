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
                    
                    orderQueue.push(orderData);
                    if (orderQueue.length === 1 && newOrderPopup.classList.contains('hidden')) {
                        showNextOrderInQueue();
                    }
                    
                    if (!tableOrders[tableId]) {
                        tableOrders[tableId] = [];
                    }
                    tableOrders[tableId].push(orderData);
                    
                    updateTableBox(tableId);
                }
                
                if (change.type === "removed") {
                    console.log("Order removed:", orderData.id);
                    
                    if (tableOrders[tableId]) {
                        tableOrders[tableId] = tableOrders[tableId].filter(o => o.id !== orderData.id);
                    }
                    
                    updateTableBox(tableId);
                }
                
                if (change.type === "modified") {
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
            
            // --- THIS IS THE NEW, SIMPLER LOGIC ---
            // 1. Get all orders for this table from our local variable
            const ordersToClear = tableOrders[tableId];
            
            if (!ordersToClear || ordersToClear.length === 0) {
                console.log(`No orders to clear for table ${tableId}.`);
                return; // Nothing to clear
            }
            
            btn.disabled = true;
            btn.textContent = "Clearing...";

            // 2. Create a batch write to UPDATE them to 'cooked'
            const batch = db.batch();
            ordersToClear.forEach(order => {
                const docRef = db.collection("orders").doc(order.id);
                batch.update(docRef, { status: "cooked" });
            });
            
            try {
                // 3. Commit the batch
                await batch.commit();
                console.log(`Successfully 'cooked' all orders for table ${tableId}.`);
                // The 'onSnapshot' listener will automatically handle the "removed"
                // changes and update the UI.
            } catch (e) {
                console.error(`Error clearing table ${tableId}: `, e);
                alert(`Could not clear table ${tableId}. Please try again.`);
            } finally {
                btn.disabled = false;
                btn.textContent = `Clear Table ${tableId}`;
            }
            // --- END OF NEW LOGIC ---
        });
    });
} // End of initializeKDS()


/**
 * Re-renders a specific table box based on the 'tableOrders' state.
 */
function updateTableBox(tableId) {
    const tableBox = document.getElementById(`table-${tableId}`);
    if (!tableBox) return;
    
    const orderList = tableBox.querySelector('.order-list');
    const emptyMsg = tableBox.querySelector('.order-list-empty');
    
    const orders = tableOrders[tableId];
    
    orderList.innerHTML = ""; 
    
    if (!orders || orders.length === 0) {
        orderList.style.display = 'none';
        emptyMsg.style.display = 'block';
    } else {
        orderList.style.display = 'block';
        emptyMsg.style.display = 'none';
        
        orders.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
        
        orders.forEach(order => {
            const orderTimestamp = order.createdAt.toDate().toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
            
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
    
    let itemsHtml = currentPopupOrder.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
    popupOrderDetails.innerHTML = `
        <h4>Table ${currentPopupOrder.table}</h4>
        <ul>${itemsHtml}</ul>
    `;
    
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
    const acceptedOrder = currentPopupOrder; 
    
    hideNewOrderPopup();
    
    showNextOrderInQueue();
    
    if (acceptedOrder) {
         db.collection("orders").doc(acceptedOrder.id).update({
             status: "seen"
         }).catch(e => console.error("Error updating doc status:", e));
    }
});
