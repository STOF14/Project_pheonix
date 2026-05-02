const GROCERY_STORAGE_KEYS = {
    budgets: 'groceryBudget.v1',
    entries: 'groceryEntries.v1',
    products: 'groceryProducts.v1',
    plans: 'groceryPlans.v1'
};

function groceryBudgetGetState() {
    const rawProducts = window.ProjectPhoenixUtils.getStoredJson(GROCERY_STORAGE_KEYS.products, {});
    const migratedProducts = {};
    Object.entries(rawProducts).forEach(function(entry) {
        const productKey = entry[0];
        const product = entry[1] || {};
        const normalizedKey = groceryBudgetNormalizeName(product.displayName || product.name || productKey);
        migratedProducts[normalizedKey] = {
            key: normalizedKey,
            displayName: product.displayName || product.name || productKey,
            category: product.category || 'Uncategorized',
            brand: product.brand || '',
            unit: product.unit || '',
            description: product.description || '',
            tags: Array.isArray(product.tags) ? product.tags : [],
            estimatedDaysSupply: product.estimatedDaysSupply || null,
            vatExempt: Boolean(product.vatExempt),
            isStaple: Boolean(product.isStaple),
            timesPurchased: Number(product.timesPurchased || 0),
            totalPaid: Number(product.totalPaid || 0),
            avgPaid: Number(product.avgPaid || product.totalPaid || 0),
            lastPaid: Number(product.lastPaid || product.avgPaid || product.totalPaid || 0)
        };
    });
    return {
        budgets: window.ProjectPhoenixUtils.getStoredJson(GROCERY_STORAGE_KEYS.budgets, {}),
        entries: window.ProjectPhoenixUtils.getStoredJson(GROCERY_STORAGE_KEYS.entries, []),
        products: migratedProducts,
        plans: window.ProjectPhoenixUtils.getStoredJson(GROCERY_STORAGE_KEYS.plans, {})
    };
}

function groceryBudgetSaveState(state) {
    window.ProjectPhoenixUtils.setStoredJson(GROCERY_STORAGE_KEYS.budgets, state.budgets);
    window.ProjectPhoenixUtils.setStoredJson(GROCERY_STORAGE_KEYS.entries, state.entries);
    window.ProjectPhoenixUtils.setStoredJson(GROCERY_STORAGE_KEYS.products, state.products);
    window.ProjectPhoenixUtils.setStoredJson(GROCERY_STORAGE_KEYS.plans, state.plans);
}

function groceryBudgetRandId() {
    return `g_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function groceryBudgetMonthKeyFromDate(dateStr) {
    if (!dateStr || dateStr.length < 7) {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${now.getFullYear()}-${month}`;
    }
    return dateStr.slice(0, 7);
}

function groceryBudgetFormatCurrency(value) {
    const num = Number(value || 0);
    return `R${num.toFixed(2)}`;
}

function groceryBudgetNormalizeName(name) {
    return String(name || '').trim().toLowerCase();
}

function groceryBudgetBuildProductRecord(item) {
    const displayName = item.display_name || item.name || 'Unknown item';
    const normalizedName = groceryBudgetNormalizeName(displayName);
    return {
        key: normalizedName,
        displayName,
        category: item.category || 'Uncategorized',
        brand: item.brand || '',
        unit: item.unit || '',
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        estimatedDaysSupply: item.estimated_days_supply || null,
        vatExempt: Boolean(item.vat_exempt),
        isStaple: Boolean(item.is_staple),
        timesPurchased: 1,
        totalPaid: Number(item.price || 0),
        avgPaid: Number(item.price || 0),
        lastPaid: Number(item.price || 0)
    };
}

function groceryBudgetUpsertProduct(products, record) {
    if (!record || !record.key) {
        return;
    }

    const existing = products[record.key];
    if (!existing) {
        products[record.key] = record;
        return;
    }

    existing.displayName = existing.displayName || record.displayName;
    existing.category = existing.category || record.category;
    existing.brand = existing.brand || record.brand;
    existing.unit = existing.unit || record.unit;
    existing.description = existing.description || record.description;
    existing.tags = existing.tags && existing.tags.length ? existing.tags : record.tags;
    existing.estimatedDaysSupply = existing.estimatedDaysSupply || record.estimatedDaysSupply;
    existing.vatExempt = Boolean(existing.vatExempt || record.vatExempt);
    existing.isStaple = Boolean(existing.isStaple || record.isStaple);
    existing.timesPurchased = Number(existing.timesPurchased || 0) + Number(record.timesPurchased || 0);
    existing.totalPaid = Number(existing.totalPaid || 0) + Number(record.totalPaid || 0);
    existing.avgPaid = existing.timesPurchased > 0 ? existing.totalPaid / existing.timesPurchased : Number(record.avgPaid || 0);
    existing.lastPaid = Number(record.lastPaid || existing.lastPaid || 0);
}

