// Order Management System
class OrderManager {
    constructor() {
        this.orders = [];
        this.workerPayments = [];
        this.selectedOrderId = null;
        this.deleteOrderId = null;
        this.currentMonth = new Date();
        this.activeTab = 'orders';
        this.selectedStatus = 'all';
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadSampleData();
        this.render();
    }

    initializeApp() {
        this.loadFromStorage();
        this.updateTodayDate();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add Order Modal
        document.getElementById('btnAddOrder').addEventListener('click', () => {
            this.openAddOrderModal();
        });

        // Add Worker Payment Modal
        document.getElementById('btnLogWork').addEventListener('click', () => {
            this.openWorkerPaymentModal();
        });

        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Order Form Submit
        document.getElementById('orderForm').addEventListener('submit', (e) => {
            this.handleOrderSubmit(e);
        });

        // Worker Payment Form Submit
        document.getElementById('workerPaymentForm').addEventListener('submit', (e) => {
            this.handleWorkerPaymentSubmit(e);
        });

        // Auto-calculate Total
        ['embroideryPrice', 'sewingPrice', 'gemsPrice', 'fabricPrice', 'extraPrice'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.calculateTotal();
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterOrders();
        });

        // Status Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedStatus = e.target.dataset.status;
                this.filterOrders();
            });
        });

        // Calendar Navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });

        // Delete Modal Buttons
        document.getElementById('btnConfirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('btnCancelDelete').addEventListener('click', () => {
            document.getElementById('deleteModal').classList.remove('active');
        });

        // Paid Checkbox
        document.getElementById('isPaid').addEventListener('change', (e) => {
            const container = document.getElementById('paidDateContainer');
            const datePaidInput = document.getElementById('datePaid');
            if (e.target.checked) {
                container.style.display = 'block';
                datePaidInput.value = new Date().toISOString().split('T')[0];
            } else {
                container.style.display = 'none';
                datePaidInput.value = '';
            }
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Render appropriate content
        if (tabName === 'calendar') {
            this.renderCalendar();
        } else if (tabName === 'worker') {
            this.renderWorkerPayments();
        } else {
            this.filterOrders();
        }
    }

    openAddOrderModal() {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('orderForm').reset();
        document.getElementById('dueDate').value = today;
        document.getElementById('modalTitle').textContent = 'Add New Order';
        document.getElementById('orderForm').dataset.orderId = '';
        document.getElementById('orderModal').classList.add('active');
    }

    openEditOrderModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('modalTitle').textContent = 'Edit Order';
        document.getElementById('clientName').value = order.clientName;
        document.getElementById('phoneNumber').value = order.phoneNumber;
        document.getElementById('bust').value = order.measurements.bust || '';
        document.getElementById('waist').value = order.measurements.waist || '';
        document.getElementById('height').value = order.measurements.height || '';
        document.getElementById('embroideryPrice').value = order.pricing.embroidery || '';
        document.getElementById('sewingPrice').value = order.pricing.sewing || '';
        document.getElementById('gemsPrice').value = order.pricing.gems || '';
        document.getElementById('fabricPrice').value = order.pricing.fabric || '';
        document.getElementById('extraPrice').value = order.pricing.extra || '';
        document.getElementById('prepayment').value = order.prepayment || '';
        document.getElementById('total').value = order.total || '';
        document.getElementById('dueDate').value = order.dueDate;
        document.getElementById('status').value = order.status;
        
        document.getElementById('orderForm').dataset.orderId = orderId;
        document.getElementById('orderModal').classList.add('active');
    }

    calculateTotal() {
        const embroidery = parseFloat(document.getElementById('embroideryPrice').value) || 0;
        const sewing = parseFloat(document.getElementById('sewingPrice').value) || 0;
        const gems = parseFloat(document.getElementById('gemsPrice').value) || 0;
        const fabric = parseFloat(document.getElementById('fabricPrice').value) || 0;
        const extra = parseFloat(document.getElementById('extraPrice').value) || 0;

        const total = embroidery + sewing + gems + fabric + extra;
        document.getElementById('total').value = total.toFixed(2);
    }

    calculateWorkOnDate(createdDate) {
        let workDate = new Date(createdDate);
        workDate.setDate(workDate.getDate() + 1);

        // Skip Fridays
        while (workDate.getDay() === 5) {
            workDate.setDate(workDate.getDate() + 1);
        }

        return workDate.toISOString().split('T')[0];
    }

    handleOrderSubmit(e) {
        e.preventDefault();

        const clientName = document.getElementById('clientName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const bust = parseFloat(document.getElementById('bust').value) || 0;
        const waist = parseFloat(document.getElementById('waist').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        const embroidery = parseFloat(document.getElementById('embroideryPrice').value) || 0;
        const sewing = parseFloat(document.getElementById('sewingPrice').value) || 0;
        const gems = parseFloat(document.getElementById('gemsPrice').value) || 0;
        const fabric = parseFloat(document.getElementById('fabricPrice').value) || 0;
        const extra = parseFloat(document.getElementById('extraPrice').value) || 0;
        const prepayment = parseFloat(document.getElementById('prepayment').value) || 0;
        const total = parseFloat(document.getElementById('total').value) || 0;
        const dueDate = document.getElementById('dueDate').value;
        const status = document.getElementById('status').value;

        const today = new Date().toISOString().split('T')[0];
        const workOnDate = this.calculateWorkOnDate(today);

        const orderId = document.getElementById('orderForm').dataset.orderId;

        if (orderId) {
            // Edit existing order
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex] = {
                    id: orderId,
                    clientName,
                    phoneNumber,
                    measurements: { bust, waist, height },
                    pricing: { embroidery, sewing, gems, fabric, extra },
                    prepayment,
                    total,
                    createdDate: this.orders[orderIndex].createdDate,
                    workOnDate: this.orders[orderIndex].workOnDate,
                    dueDate,
                    status
                };
            }
        } else {
            // Add new order
            const newOrder = {
                id: Date.now().toString(),
                clientName,
                phoneNumber,
                measurements: { bust, waist, height },
                pricing: { embroidery, sewing, gems, fabric, extra },
                prepayment,
                total,
                createdDate: today,
                workOnDate,
                dueDate,
                status
            };
            this.orders.push(newOrder);
        }

        this.saveToStorage();
        document.getElementById('orderModal').classList.remove('active');
        this.filterOrders();
    }

    openWorkerPaymentModal() {
        document.getElementById('workerPaymentForm').reset();
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('datePaid').value = '';
        document.getElementById('paidDateContainer').style.display = 'none';
        document.getElementById('isPaid').checked = false;

        // Populate dress select
        const dressSelect = document.getElementById('dressSelect');
        dressSelect.innerHTML = '<option value="">Select a dress...</option>';

        const completedOrders = this.orders.filter(o => o.status !== 'Done');
        completedOrders.forEach(order => {
            const option = document.createElement('option');
            option.value = order.id;
            option.textContent = `${order.clientName} - ${order.status}`;
            dressSelect.appendChild(option);
        });

        document.getElementById('workerPaymentModal').classList.add('active');
    }

    handleWorkerPaymentSubmit(e) {
        e.preventDefault();

        const dressId = document.getElementById('dressSelect').value;
        const workerName = document.getElementById('workerName').value;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const isPaid = document.getElementById('isPaid').checked;
        const datePaid = isPaid ? document.getElementById('datePaid').value : null;

        const newPayment = {
            id: Date.now().toString(),
            dressId,
            workerName,
            paymentAmount,
            loggedDate: new Date().toISOString().split('T')[0],
            isPaid,
            datePaid
        };

        this.workerPayments.push(newPayment);
        this.saveToStorage();
        document.getElementById('workerPaymentModal').classList.remove('active');
        this.renderWorkerPayments();
    }

    deleteOrder(orderId) {
        this.deleteOrderId = orderId;
        const order = this.orders.find(o => o.id === orderId);
        document.getElementById('deleteMessage').textContent = `Delete order for ${order.clientName}? This cannot be undone.`;
        document.getElementById('deleteModal').classList.add('active');
    }

    confirmDelete() {
        this.orders = this.orders.filter(o => o.id !== this.deleteOrderId);
        this.saveToStorage();
        document.getElementById('deleteModal').classList.remove('active');
        this.filterOrders();
    }

    deleteWorkerPayment(paymentId) {
        this.workerPayments = this.workerPayments.filter(p => p.id !== paymentId);
        this.saveToStorage();
        this.renderWorkerPayments();
    }

    markPaymentAsPaid(paymentId) {
        const payment = this.workerPayments.find(p => p.id === paymentId);
        if (payment) {
            payment.isPaid = true;
            payment.datePaid = new Date().toISOString().split('T')[0];
            this.saveToStorage();
            this.renderWorkerPayments();
        }
    }

    filterOrders() {
        let filtered = this.orders;

        // Filter by status
        if (this.selectedStatus !== 'all') {
            filtered = filtered.filter(o => o.status === this.selectedStatus);
        }

        // Filter by search
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(o => 
                o.clientName.toLowerCase().includes(searchTerm) ||
                o.phoneNumber.includes(searchTerm)
            );
        }

        this.renderOrders(filtered);
    }

    renderOrders(ordersToShow) {
        const container = document.getElementById('ordersContainer');
        
        if (ordersToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No orders found</div>
                    <div class="empty-state-subtext">Add a new order to get started</div>
                </div>
            `;
            return;
        }

        const statusGroups = {
            'Cutting': [],
            'Sewing': [],
            'Embroidery': [],
            'Gems': [],
            'Done': []
        };

        ordersToShow.forEach(order => {
            statusGroups[order.status].push(order);
        });

        let html = '';

        Object.entries(statusGroups).forEach(([status, orders]) => {
            if (orders.length === 0) return;

            const statusEmoji = {
                'Cutting': '✂️',
                'Sewing': '🧵',
                'Embroidery': '✨',
                'Gems': '💎',
                'Done': '✅'
            }[status];

            html += `<div class="status-section">
                <div class="status-title ${status.toLowerCase()}">${statusEmoji} ${status}</div>
            `;

            orders.forEach(order => {
                const balance = order.total - order.prepayment;
                const statusClass = status.toLowerCase();

                html += `
                    <div class="order-card ${statusClass}">
                        <div class="order-header">
                            <div class="client-info">
                                <div class="client-name">👗 ${order.clientName}</div>
                                <div class="client-phone">📞 ${order.phoneNumber}</div>
                                <div class="order-date">Created: ${this.formatDate(order.createdDate)}</div>
                            </div>
                        </div>

                        ${order.measurements.bust || order.measurements.waist || order.measurements.height ? `
                            <div class="measurements">
                                ${order.measurements.bust ? `<span class="measurement"><span class="measurement-label">Bust:</span> ${order.measurements.bust}cm</span>` : ''}
                                ${order.measurements.waist ? `<span class="measurement"><span class="measurement-label">Waist:</span> ${order.measurements.waist}cm</span>` : ''}
                                ${order.measurements.height ? `<span class="measurement"><span class="measurement-label">Height:</span> ${order.measurements.height}cm</span>` : ''}
                            </div>
                        ` : ''}

                        <div class="price-breakdown">
                            ${order.pricing.embroidery ? `<div class="price-row"><span class="price-label">Embroidery</span><span class="price-value">$${order.pricing.embroidery.toFixed(2)}</span></div>` : ''}
                            ${order.pricing.sewing ? `<div class="price-row"><span class="price-label">Sewing</span><span class="price-value">$${order.pricing.sewing.toFixed(2)}</span></div>` : ''}
                            ${order.pricing.gems ? `<div class="price-row"><span class="price-label">Gems</span><span class="price-value">$${order.pricing.gems.toFixed(2)}</span></div>` : ''}
                            ${order.pricing.fabric ? `<div class="price-row"><span class="price-label">Fabric</span><span class="price-value">$${order.pricing.fabric.toFixed(2)}</span></div>` : ''}
                            ${order.pricing.extra ? `<div class="price-row"><span class="price-label">Extra</span><span class="price-value">$${order.pricing.extra.toFixed(2)}</span></div>` : ''}
                            <div class="price-row total-row">
                                <span class="price-label">Total</span>
                                <span class="price-value">$${order.total.toFixed(2)}</span>
                            </div>
                            <div class="price-row">
                                <span class="price-label">Prepayment</span>
                                <span class="price-value">$${order.prepayment.toFixed(2)}</span>
                            </div>
                            <div class="price-row">
                                <span class="price-label">Balance Due</span>
                                <span class="price-value balance-due">$${balance.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="work-on-date">
                            <div class="work-on-date-label">📅 Work On Date</div>
                            <div class="work-on-date-value">${this.formatDate(order.workOnDate)}</div>
                        </div>

                        <div class="dates-info">
                            <div class="date-item">
                                <span class="date-label">📆 Due Date</span>
                                <span class="date-value">${this.formatDate(order.dueDate)}</span>
                            </div>
                            <div class="date-item">
                                <span class="date-label">📅 Created</span>
                                <span class="date-value">${this.formatDate(order.createdDate)}</span>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button class="btn-edit" onclick="orderManager.openEditOrderModal('${order.id}')">✏️ Edit</button>
                            <button class="btn-delete" onclick="orderManager.deleteOrder('${order.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        });

        container.innerHTML = html;
    }

    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

        // Create calendar
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let calendarHTML = '<table class="calendar"><thead><tr>';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            calendarHTML += `<th>${day}</th>`;
        });
        calendarHTML += '</tr></thead><tbody><tr>';

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<td></td>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isFriday = date.getDay() === 5;

            // Get orders due on this day
            const ordersOnDay = this.orders.filter(o => o.dueDate === dateStr);
            const workOnDay = this.orders.filter(o => o.workOnDate === dateStr);

            let cellContent = `<div class="calendar-day">${day}</div>`;

            if (isFriday) {
                cellContent += '<div style="font-size: 10px; color: #95a5a6; font-weight: 600;">OFF</div>';
            } else {
                cellContent += `<div class="calendar-capacity ${workOnDay.length >= 3 ? 'full' : ''}">${workOnDay.length}/3</div>`;
            }

            // Add markers for orders
            if (ordersOnDay.length > 0 || workOnDay.length > 0) {
                cellContent += '<div class="calendar-markers">';
                const allOrders = [...new Set([...ordersOnDay, ...workOnDay])];
                allOrders.forEach(order => {
                    cellContent += `<div class="marker ${order.status.toLowerCase()}"></div>`;
                });
                cellContent += '</div>';
            }

            const cellClass = isFriday ? 'calendar-off' : '';
            calendarHTML += `<td class="${cellClass}" onclick="orderManager.showDayOrders('${dateStr}')">${cellContent}</td>`;

            // New row after Saturday
            if ((day + startingDayOfWeek) % 7 === 0 && day < daysInMonth) {
                calendarHTML += '</tr><tr>';
            }
        }

        // Empty cells after last day
        const totalCells = (daysInMonth + startingDayOfWeek);
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            calendarHTML += '<td></td>';
        }

        calendarHTML += '</tr></tbody></table>';
        document.getElementById('calendar').innerHTML = calendarHTML;
    }

    showDayOrders(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        const formattedDate = `${dayName}, ${this.formatDate(dateStr)}`;

        const dueOrders = this.orders.filter(o => o.dueDate === dateStr);
        const workOrders = this.orders.filter(o => o.workOnDate === dateStr);

        let html = `<div class="day-orders-header">📅 ${formattedDate}</div>`;

        if (workOrders.length > 0) {
            html += '<div style="margin-bottom: 15px;"><div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px;">🔧 Work Days (${workOrders.length}/3):</div>';
            workOrders.forEach(order => {
                html += `<div style="background-color: #e3f2fd; padding: 8px; border-radius: 6px; margin-bottom: 6px; font-size: 12px;">
                    <strong>${order.clientName}</strong> - ${order.status}
                </div>`;
            });
            html += '</div>';
        }

        if (dueOrders.length > 0) {
            html += '<div><div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px;">📦 Due Today:</div>';
            dueOrders.forEach(order => {
                html += `<div style="background-color: #fff3cd; padding: 8px; border-radius: 6px; margin-bottom: 6px; font-size: 12px;">
                    <strong>${order.clientName}</strong> - ${order.status}
                </div>`;
            });
            html += '</div>';
        }

        if (workOrders.length === 0 && dueOrders.length === 0) {
            html += '<div class="empty-state"><div class="empty-state-subtext">No orders for this day</div></div>';
        }

        document.getElementById('dayOrdersContainer').innerHTML = html;
    }

    renderWorkerPayments() {
        const container = document.getElementById('workerPaymentsContainer');

        if (this.workerPayments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👷</div>
                    <div class="empty-state-text">No worker payments logged</div>
                    <div class="empty-state-subtext">Start logging worker payments</div>
                </div>
            `;
            return;
        }

        let html = '';

        this.workerPayments.forEach(payment => {
            const dress = this.orders.find(o => o.id === payment.dressId);
            const dressName = dress ? dress.clientName : 'Unknown Dress';

            html += `
                <div class="worker-payment-card">
                    <div class="payment-header">
                        <div>
                            <div class="payment-worker-name">👷 ${payment.workerName}</div>
                            <div style="font-size: 11px; color: #7f8c8d;">Logged: ${this.formatDate(payment.loggedDate)}</div>
                        </div>
                        <div class="payment-status ${payment.isPaid ? 'paid' : 'unpaid'}">
                            ${payment.isPaid ? '✅ PAID' : '⏳ PENDING'}
                        </div>
                    </div>

                    <div class="payment-dress-info">
                        <div class="payment-dress-label">👗 Dress</div>
                        <div class="payment-dress-name">${dressName}</div>
                    </div>

                    <div class="payment-info">
                        <div class="payment-item">
                            <div class="payment-item-label">Payment Amount</div>
                            <div class="payment-item-value">$${payment.paymentAmount.toFixed(2)}</div>
                        </div>
                        ${payment.isPaid ? `
                            <div class="payment-item">
                                <div class="payment-item-label">Date Paid</div>
                                <div class="payment-item-value">${this.formatDate(payment.datePaid)}</div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="payment-actions">
                        ${!payment.isPaid ? `
                            <button class="btn-mark-paid" onclick="orderManager.markPaymentAsPaid('${payment.id}')">💰 Mark as Paid</button>
                        ` : `
                            <button class="btn-mark-paid" disabled>✅ Paid</button>
                        `}
                        <button class="btn-delete-payment" onclick="orderManager.deleteWorkerPayment('${payment.id}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateTodayDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        document.getElementById('todayDate').textContent = formattedDate;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const options = { month: 'short', day: 'numeric', year: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    loadSampleData() {
        if (this.orders.length === 0) {
            const today = new Date();
            
            const sampleOrders = [
                {
                    id: '1',
                    clientName: 'Sarah Johnson',
                    phoneNumber: '555-0101',
                    measurements: { bust: 90, waist: 70, height: 165 },
                    pricing: { embroidery: 50, sewing: 80, gems: 30, fabric: 40, extra: 0 },
                    prepayment: 100,
                    total: 200,
                    createdDate: this.getDateStr(today, -5),
                    workOnDate: this.getDateStr(today, -4),
                    dueDate: this.getDateStr(today, 2),
                    status: 'Cutting'
                },
                {
                    id: '2',
                    clientName: 'Maria Garcia',
                    phoneNumber: '555-0102',
                    measurements: { bust: 88, waist: 68, height: 162 },
                    pricing: { embroidery: 60, sewing: 90, gems: 40, fabric: 50, extra: 20 },
                    prepayment: 150,
                    total: 260,
                    createdDate: this.getDateStr(today, -3),
                    workOnDate: this.getDateStr(today, -2),
                    dueDate: this.getDateStr(today, 5),
                    status: 'Sewing'
                },
                {
                    id: '3',
                    clientName: 'Lisa Chen',
                    phoneNumber: '555-0103',
                    measurements: { bust: 92, waist: 72, height: 168 },
                    pricing: { embroidery: 70, sewing: 85, gems: 50, fabric: 45, extra: 10 },
                    prepayment: 120,
                    total: 260,
                    createdDate: this.getDateStr(today, -2),
                    workOnDate: this.getDateStr(today, -1),
                    dueDate: this.getDateStr(today, 3),
                    status: 'Embroidery'
                },
                {
                    id: '4',
                    clientName: 'Emma Wilson',
                    phoneNumber: '555-0104',
                    measurements: { bust: 85, waist: 65, height: 160 },
                    pricing: { embroidery: 55, sewing: 75, gems: 35, fabric: 40, extra: 15 },
                    prepayment: 110,
                    total: 220,
                    createdDate: this.getDateStr(today, -1),
                    workOnDate: this.getDateStr(today, 0),
                    dueDate: this.getDateStr(today, 4),
                    status: 'Gems'
                },
                {
                    id: '5',
                    clientName: 'Jessica Brown',
                    phoneNumber: '555-0105',
                    measurements: { bust: 91, waist: 71, height: 167 },
                    pricing: { embroidery: 65, sewing: 80, gems: 45, fabric: 50, extra: 5 },
                    prepayment: 140,
                    total: 245,
                    createdDate: this.getDateStr(today, -4),
                    workOnDate: this.getDateStr(today, -3),
                    dueDate: this.getDateStr(today, 1),
                    status: 'Done'
                },
                {
                    id: '6',
                    clientName: 'Amanda Martinez',
                    phoneNumber: '555-0106',
                    measurements: { bust: 89, waist: 69, height: 164 },
                    pricing: { embroidery: 50, sewing: 85, gems: 40, fabric: 45, extra: 0 },
                    prepayment: 130,
                    total: 220,
                    createdDate: this.getDateStr(today, 0),
                    workOnDate: this.getDateStr(today, 1),
                    dueDate: this.getDateStr(today, 6),
                    status: 'Cutting'
                },
                {
                    id: '7',
                    clientName: 'Rachel White',
                    phoneNumber: '555-0107',
                    measurements: { bust: 87, waist: 67, height: 163 },
                    pricing: { embroidery: 60, sewing: 80, gems: 50, fabric: 50, extra: 10 },
                    prepayment: 150,
                    total: 250,
                    createdDate: this.getDateStr(today, 1),
                    workOnDate: this.getDateStr(today, 2),
                    dueDate: this.getDateStr(today, 7),
                    status: 'Sewing'
                },
                {
                    id: '8',
                    clientName: 'Nicole Taylor',
                    phoneNumber: '555-0108',
                    measurements: { bust: 93, waist: 73, height: 169 },
                    pricing: { embroidery: 70, sewing: 90, gems: 55, fabric: 55, extra: 20 },
                    prepayment: 160,
                    total: 290,
                    createdDate: this.getDateStr(today, 2),
                    workOnDate: this.getDateStr(today, 3),
                    dueDate: this.getDateStr(today, 8),
                    status: 'Embroidery'
                }
            ];

            this.orders = sampleOrders;
            this.saveToStorage();
        }
    }

    getDateStr(date, daysOffset) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + daysOffset);
        
        // Skip Fridays for work on dates
        while (newDate.getDay() === 5 && daysOffset >= 0) {
            newDate.setDate(newDate.getDate() + 1);
        }
        
        return newDate.toISOString().split('T')[0];
    }

    saveToStorage() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
        localStorage.setItem('workerPayments', JSON.stringify(this.workerPayments));
    }

    loadFromStorage() {
        const orders = localStorage.getItem('orders');
        const payments = localStorage.getItem('workerPayments');

        if (orders) {
            this.orders = JSON.parse(orders);
        }

        if (payments) {
            this.workerPayments = JSON.parse(payments);
        }
    }

    render() {
        this.filterOrders();
    }
}

// Global variable for onclick handlers
let orderManager;

document.addEventListener('DOMContentLoaded', () => {
    orderManager = new OrderManager();
});
