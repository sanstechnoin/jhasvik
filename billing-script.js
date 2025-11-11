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

// --- NEW: MASTER MENU LIST ---
const MENU_ITEMS = [
    { name: "Muringayila Charu", price: 6.90 },
    { name: "Kayi Halu Rasam", price: 5.90 },
    { name: "Chettinadu Nandu Rasam", price: 7.90 },
    { name: "Hyderabadi Mutton Bone soup", price: 7.90 },
    { name: "Carrot 65", price: 7.90 },
    { name: "Kallukadai Koon Ularthiyathu", price: 9.90 },
    { name: "Kovai Paal Katti Monica", price: 6.90 },
    { name: "Meduvada (2 pieces)", price: 5.50 },
    { name: "Sambar Vada (2 pieces)", price: 7.90 },
    { name: "Rasam Vada (2 pieces)", price: 7.90 },
    { name: "Thayir Vada (2 pieces)", price: 6.90 },
    { name: "Ghee Podi Mini Idli", price: 10.90 },
    { name: "Mini Sambar Idli", price: 8.90 },
    { name: "Guntur Kodi Roast", price: 11.90 },
    { name: "Karandi Omelette", price: 6.90 },
    { name: "Kozhi Milagu Pirattal Parotta Tacos", price: 13.90 },
    { name: "Chemmeen Podi ittu Varuthathu", price: 14.90 },
    { name: "Vintage Chicken 65", price: 9.90 },
    { name: "Rayalaseema Veyinchina Mamsam", price: 16.90 },
    { name: "Mutton Varattiyathu", price: 16.90 },
    { name: "Malabar Meen Polichathu", price: 20.90 },
    { name: "Koonthal Porichathu", price: 18.90 },
    { name: "Hasiru Masala Fish fry", price: 20.90 },
    { name: "Sigadigalu Roast", price: 16.90 },
    { name: "Muttai Chutney Kebab", price: 9.90 },
    { name: "Kari Pazha Kuzhambu", price: 18.90 },
    { name: "Avakkaya Pappu annam", price: 15.90 },
    { name: "Madurai Kaai Salna", price: 18.90 },
    { name: "Gutti Vankaya kura", price: 16.90 },
    { name: "Batata Pathinja Gassi", price: 18.90 },
    { name: "Pollachi Mutton Kulambu", price: 20.90 },
    { name: "Gongura Oorugai Mamasam", price: 20.90 },
    { name: "Meen Manga Thalicha Curry", price: 20.90 },
    { name: "Kori Gassi", price: 18.90 },
    { name: "Tamoto Guddu Pulusu", price: 14.90 },
    { name: "Madurai Chicken Salna", price: 16.90 },
    { name: "Naanjil Naadan Karipazha Biriyani", price: 14.90 },
    { name: "Kongunadu Mutton Biriyani", price: 16.90 },
    { name: "Muslim Style Chicken Biriyani", price: 13.90 },
    { name: "Chicken Biriyani COMBO", price: 21.90 },
    { name: "Mutton Biriyani COMBO", price: 24.90 },
    { name: "Idiyappam (4 pieces)", price: 4.90 },
    { name: "Madurai Kari Dosa (2 piece)", price: 16.90 },
    { name: "Bun Parotta (2 piece)", price: 7.90 },
    { name: "Malabar Wheat Parotta (2 piece)", price: 6.90 },
    { name: "Chicken Kothu Idiyappam", price: 13.90 },
    { name: "Veg Kothu Idiyappam", price: 12.90 },
    { name: "Veg Kothu Parotta", price: 12.90 },
    { name: "Egg Kothu Parotta", price: 13.90 },
    { name: "Chicken Kothu Parotta", price: 14.90 },
    { name: "Plain Idli (2 pieces)", price: 5.90 },
    { name: "Neer Dosa (4 pieces)", price: 7.90 },
    { name: "Plain Dosa", price: 9.90 },
    { name: "Ghee Roast", price: 11.90 },
    { name: "Masala Dosa", price: 11.90 },
    { name: "Ghee Podi Onion Dosa", price: 12.90 },
    { name: "Onion Rava Dosa", price: 11.90 },
    { name: "Open Butter Masala Dosa", price: 12.90 },
    { name: "Nellore Ghee Karam Dosa (1 piece)", price: 12.90 },
    { name: "Onion Uthappam (1 piece)", price: 12.90 },
    { name: "Plain Uthappam (1 piece)", price: 11.90 },
    { name: "Onion Ghee Podi Uthappam (1 piece)", price: 12.90 },
    { name: "Filter Coffee Custard", price: 8.90 },
    { name: "Badam Halwa", price: 8.90 },
    { name: "Karuppu Kavuni Arisi Halwa", price: 8.90 },
    { name: "Hydrebadi Double ka Meetha", price: 5.90 },
    { name: "Pazham Pori with Paalada Pradhaman", price: 10.90 },
    { name: "Tea Masala", price: 3.50 },
    { name: "Madras Filter Coffee", price: 4.50 },
    { name: "Sulaimani", price: 4.00 },
    { name: "Tea", price: 3.00 },
    { name: "Sukku Malli Kaapi", price: 4.50 },
    { name: "Vasantha Neer", price: 7.90 },
    { name: "Paanakam", price: 6.90 },
    { name: "Nannari Sharbat", price: 4.90 },
    { name: "Jhasvik Special Rose Milk", price: 5.90 },
    { name: "Keralayam", price: 7.90 },
    { name: "Sambharam", price: 4.90 }
];
// --- END MASTER MENU LIST ---

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