function groceryBudgetSeedProductsFromReceipt(data) {
    if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid receipt JSON format. Expected an items array.');
    }
    const state = groceryBudgetGetState();
    data.items.forEach(function(item) {
        groceryBudgetUpsertProduct(state.products, groceryBudgetBuildProductRecord(item));
    });
    groceryBudgetSaveState(state);
}

function groceryBudgetGetSelectedProduct() {
    const picker = document.getElementById('groceryProductPicker');
    const state = groceryBudgetGetState();
    return picker && picker.value ? state.products[picker.value] || null : null;
}

function groceryBudgetRenderProductCatalog() {
    const categoryFilter = document.getElementById('groceryProductCategoryFilter');
    const picker = document.getElementById('groceryProductPicker');
    if (!categoryFilter || !picker) {
        return;
    }

    const state = groceryBudgetGetState();
    const products = Object.values(state.products).filter(function(product) {
        return product && product.key && product.displayName;
    }).sort(function(a, b) {
        if ((a.category || '') === (b.category || '')) {
            return (a.displayName || '').localeCompare(b.displayName || '');
        }
        return (a.category || '').localeCompare(b.category || '');
    });

    const categories = Array.from(new Set(products.map(function(product) {
        return product.category || 'Uncategorized';
    })));
    const selectedCategory = categoryFilter.value || 'all';
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories.map(function(category) {
        const selected = category === selectedCategory ? ' selected' : '';
        return `<option value="${category}"${selected}>${category}</option>`;
    }).join('');

    const activeCategory = categoryFilter.value || 'all';
    const currentValue = picker.value;
    const filtered = products.filter(function(product) {
        return activeCategory === 'all' || product.category === activeCategory;
    });

    picker.innerHTML = '<option value="">Select an item</option>' + filtered.map(function(product) {
        const label = `${product.displayName} | ${product.category} | ${groceryBudgetFormatCurrency(product.avgPaid || 0)}`;
        const selected = product.key === currentValue ? ' selected' : '';
        return `<option value="${product.key}"${selected}>${label}</option>`;
    }).join('');

    const fallbackProduct = filtered.length ? filtered[0] : null;
    if (!filtered.some(function(product) { return product.key === picker.value; })) {
        picker.value = fallbackProduct ? fallbackProduct.key : '';
    }
    if (!picker.value && fallbackProduct) {
        picker.value = fallbackProduct.key;
    }
}

function groceryBudgetRenderProductPreview() {
    const product = groceryBudgetGetSelectedProduct();
    const nameEl = document.getElementById('groceryPreviewName');
    const priceEl = document.getElementById('groceryPreviewPrice');
    const categoryEl = document.getElementById('groceryPreviewCategory');
    const metaEl = document.getElementById('groceryPreviewMeta');
    const guidanceEl = document.getElementById('groceryPlanGuidance');

    if (!product) {
        if (nameEl) nameEl.textContent = 'Pick an item from the catalog';
        if (priceEl) priceEl.textContent = 'R0.00';
        if (categoryEl) categoryEl.textContent = '-';
        if (metaEl) metaEl.textContent = '-';
        if (guidanceEl) guidanceEl.textContent = 'Catalog-driven planning: pick the item, choose quantity, and add it to your shopping list.';
        return;
    }

    if (nameEl) {
        nameEl.textContent = product.brand ? `${product.displayName} (${product.brand})` : product.displayName;
    }
    if (priceEl) {
        priceEl.textContent = groceryBudgetFormatCurrency(product.avgPaid || 0);
    }
    if (categoryEl) {
        categoryEl.textContent = product.category || 'Uncategorized';
    }
    if (metaEl) {
        const stapleText = product.isStaple ? 'Staple' : 'Optional';
        const supplyText = product.estimatedDaysSupply ? `${product.estimatedDaysSupply}d supply` : 'Supply n/a';
        metaEl.textContent = `${stapleText} / ${supplyText}`;
    }
    if (guidanceEl) {
        const detailBits = [];
        if (product.unit) detailBits.push(product.unit);
        if (product.vatExempt) detailBits.push('VAT exempt');
        if (product.tags && product.tags.length) detailBits.push(product.tags.slice(0, 3).join(' • '));
        guidanceEl.textContent = detailBits.join(' | ') || 'Price and product details are attached automatically.';
    }
}

