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
const loginOverlay = document.getElementById('records-login-overlay');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('records-password');
const loginError = document.getElementById('login-error');
const contentWrapper = document.getElementById('records-content-wrapper');

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const filterBtn = document.getElementById('filter-btn');
const printBtn = document.getElementById('print-btn');

const totalRevenueEl = document.getElementById('total-revenue');
const totalOrdersEl = document.getElementById('total-orders');
const recordsListEl = document.getElementById('records-list');

const RECORDS_PASSWORD = "jhasvikkitchen"; // Same password for simplicity
let allFetchedRecords = []; // Stores the last filtered results for printing

// --- 4. Login Logic ---
loginButton.addEventListener('click', () => {
    if (passwordInput.value === RECORDS_PASSWORD) {
        loginOverlay.classList.add('hidden');
        contentWrapper.style.opacity = '1'; 
        initializeRecordsPage(); // Start the listener *after* login
    } else {
        loginError.style.display = 'block';
    }
});
passwordInput.addEventListener('keyup', (e) => e.key === 'Enter' && loginButton.click());

/**
 * Sets default dates and adds event listeners
 */
function initializeRecordsPage() {
    connectionIconEl.textContent = '✅'; // Assume connection for now
    
    // Set default dates (e.g., today)
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;

    // Add button listeners
    filterBtn.addEventListener('click', fetchRecords);
    printBtn.addEventListener('click', () => {
        window.print();
    });
}

/**
 * Fetches records from Firebase based on the selected date range.
 */
async function fetchRecords() {
    let startDate = new Date(startDateInput.value + 'T00:00:00');
    let endDate = new Date(endDateInput.value + 'T23:59:59');

    if (isNaN(startDate) || isNaN(endDate)) {
        alert("Please select valid start and end dates.");
        return;
    }

    if (endDate < startDate) {
        alert("End date must be after the start date.");
        return;
    }

    // --- 1-YEAR SAFETY CAP ---
    // Create a date for one year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0); // Set to start of the day

    // Check if the user's start date is *before* the 1-year cap
    if (startDate < oneYearAgo) {
        alert("Cannot fetch data older than 1 year. Setting start date to 1 year ago.");
        startDate = oneYearAgo;
        startDateInput.value = oneYearAgo.toISOString().split('T')[0];
    }
    // --- END SAFETY CAP ---

    filterBtn.disabled = true;
    filterBtn.textContent = "Loading...";
    recordsListEl.innerHTML = "<p>Loading records...</p>";

    try {
        const query = db.collection("archived_orders")
            .where("closedAt", ">=", firebase.firestore.Timestamp.fromDate(startDate))
            .where("closedAt", "<=", firebase.firestore.Timestamp.fromDate(endDate))
            .orderBy("closedAt", "desc"); // Show newest first

        const snapshot = await query.get();
        allFetchedRecords = snapshot.docs.map(doc => doc.data());
        
        renderRecords(allFetchedRecords);
        calculateSummary(allFetchedRecords);

    } catch (error) {
        console.error("Error fetching records: ", error);
        recordsListEl.innerHTML = `<p style="color: red;">Error: ${error.message}. You may need to create a Firestore Index. See console (F12) for details.</p>`;
    } finally {
        filterBtn.disabled = false;
        filterBtn.textContent = "Filter Records";
    }
}

/**
 * Renders the fetched records to the list
 */
function renderRecords(records) {
    recordsListEl.innerHTML = ""; // Clear list

    if (records.length === 0) {
        recordsListEl.innerHTML = "<p>No records found for this date range.</p>";
        return;
    }

    records.forEach(record => {
        const recordDate = record.closedAt.toDate().toLocaleString('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
        
        // Create the expandable list item
        const details = document.createElement('details');
        details.className = 'record-item';

        // Summary (Visible Part)
        const summary = document.createElement('summary');
        summary.className = 'record-summary';
        summary.innerHTML = `
            <span class="record-date">${recordDate}</span>
            <span class="record-table">Table ${record.table}</span>
            <span class="record-total">${record.total.toFixed(2)} €</span>
        `;

        // Details (Hidden Part)
        const itemsList = document.createElement('div');
        itemsList.className = 'record-item-details';
        
        let itemsHtml = '<ul>';
        record.items.forEach(item => {
            itemsHtml += `<li>${item.quantity}x ${item.name} (${item.price.toFixed(2)} €)</li>`;
        });
        itemsHtml += '</ul>';
        itemsList.innerHTML = itemsHtml;

        details.appendChild(summary);
        details.appendChild(itemsList);
        recordsListEl.appendChild(details);
    });
}

/**
 * Calculates and displays the total revenue and order count
 */
function calculateSummary(records) {
    let totalRevenue = 0;
    records.forEach(record => {
        totalRevenue += record.total;
    });

    totalRevenueEl.textContent = `${totalRevenue.toFixed(2)} €`;
    totalOrdersEl.textContent = records.length;
}