// --- NEW: Get form inputs and datalist ---
const itemNameInput = document.getElementById('item-name');
const itemQtyInput = document.getElementById('item-qty');
const itemPriceInput = document.getElementById('item-price');
const menuDatalist = document.getElementById('menu-items-list');
// --- END NEW ---

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
    populateDatalist(); // <-- NEW: Fill the dropdown

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
    
    // --- NEW: Add item search listener ---
    itemNameInput.addEventListener('input', handleItemSearch);

    // Add Manual Item Form
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentSelectedTable) return;

        const name = itemNameInput.value;
        const qty = parseInt(itemQtyInput.value);
        const price = parseFloat(itemPriceInput.value);
        
        if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
            alert("Please enter valid item details.");
            return;
        }

        const newOrderId = `${currentSelectedTable}-manual-${new Date().getTime()}`;
        
        // --- NEW: Check if this is a pickup order ---
        const isPickup = allCookedOrders.some(order => order.table === currentSelectedTable && order.orderType === 'pickup');

        const newItem = {
            id: newOrderId,
            table: currentSelectedTable, // This is the Table # or Customer Name
            items: [{ name: name, quantity: qty, price: price }], // Stored as an array to match
            status: "cooked", // Add directly to the bill
            createdAt: new Date(),
            
            // Add pickup/customer info if it exists
            orderType: isPickup ? "pickup" : "dine-in",
            customerName: isPickup ? currentSelectedTable : null,
            
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
        const confirmMessage = `Are you sure you want to CLOSE and ARCHIVE the bill for ${currentSelectedTable}? This cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Find all orders for this table
        const ordersToClose = allCookedOrders.filter(order => order.table === currentSelectedTable);
        
        if (ordersToClose.length === 0) return;
        
        // --- NEW ARCHIVE LOGIC ---
        
        // 1. Compile all items into a final list
        let finalBillItems = [];
        let finalBillTotal = 0;

        ordersToClose.forEach(order => {
            const items = order.items || [{ name: order.name, quantity: order.quantity, price: order.price }];
            items.forEach(item => {
                finalBillItems.push({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                });
                finalBillTotal += (item.price || 0) * (item.quantity || 1);
            });
        });

        // 2. Create the new archive document
        const archiveDoc = {
            table: currentSelectedTable, // This is the Table # or Customer Name
            items: finalBillItems,
            total: finalBillTotal,
            closedAt: new Date() // The time the bill was closed
        };

        try {
            // 3. Save the new archive document
            const archiveId = `archive-${new Date().getTime()}`;
            await db.collection("archived_orders").doc(archiveId).set(archiveDoc);

            // 4. (Only after saving) Delete all the old 'cooked' orders
            const batch = db.batch();
            ordersToClose.forEach(order => {
                batch.delete(db.collection("orders").doc(order.id));
            });
            await batch.commit();

            console.log(`Bill for ${currentSelectedTable} has been archived and closed.`);
            billViewEl.classList.add('hidden'); // Hide the bill view
            currentSelectedTable = null;
            // The onSnapshot listener will automatically update the table list
        
        } catch (err) {
            console.error("Error archiving bill: ", err);
            alert("Error closing bill. Check the console.");
        }
        // --- END NEW ARCHIVE LOGIC ---
    });
} // End initializeBilling()

/**
 * Populates the left column with buttons for each table that has a bill.
 */
function renderTableList() {
    // Get a unique list of table numbers / customer names
    const tablesWithBills = [...new Set(allCookedOrders.map(order => order.table))];
    
    // Sort tables: Numbers first, then names
    tablesWithBills.sort((a, b) => {
        const aIsNum = !isNaN(parseInt(a));
        const bIsNum = !isNaN(parseInt(b));

        if (aIsNum && !bIsNum) return -1; // Numbers come before strings
        if (!aIsNum && bIsNum) return 1;  // Strings come after numbers
        if (aIsNum && bIsNum) return parseInt(a) - parseInt(b); // Sort numbers numerically
        return a.localeCompare(b); // Sort strings alphabetically
    });
    
    tableListEl.innerHTML = ""; // Clear the list
    
    if (tablesWithBills.length === 0) {
        tableListEl.innerHTML = "<p>No open bills.</p>";
        return;
    }

    tablesWithBills.forEach(tableIdentifier => {
        const button = document.createElement('button');
        button.className = 'table-list-btn';
        
        // --- NEW: Add pickup icon to button text ---
        const order = allCookedOrders.find(o => o.table === tableIdentifier);
        if (order.orderType === 'pickup') {
            button.innerHTML = `🛍️ ${tableIdentifier}`; // Show name with icon
        } else {
            button.innerHTML = `Table ${tableIdentifier}`; // Just show table number
        }
        // --- END NEW ---
        
        button.dataset.tableId = tableIdentifier;
        
        if (tableIdentifier === currentSelectedTable) {
            button.classList.add('selected');
        }
        
        button.addEventListener('click', () => {
            renderBillForTable(tableIdentifier);
        });
        tableListEl.appendChild(button);
    });
}

/**
 * Renders the full bill details for the selected table in the right column.
 */
function renderBillForTable(tableIdentifier) {
    currentSelectedTable = tableIdentifier;
    
    // Highlight the selected button in the left list
    document.querySelectorAll('.table-list-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tableId === tableIdentifier);
    });

    // Get all orders for just this table (dine-in) or customer (pickup)
    const tableOrders = allCookedOrders.filter(order => order.table === tableIdentifier);
    
    if (tableOrders.length === 0) {
        billViewEl.classList.add('hidden');
        currentSelectedTable = null;
        renderTableList(); // Refresh the list
        return;
    }
    
    // --- NEW: Check if this is a pickup order ---
    const isPickup = tableOrders.some(order => order.orderType === 'pickup');

    billViewEl.classList.remove('hidden');
    
    // --- NEW: Add pickup icon to title ---
    if (isPickup) {
        billTableNumberEl.innerHTML = `🛍️ ${tableIdentifier}`; // Show name with icon
    } else {
        billTableNumberEl.innerHTML = `Table ${tableIdentifier}`; // Just show table number
    }
    
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

// --- NEW HELPER FUNCTIONS ---

/**
 * Populates the <datalist> with menu items
 */
function populateDatalist() {
    menuDatalist.innerHTML = ""; // Clear any existing
    MENU_ITEMS.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        menuDatalist.appendChild(option);
    });
}

/**
 * Handles the input event on the item name field.
 * Autofills price if a match is found.
 */
function handleItemSearch() {
    const query = itemNameInput.value;
    // Find a case-insensitive match
    const match = MENU_ITEMS.find(item => item.name.toLowerCase() === query.toLowerCase());
    
    if (match) {
        itemPriceInput.value = match.price.toFixed(2);
    } else {
        itemPriceInput.value = ''; // Clear price if no match
    }
}