async function groceryBudgetEnsureSeedProducts() {
    const state = groceryBudgetGetState();
    if (Object.keys(state.products).length > 0) {
        return;
    }
    const response = await fetch('checkers_receipt_enriched.json');
    if (!response.ok) {
        throw new Error('Seed product database could not be loaded.');
    }
    const data = await response.json();
    groceryBudgetSeedProductsFromReceipt(data);
}

function groceryBudgetParseReceiptData(data, fallbackMonthKey) {
    if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid receipt JSON format. Expected an items array.');
    }

    const monthKey = fallbackMonthKey || groceryBudgetMonthKeyFromDate('');
    const receipt = data.receipt || {};
    const entries = data.items.map(function(item) {
        const amount = Number(item.price || 0);
        return {
            id: groceryBudgetRandId(),
            monthKey,
            date: `${monthKey}-01`,
            name: item.display_name || item.name || 'Unknown item',
            normalizedName: groceryBudgetNormalizeName(item.display_name || item.name),
            category: item.category || 'Uncategorized',
            amount,
            isFood: item.category !== 'Stationery' && item.category !== 'Household',
            isStaple: Boolean(item.is_staple),
            source: 'receipt-import',
            vatExempt: Boolean(item.vat_exempt),
            estimatedDaysSupply: item.estimated_days_supply || null
        };
    });

    return {
        entries,
        savings: Number(receipt.savings || 0)
    };
}

