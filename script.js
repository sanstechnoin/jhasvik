// --- 1. ADD THIS CONFIG to the very top ---
const firebaseConfig = {
  apiKey: "AIzaSyCV6u4t8vLDbrEH_FsBrZHXsG8auh-gOP8",
    authDomain: "jhasvik-de.firebaseapp.com",
    projectId: "jhasvik-de",
    storageBucket: "jhasvik-de.firebasestorage.app",
    messagingSenderId: "415679545793",
    appId: "1:415679545793:web:880c5963d930f6ea4bef40"
};

// --- 2. ADD THESE LINES to initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global cart variables
let cart = [];
let appliedCoupon = null;

// --- Main function to load config first ---
document.addEventListener("DOMContentLoaded", async () => {
    
    let config;
    try {
        const response = await fetch('config.json?v=23'); 
        config = await response.json();
    } catch (error) {
        console.error("Failed to load config.json", error);
        config = { promoPopup: {}, coupons: [], whatsappNumber: "", featuredCouponCode: "" };
    }

    // --- 1. Sticky Header Scroll Padding ---
    const header = document.querySelector('header');
    const headerNav = document.querySelector('header nav');
    function updateScrollPadding() {
        if (header) {
            const headerHeight = header.offsetHeight;
            document.documentElement.style.setProperty('scroll-padding-top', `${headerHeight}px`);

            if (headerNav) {
                const navHeight = headerNav.offsetHeight;
                const topPartHeight = headerHeight - navHeight;
                headerNav.style.top = `${topPartHeight}px`;
            }
        }
    }
    updateScrollPadding();
    window.addEventListener('resize', updateScrollPadding);

    // --- 2. Nav Scroller (Fade Effect Logic) ---
    const navLinksContainer = document.getElementById('nav-links-container');
    if (navLinksContainer) {
        const navWrapper = navLinksContainer.closest('.nav-wrapper');
        const updateFadeVisibility = () => {
            if (!navWrapper) return;
            const maxScroll = navLinksContainer.scrollWidth - navLinksContainer.clientWidth;
            navWrapper.classList.toggle('fade-left', navLinksContainer.scrollLeft > 1);
            navWrapper.classList.toggle('fade-right', navLinksContainer.scrollLeft < maxScroll - 1);
        };

        navLinksContainer.addEventListener('scroll', updateFadeVisibility);
        window.addEventListener('resize', updateFadeVisibility);
        if (typeof ResizeObserver === 'function') {
            new ResizeObserver(updateFadeVisibility).observe(navLinksContainer);
        }
        setTimeout(updateFadeVisibility, 100); // Initial check
    }


    // --- 3. DYNAMIC Promotional Popup & Marquee ---
    const promo = config.promoPopup;
    const promoPopup = document.getElementById('popup-overlay');
    const closePromoBtn = document.getElementById('close-popup');
    const marqueeContainer = document.getElementById('marquee-container');
    const marqueeText = document.getElementById('marquee-text');

    function isPromoActive() {
        if (!promo || !promo.startDate || !promo.endDate) return false;
        try {
            const today = new Date();
            const [startYear, startMonth, startDay] = promo.startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = promo.endDate.split('-').map(Number);
            const startDate = new Date(startYear, startMonth - 1, startDay);
            const endDate = new Date(endYear, endMonth - 1, endDay);
            endDate.setHours(23, 59, 59, 999);
            return (today >= startDate && today <= endDate);
        } catch (e) {
            console.error("Error with promo dates:", e);
            return false;
        }
    }

    function showMarquee() {
        if (marqueeText && marqueeContainer && config.marqueeLines && config.marqueeLines.length > 0) {
            marqueeText.innerText = config.marqueeLines.join(" --- "); 
            marqueeContainer.classList.remove('hidden');
            updateScrollPadding(); // Recalculate header height
        }
    }
    
    showMarquee();
    
    if (marqueeContainer) {
        marqueeContainer.addEventListener('mouseover', () => marqueeText.classList.add('paused'));
        marqueeContainer.addEventListener('mouseout', () => marqueeText.classList.remove('paused'));
    }

    if (promoPopup && closePromoBtn) {
        const lastShown = localStorage.getItem('promoLastShown');
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();

        promoPopup.style.display = 'none'; 

        if (isPromoActive() && (!lastShown || (now - lastShown > twentyFourHours))) {
            const line1El = document.getElementById('promo-line-1');
            const line2El = document.getElementById('promo-line-2');
            if (line1El) line1El.innerText = promo.line1;
            if (line2El) line2El.innerText = promo.line2;
            
            setTimeout(() => {
                promoPopup.style.display = 'flex'; 
                localStorage.setItem('promoLastShown', now.toString());
            }, 5000); 
        }

        closePromoBtn.addEventListener('click', () => {
            promoPopup.style.display = 'none'; 
        });
    }

    // --- 4. Shopping Cart Logic (Full Pickup Version) ---
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartItemCountEl = document.getElementById('cart-item-count');

    const subtotalAmountEl = document.getElementById('subtotal-amount');
    const discountAmountEl = document.getElementById('discount-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const summaryDiscountEl = document.getElementById('summary-discount');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponCodeInput = document.getElementById('coupon-code');
    const couponMessageEl = document.getElementById('coupon-message');
    const cartContentEl = document.getElementById('cart-content');
    const orderConfirmationEl = document.getElementById('order-confirmation');
    const confirmationSummaryEl = document.getElementById('confirmation-summary');
    const confirmationCloseBtn = document.getElementById('confirmation-close-btn');
    const couponHintEl = document.getElementById('coupon-hint');

    if (config.featuredCouponCode && couponHintEl) {
        const featuredCoupon = config.coupons.find(c => c.code === config.featuredCouponCode);
        if (featuredCoupon) {
            let hintText = `Use code ${featuredCoupon.code} for ${featuredCoupon.value * 100}% off`;
            if (featuredCoupon.discountType === 'fixed') {
                hintText = `Use code ${featuredCoupon.code} for ${featuredCoupon.value.toFixed(2)}€ off`;
            }
            if (featuredCoupon.minValue > 0) {
                hintText += ` on orders over ${featuredCoupon.minValue.toFixed(2)}€!`;
            }
            couponHintEl.innerText = hintText;
            couponHintEl.classList.remove('hidden');
        }
    }

    const consentCheckbox = document.getElementById('privacy-consent');
    const orderForm = document.getElementById('order-form');
    const emailSubmitBtn = orderForm.querySelector('.checkout-email');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const firebaseBtn = document.getElementById('firebase-btn'); 
    
    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (confirmationCloseBtn) confirmationCloseBtn.addEventListener('click', closeCart);
    
    function openCart() {
        cartContentEl.style.display = 'block'; 
        orderConfirmationEl.style.display = 'none'; 
        cartOverlay.classList.remove('hidden');
        updateCart();
        toggleCheckoutButtons();
    }
    function closeCart() { 
        cartOverlay.classList.add('hidden'); 
        setTimeout(() => {
            cartContentEl.style.display = 'block';
            orderConfirmationEl.style.display = 'none';
        }, 500);
    }

    function toggleCheckoutButtons() {
        const isChecked = consentCheckbox.checked;
        emailSubmitBtn.disabled = !isChecked;
        whatsappBtn.disabled = !isChecked;
        firebaseBtn.disabled = !isChecked;
    }
    consentCheckbox.addEventListener('change', toggleCheckoutButtons);

    function initItemControls() {
        document.querySelectorAll('.add-btn').forEach(button => {
            button.removeEventListener('click', handleAddToCartClick);
            button.addEventListener('click', handleAddToCartClick);
        });
        document.querySelectorAll('.menu-btn-minus').forEach(button => {
            button.removeEventListener('click', handleRemoveFromCartClick);
            button.addEventListener('click', handleRemoveFromCartClick);
        });
    }

    function handleAddToCartClick() {
        const button = this; 
        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = parseFloat(button.dataset.price);
        const category = button.dataset.category;
        addToCart(id, name, price, category);
    }
    
    function handleRemoveFromCartClick() {
        adjustQuantity(this.dataset.id, -1);
    }
    
    initItemControls(); 
    
    function addToCart(id, name, price, category) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name, price, category, quantity: 1 });
        }
        updateCart();
    }

    function updateCart() {
        cartItemsContainer.innerHTML = "";
        let subtotal = 0;
        let itemCount = 0;

        document.querySelectorAll('.item-qty').forEach(qtyEl => {
            const id = qtyEl.dataset.id;
            const item = cart.find(i => i.id === id);
            const controlsDiv = qtyEl.closest('.quantity-controls');
            
            if (item) {
                qtyEl.innerText = item.quantity;
                controlsDiv.classList.remove('hidden');
            } else {
                qtyEl.innerText = '1'; 
                controlsDiv.classList.add('hidden');
            }
        });

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
            appliedCoupon = null;
        }

        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <div class="cart-item-controls">
                    <button class="cart-btn-minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="cart-btn-plus" data-id="${item.id}">+</button>
                </div>
                <span class="cart-item-price">${(item.price * item.quantity).toFixed(2)} €</span>
            `;
            cartItemsContainer.appendChild(itemEl);
            subtotal += item.price * item.quantity;
            itemCount += item.quantity;
        });

        let discountAmount = 0;
        let discountText = "Discount:";

        if (appliedCoupon) {
            let isValid = true;
            let validationMessage = `Code "${appliedCoupon.code}" applied!`;
            let validationClass = 'success';

            const minValue = appliedCoupon.minValue || 0;
            if (subtotal < minValue) {
                isValid = false;
                validationMessage = `Your total is now below ${minValue.toFixed(2)} €. Coupon removed.`;
                validationClass = 'error';
            }

            if (isValid) {
                const category = appliedCoupon.appliesToCategory.toLowerCase();
                if (category !== "all") {
                    const hasMatchingItem = cart.some(item => item.category.toLowerCase() === category);
                    if (!hasMatchingItem) {
                        isValid = false;
                        validationMessage = `Coupon removed (no matching items in cart).`;
                        validationClass = 'error';
                    }
                }
            }

            if (isValid) {
                couponMessageEl.innerText = validationMessage;
                couponMessageEl.className = validationClass;
                
                let discountableSubtotal = 0;
                const category = appliedCoupon.appliesToCategory.toLowerCase();

                if (category === "all") {
                    discountableSubtotal = subtotal;
                } else {
                    cart.forEach(item => {
                        if (item.category.toLowerCase() === category) {
                            discountableSubtotal += item.price * item.quantity;
                        }
                    });
                }

                if (appliedCoupon.discountType === 'fixed') {
                     let applicableItems = 0;
                    cart.forEach(item => {
                        if (item.category.toLowerCase() === category) {
                            applicableItems += item.quantity;
                        }
                    });
                    discountAmount = appliedCoupon.value * applicableItems;
                    discountText = `Discount (${appliedCoupon.code})`;
                } 
                else if (appliedCoupon.discountType === 'percent') {
                    discountAmount = discountableSubtotal * appliedCoupon.value;
                    discountText = `Discount (${(appliedCoupon.value * 100).toFixed(0)}%)`;
                }
                
                discountAmount = Math.min(subtotal, discountAmount);
            } else {
                appliedCoupon = null;
                couponMessageEl.innerText = validationMessage;
                couponMessageEl.className = validationClass;
            }
        }
        
        if (discountAmount > 0) {
            summaryDiscountEl.classList.remove('hidden');
            summaryDiscountEl.querySelector('span').innerText = discountText;
            discountAmountEl.innerText = `-${discountAmount.toFixed(2)} €`;
        } else {
            summaryDiscountEl.classList.add('hidden');
            if (couponMessageEl.className === "success") {
                 couponMessageEl.innerText = "";
                 couponCodeInput.value = "";
            }
        }
        
        let total = subtotal - discountAmount;

        subtotalAmountEl.innerText = `${subtotal.toFixed(2)} €`;
        totalAmountEl.innerText = `${total.toFixed(2)} €`;
        cartItemCountEl.innerText = itemCount;
        
        cartToggleBtn.classList.toggle('hidden', itemCount === 0);
        addCartItemControls();
    }

    function addCartItemControls() {
        document.querySelectorAll('.cart-btn-plus').forEach(btn => {
            btn.addEventListener('click', () => adjustQuantity(btn.dataset.id, 1));
        });
        document.querySelectorAll('.cart-btn-minus').forEach(btn => {
            btn.addEventListener('click', () => adjustQuantity(btn.dataset.id, -1));
        });
    }

    function adjustQuantity(id, amount) {
        const item = cart.find(item => item.id === id);
        if (!item) return;
        item.quantity += amount;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
        updateCart();
    }

    // --- 5. Coupon Logic ---
    applyCouponBtn.addEventListener('click', () => {
        const code = couponCodeInput.value.trim().toUpperCase();
        const coupon = config.coupons.find(c => c.code.toUpperCase() === code);

        appliedCoupon = null;
        couponMessageEl.innerText = "";
        couponMessageEl.className = "";

        if (coupon) {
            let currentSubtotal = 0;
            cart.forEach(item => {
                currentSubtotal += item.price * item.quantity;
            });
            const minValue = coupon.minValue || 0;
            if (currentSubtotal < minValue) {
                couponMessageEl.innerText = `You must spend at least ${minValue.toFixed(2)} € to use this code.`;
                couponMessageEl.className = 'error';
                updateCart();
                return;
            }
            
            const category = coupon.appliesToCategory.toLowerCase();
            if (category !== "all") {
                const hasMatchingItem = cart.some(item => item.category.toLowerCase() === category);
                if (!hasMatchingItem) {
                    couponMessageEl.innerText = `You need a '${category}' item to use this code.`;
                    couponMessageEl.className = 'error';
                    updateCart();
                    return;
                }
            }

            appliedCoupon = coupon;
            couponMessageEl.innerText = `Code "${coupon.code}" applied!`;
            couponMessageEl.className = 'success';
        } else {
            couponMessageEl.innerText = "Invalid code.";
            couponMessageEl.className = 'error';
        }
        updateCart();
    });
    
    // --- 6. Helper function to build the order data ---
    function getOrderData() {
        const { summaryText, total, discountText, itemsOnly } = generateOrderSummary();
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const customerNotes = document.getElementById('customer-notes').value;
        
        if (!customerName || !customerPhone) {
            alert("Please enter your name and phone number.");
            return null; // Return null if validation fails
        }

        const orderId = `pickup-${new Date().getTime()}`;
        const orderData = {
            id: orderId,
            table: customerName, // Use customer name as the "table" identifier
            customerName: customerName,
            customerPhone: customerPhone, // <-- ADDED PHONE
            notes: customerNotes || null, // <-- ADDED NOTES
            items: itemsOnly,
            status: "new",
            orderType: "pickup", 
            createdAt: new Date()
        };
        
        const summary = {
            summaryText,
            total,
            discountText,
            customerName,
            customerPhone,
            customerNotes
        };
        
        return { orderData, summary };
    }
    
    // --- 7. Helper function to show confirmation ---
    function showConfirmationScreen(summary) {
        let finalSummary = `Customer: ${summary.customerName}\nPhone: ${summary.customerPhone}\n\n${summary.summaryText}\n${summary.discountText}Total: ${summary.total.toFixed(2)} €`;
        if (summary.customerNotes) {
            finalSummary += `\n\nNotes:\n${summary.customerNotes}`;
        }
        
        confirmationSummaryEl.innerText = finalSummary;
        cartContentEl.style.display = 'none'; 
        orderConfirmationEl.style.display = 'block'; 
        cart = [];
        appliedCoupon = null;
        orderForm.reset();
        consentCheckbox.checked = false;
        updateCart();
    }


    // --- 8. Checkout Logic (Email) ---
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const orderPayload = getOrderData();
        if (!orderPayload) return; // Validation failed
        
        const { orderData, summary } = orderPayload;

        // Save to Firebase
        db.collection("orders").doc(orderData.id).set(orderData)
            .catch(e => console.error("Could not save order to Firebase KDS", e));

        // Fill Formbold hidden fields
        document.getElementById('order-details-input').value = `${summary.summaryText}\n${summary.discountText}`;
        document.getElementById('order-total-input').value = `${summary.total.toFixed(2)} €`;

        const formData = new FormData(orderForm);
        emailSubmitBtn.innerText = "Sending...";
        emailSubmitBtn.disabled = true;

        fetch(orderForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                showConfirmationScreen(summary);
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        alert(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        alert("Error sending order. Please try again later.");
                    }
                });
            }
        }).catch(error => {
            alert("Error sending order. Please check your internet connection.");
        }).finally(() => {
            emailSubmitBtn.innerText = "Send via Email";
            toggleCheckoutButtons();
        });
    });

    // --- 9. Kitchen Button (Firebase Only) ---
    firebaseBtn.addEventListener('click', async () => {
        const orderPayload = getOrderData();
        if (!orderPayload) return; // Validation failed
        
        const { orderData, summary } = orderPayload;

        firebaseBtn.innerText = "Sending...";
        firebaseBtn.disabled = true;

        try {
            await db.collection("orders").doc(orderData.id).set(orderData);
            showConfirmationScreen(summary);
        } catch (error) {
            console.error("Error sending order to Firebase: ", error);
            alert("Error sending order. Please try again or call a waiter.");
        } finally {
            firebaseBtn.innerText = "Send to Kitchen (Live)";
            toggleCheckoutButtons();
        }
    });

    // --- 10. WhatsApp Submit ---
    whatsappBtn.addEventListener('click', () => {
        const orderPayload = getOrderData();
        if (!orderPayload) return; // Validation failed
        
        const { orderData, summary } = orderPayload;
        
        // Save to Firebase
        db.collection("orders").doc(orderData.id).set(orderData)
            .catch(e => console.error("Could not save order to Firebase KDS", e));
        
        const WHATSAPP_NUMBER = config.whatsappNumber;
        if (!WHATSAPP_NUMBER) {
            alert("WhatsApp number is not configured.");
            return;
        }

        let whatsappMessage = `*New Pickup Order*\n\n*Customer:* ${summary.customerName}\n*Phone:* ${summary.customerPhone}\n\n*Order:*\n${summary.summaryText}\n${summary.discountText}*Total: ${summary.total.toFixed(2)} €*`;
        
        if (summary.customerNotes) {
            whatsappMessage += `\n\n*Notes:*\n${summary.customerNotes}`;
        }

        let encodedMessage = encodeURIComponent(whatsappMessage);
        let whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    });

    // --- 11. GenerateOrderSummary (Your existing function, unchanged) ---
    function generateOrderSummary() {
        let summaryText = "";
        let subtotal = 0;
        let itemsOnly = [];
        
        cart.forEach(item => {
            summaryText += `${item.quantity}x ${item.name} (${(item.price * item.quantity).toFixed(2)} €)\n`;
            subtotal += item.price * item.quantity;
            
            itemsOnly.push({
                quantity: item.quantity,
                name: item.name,
                price: item.price
            });
        });

        let discountAmount = 0;
        let discountText = "";
        if (appliedCoupon) {
            let discountableSubtotal = 0;
            const category = appliedCoupon.appliesToCategory.toLowerCase();

            if (category === "all") {
                discountableSubtotal = subtotal;
            } else {
                cart.forEach(item => {
                    if (item.category.toLowerCase() === category) {
                        discountableSubtotal += item.price * item.quantity;
                    }
                });
            }

            if (appliedCoupon.discountType === 'fixed') {
                 let applicableItems = 0;
                cart.forEach(item => {
                    if (item.category.toLowerCase() === category) {
                        applicableItems += item.quantity;
                    }
                });
                discountAmount = appliedCoupon.value * applicableItems;
                discountText = `Discount (${appliedCoupon.code})`;
            } 
            else if (appliedCoupon.discountType === 'percent') {
                discountAmount = discountableSubtotal * appliedCoupon.value;
                discountText = `Discount (${(appliedCoupon.value * 100).toFixed(0)}%)`;
            }
            discountAmount = Math.min(subtotal, discountAmount);
            
            if(discountAmount > 0) {
                 discountText = `Discount (${appliedCoupon.code}): -${discountAmount.toFixed(2)} €\n`;
            }
        }
        
        let total = subtotal - discountAmount;
        
        return { summaryText, subtotal, discountText, total, itemsOnly };
    }
    
    // Initial check on page load
    toggleCheckoutButtons();
});