function groceryBudgetSaveTarget() {
    const monthInput = document.getElementById('groceryMonthInput');
    const budgetInput = document.getElementById('groceryBudgetInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const budget = Number(budgetInput ? budgetInput.value : 0);

    const state = groceryBudgetGetState();
    state.budgets[monthKey] = Number.isFinite(budget) ? Math.max(0, budget) : 0;
    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

function groceryBudgetAddEntry() {
    const dateInput = document.getElementById('groceryEntryDate');
    const nameInput = document.getElementById('groceryEntryName');
    const categoryInput = document.getElementById('groceryEntryCategory');
    const amountInput = document.getElementById('groceryEntryAmount');
    const foodInput = document.getElementById('groceryEntryFood');

    const date = dateInput ? dateInput.value : '';
    const name = (nameInput ? nameInput.value : '').trim();
    const category = (categoryInput ? categoryInput.value : '').trim() || 'Uncategorized';
    const amount = Number(amountInput ? amountInput.value : 0);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert('Enter a valid item name and amount.');
        return;
    }

    const monthKey = groceryBudgetMonthKeyFromDate(date || (document.getElementById('groceryMonthInput') || {}).value || '');
    const state = groceryBudgetGetState();
    const entry = {
        id: groceryBudgetRandId(),
        monthKey,
        date: date || `${monthKey}-01`,
        name,
        normalizedName: groceryBudgetNormalizeName(name),
        category,
        amount,
        isFood: foodInput ? foodInput.value === 'true' : true,
        isStaple: false,
        source: 'manual'
    };

    state.entries.unshift(entry);
    groceryBudgetUpsertProduct(state.products, {
        key: entry.normalizedName,
        displayName: entry.name,
        category: entry.category,
        timesPurchased: 1,
        totalPaid: entry.amount,
        avgPaid: entry.amount,
        lastPaid: entry.amount,
        tags: []
    });

    groceryBudgetSaveState(state);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';
    groceryBudgetRender();
}

function groceryBudgetMergeEntries(parsed) {
    const state = groceryBudgetGetState();
    parsed.entries.forEach(function(entry) {
        state.entries.push(entry);
        groceryBudgetUpsertProduct(state.products, {
            key: entry.normalizedName,
            displayName: entry.name,
            category: entry.category,
            timesPurchased: 1,
            totalPaid: entry.amount,
            avgPaid: entry.amount,
            lastPaid: entry.amount,
            isStaple: Boolean(entry.isStaple),
            estimatedDaysSupply: entry.estimatedDaysSupply || null,
            vatExempt: Boolean(entry.vatExempt),
            tags: []
        });
    });

    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    if (!state.budgets[monthKey]) {
        state.budgets[monthKey] = 0;
    }

    // Persist imported savings as a synthetic entry to keep monthly accounting transparent.
    if (parsed.savings > 0) {
        state.entries.push({
            id: groceryBudgetRandId(),
            monthKey,
            date: `${monthKey}-01`,
            name: 'Receipt Savings',
            normalizedName: 'receipt savings',
            category: 'Savings',
            amount: -Math.abs(parsed.savings),
            isFood: false,
            isStaple: false,
            source: 'receipt-savings'
        });
    }

    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

async function groceryBudgetLoadSeedReceipt() {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    try {
        const response = await fetch('checkers_receipt_enriched.json');
        if (!response.ok) {
            throw new Error('Seed receipt could not be loaded.');
        }
        const data = await response.json();
        groceryBudgetSeedProductsFromReceipt(data);
        const parsed = groceryBudgetParseReceiptData(data, monthKey);
        groceryBudgetMergeEntries(parsed);
    } catch (error) {
        alert(error.message || 'Failed to load starter receipt JSON.');
    }
}

function groceryBudgetResetCurrentMonth() {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const state = groceryBudgetGetState();
    state.entries = state.entries.filter(function(entry) {
        return entry.monthKey !== monthKey;
    });
    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

function groceryBudgetRender() {
    const monthInput = document.getElementById('groceryMonthInput');
    const budgetInput = document.getElementById('groceryBudgetInput');
    const filterInput = document.getElementById('groceryFilterInput');
    const selectedMonth = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const filterMode = filterInput ? filterInput.value : 'all';

    const state = groceryBudgetGetState();
    const monthBudget = Number(state.budgets[selectedMonth] || 0);
    const monthPlan = Array.isArray(state.plans[selectedMonth]) ? state.plans[selectedMonth] : [];
    const monthEntries = state.entries.filter(function(entry) {
        const sameMonth = entry.monthKey === selectedMonth;
        const includeByFilter = filterMode === 'all' ? true : entry.isFood;
        return sameMonth && includeByFilter;
    });

    const planTotal = monthPlan.reduce(function(sum, item) {
        return sum + (Number(item.estimatedPrice || 0) * Number(item.quantity || 0));
    }, 0);

    const actual = monthEntries.reduce(function(sum, entry) {
        return sum + Number(entry.amount || 0);
    }, 0);
    const remaining = monthBudget - actual;
    const listRemaining = monthBudget - planTotal;
    const variance = actual - monthBudget;

    const pct = monthBudget > 0 ? Math.max(0, Math.min(100, (actual / monthBudget) * 100)) : 0;

    const plannedEl = document.getElementById('groceryKpiPlanned');
    const listEl = document.getElementById('groceryKpiList');
    const actualEl = document.getElementById('groceryKpiActual');
    const listRemainEl = document.getElementById('groceryKpiListRemaining');
    const varianceEl = document.getElementById('groceryKpiVariance');
    const progressFillEl = document.getElementById('groceryProgressFill');
    const stateBadgeEl = document.getElementById('groceryBudgetState');
    const monthLabelEl = document.getElementById('groceryCurrentMonthLabel');
    const listTotalEl = document.getElementById('groceryPlannedListTotal');
    const dbCountEl = document.getElementById('groceryDbCount');

    if (plannedEl) plannedEl.textContent = groceryBudgetFormatCurrency(monthBudget);
    if (listEl) listEl.textContent = groceryBudgetFormatCurrency(planTotal);
    if (actualEl) actualEl.textContent = groceryBudgetFormatCurrency(actual);
    if (listRemainEl) listRemainEl.textContent = groceryBudgetFormatCurrency(listRemaining);
    if (varianceEl) varianceEl.textContent = groceryBudgetFormatCurrency(variance);
    if (progressFillEl) progressFillEl.style.width = `${pct}%`;
    if (monthLabelEl) monthLabelEl.textContent = selectedMonth;
    if (listTotalEl) listTotalEl.textContent = groceryBudgetFormatCurrency(planTotal);
    if (dbCountEl) dbCountEl.textContent = `${Object.keys(state.products).length} items`;
    if (budgetInput && document.activeElement !== budgetInput) {
        budgetInput.value = String(monthBudget || '');
    }

    if (varianceEl) {
        varianceEl.classList.toggle('over', variance > 0);
    }

    if (stateBadgeEl) {
        if (monthBudget <= 0) {
            stateBadgeEl.textContent = 'Set Budget';
            stateBadgeEl.style.background = 'var(--black)';
        } else if (listRemaining < 0) {
            stateBadgeEl.textContent = 'List Over Budget';
            stateBadgeEl.style.background = 'var(--red)';
        } else if (pct >= 100) {
            stateBadgeEl.textContent = 'Over Budget';
            stateBadgeEl.style.background = 'var(--red)';
        } else if (pct >= 90) {
            stateBadgeEl.textContent = 'Critical';
            stateBadgeEl.style.background = 'var(--red)';
        } else if (pct >= 75) {
            stateBadgeEl.textContent = 'Watch';
            stateBadgeEl.style.background = 'var(--black)';
        } else {
            stateBadgeEl.textContent = 'On Track';
            stateBadgeEl.style.background = 'var(--black)';
        }
    }

    if (listRemainEl) {
        listRemainEl.classList.toggle('over', listRemaining < 0);
    }

    const categoryBody = document.getElementById('groceryCategoryBody');
    if (categoryBody) {
        const byCategory = {};
        monthEntries.forEach(function(entry) {
            const key = entry.category || 'Uncategorized';
            byCategory[key] = (byCategory[key] || 0) + Number(entry.amount || 0);
        });
        const total = actual || 1;
        const rows = Object.entries(byCategory)
            .sort(function(a, b) { return b[1] - a[1]; })
            .map(function(pair) {
                const percent = ((pair[1] / total) * 100).toFixed(1);
                return `<tr><td>${pair[0]}</td><td>${groceryBudgetFormatCurrency(pair[1])}</td><td>${percent}%</td></tr>`;
            });
        categoryBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="3">No entries for this month yet.</td></tr>';
    }

    const itemsBody = document.getElementById('groceryItemsBody');
    if (itemsBody) {
        const topItems = monthEntries
            .filter(function(entry) { return entry.amount > 0; })
            .sort(function(a, b) { return b.amount - a.amount; })
            .slice(0, 10);
        itemsBody.innerHTML = topItems.length
            ? topItems.map(function(entry) {
                return `<tr><td>${entry.name}</td><td>${entry.category}</td><td>${groceryBudgetFormatCurrency(entry.amount)}</td><td>${entry.source}</td></tr>`;
            }).join('')
            : '<tr><td colspan="4">No spend data yet.</td></tr>';
    }

    const planBody = document.getElementById('groceryPlanBody');
    if (planBody) {
        if (!monthPlan.length) {
            planBody.innerHTML = '<tr><td colspan="8">No planned items yet. Add your list before going to the shop.</td></tr>';
        } else {
            planBody.innerHTML = monthPlan.map(function(item) {
                const lineTotal = Number(item.estimatedPrice || 0) * Number(item.quantity || 0);
                const escapedId = String(item.id).replace(/'/g, "\\'");
                return `<tr>
                    <td><input type="checkbox" ${item.done ? 'checked' : ''} onchange="groceryPlannerToggleDone('${escapedId}')"></td>
                    <td>${item.name}</td>
                    <td>${item.category || 'Uncategorized'}</td>
                    <td>${groceryBudgetFormatCurrency(item.estimatedPrice || 0)}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${groceryBudgetFormatCurrency(lineTotal)}</td>
                    <td>${item.mustBuy ? 'Must Buy' : 'Optional'}</td>
                    <td><button onclick="groceryPlannerRemoveItem('${escapedId}')" style="padding: 4px 8px; border: 1px solid var(--black); background: var(--white); cursor: pointer;">Remove</button></td>
                </tr>`;
            }).join('');
        }
    }

    groceryBudgetRenderProductCatalog();
    groceryBudgetRenderProductPreview();
}

function groceryPlannerAddItem() {
    const monthInput = document.getElementById('groceryMonthInput');
    const picker = document.getElementById('groceryProductPicker');
    const qtyInput = document.getElementById('groceryPlanQty');
    const needInput = document.getElementById('groceryPlanNeed');

    const quantity = Math.max(1, Number(qtyInput ? qtyInput.value : 1) || 1);
    const state = groceryBudgetGetState();
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const productKey = picker ? picker.value : '';
    const product = productKey ? state.products[productKey] : null;
    const mustBuy = !needInput || needInput.value === 'must';

    if (!product) {
        alert('Pick an item from the product catalog first.');
        return;
    }

    if (!state.plans[monthKey]) {
        state.plans[monthKey] = [];
    }

    state.plans[monthKey].push({
        id: groceryBudgetRandId(),
        productKey,
        name: product.displayName,
        category: product.category || 'Uncategorized',
        estimatedPrice: Number(product.avgPaid || 0),
        quantity,
        mustBuy,
        done: false
    });

    groceryBudgetSaveState(state);
    if (qtyInput) qtyInput.value = '1';
    if (needInput) needInput.value = 'must';
    groceryBudgetRender();
}

function groceryPlannerToggleDone(itemId) {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const state = groceryBudgetGetState();
    const plan = state.plans[monthKey] || [];
    const target = plan.find(function(item) { return item.id === itemId; });
    if (target) {
        target.done = !target.done;
        groceryBudgetSaveState(state);
        groceryBudgetRender();
    }
}

function groceryPlannerRemoveItem(itemId) {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const state = groceryBudgetGetState();
    state.plans[monthKey] = (state.plans[monthKey] || []).filter(function(item) {
        return item.id !== itemId;
    });
    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

function groceryPlannerClearMonth() {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const state = groceryBudgetGetState();
    state.plans[monthKey] = [];
    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

function groceryPlannerSetBudgetFromList() {
    const monthInput = document.getElementById('groceryMonthInput');
    const monthKey = groceryBudgetMonthKeyFromDate(monthInput ? monthInput.value : '');
    const state = groceryBudgetGetState();
    const plan = state.plans[monthKey] || [];
    const planTotal = plan.reduce(function(sum, item) {
        return sum + (Number(item.estimatedPrice || 0) * Number(item.quantity || 0));
    }, 0);
    state.budgets[monthKey] = Number(planTotal.toFixed(2));
    groceryBudgetSaveState(state);
    groceryBudgetRender();
}

function groceryBudgetInit() {
    const monthInput = document.getElementById('groceryMonthInput');
    const filterInput = document.getElementById('groceryFilterInput');
    const dateInput = document.getElementById('groceryEntryDate');
    const importInput = document.getElementById('groceryImportFile');
    const productPicker = document.getElementById('groceryProductPicker');
    const categoryFilter = document.getElementById('groceryProductCategoryFilter');

    if (!monthInput) {
        return;
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    monthInput.value = `${now.getFullYear()}-${month}`;
    if (dateInput) {
        dateInput.value = `${now.getFullYear()}-${month}-${day}`;
    }

    monthInput.addEventListener('change', groceryBudgetRender);
    if (filterInput) {
        filterInput.addEventListener('change', groceryBudgetRender);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            groceryBudgetRenderProductCatalog();
            groceryBudgetRenderProductPreview();
        });
    }
    if (productPicker) {
        productPicker.addEventListener('change', groceryBudgetRenderProductPreview);
    }

    if (importInput) {
        importInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const json = JSON.parse(reader.result);
                    const monthKey = groceryBudgetMonthKeyFromDate(monthInput.value);
                    groceryBudgetSeedProductsFromReceipt(json);
                    const parsed = groceryBudgetParseReceiptData(json, monthKey);
                    groceryBudgetMergeEntries(parsed);
                    importInput.value = '';
                } catch (error) {
                    alert('Invalid JSON file for grocery import.');
                }
            };
            reader.readAsText(file);
        });
    }

    groceryBudgetEnsureSeedProducts()
        .catch(function(error) {
            console.warn(error.message || error);
        })
        .finally(function() {
            groceryBudgetRender();
        });
}

document.addEventListener('DOMContentLoaded', groceryBudgetInit);
</script>
