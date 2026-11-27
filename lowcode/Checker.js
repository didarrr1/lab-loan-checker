export default {
	MAX_QUANTITY: 5,
	MAX_DAYS: 14,
	checks: 0,
	snapshot: '',
	result: { decision: 'No check yet', reason: '-', message: 'Choose an item, enter a quantity and loan days, then press Check request.' },
	catalog () {
		const d = GetCatalog.data;
		const ok = GetCatalog.responseMeta && GetCatalog.responseMeta.isExecutionSuccess;
		const valid = d && Array.isArray(d.items) && d.items.every(i => i && typeof i.id === 'string' && i.id.length > 0 && typeof i.name === 'string' && i.name.length > 0 && Number.isInteger(i.stock) && i.stock >= 0 && typeof i.maintenance === 'boolean');
		return ok && valid ? d : null;
	},
	whole (text) {
		const t = String(text === undefined || text === null ? '' : text).trim();
		return /^[0-9]{1,6}$/.test(t) ? Number(t) : null;
	},
	check (itemId, qtyText, daysText) {
		const cat = this.catalog();
		if (!cat) return { decision: 'No decision', reason: 'CATALOG_UNAVAILABLE', message: 'The catalog could not be loaded. Try again later.' };
		const item = cat.items.find(i => i.id === itemId);
		if (!item) return { decision: 'Invalid input', reason: 'INVALID_ITEM', message: 'Choose an item from the catalog.' };
		const q = this.whole(qtyText);
		if (q === null) return { decision: 'Invalid input', reason: 'INVALID_QUANTITY', message: 'Quantity must be a whole number, for example 2.' };
		const d = this.whole(daysText);
		if (d === null) return { decision: 'Invalid input', reason: 'INVALID_DAYS', message: 'Loan days must be a whole number, for example 7.' };
		if (q < 1 || q > this.MAX_QUANTITY) return { decision: 'Invalid input', reason: 'QUANTITY_OUT_OF_RANGE', message: 'Quantity must be from 1 to 5.' };
		if (d < 1 || d > this.MAX_DAYS) return { decision: 'Invalid input', reason: 'DAYS_OUT_OF_RANGE', message: 'Loan days must be from 1 to 14.' };
		if (item.maintenance) return { decision: 'Rejected', reason: 'ITEM_UNAVAILABLE', message: item.name + ' is under maintenance and cannot be borrowed now.' };
		if (q > item.stock) return { decision: 'Rejected', reason: 'INSUFFICIENT_STOCK', message: 'Only ' + item.stock + ' x ' + item.name + ' in stock; you asked for ' + q + '.' };
		return { decision: 'Approved', reason: 'APPROVED', message: q + ' x ' + item.name + ' for ' + d + (d === 1 ? ' day' : ' days') + ' can be borrowed (' + item.stock + ' in stock).' };
	},
	run () {
		const cat = this.catalog();
		this.result = this.check(ItemSelect.selectedOptionValue, QuantityInput.text, DaysInput.text);
		if (cat) {
			if (!this.snapshot) this.snapshot = JSON.stringify(cat);
			this.checks = this.checks + 1;
		}
		return this.result;
	},
	integrity () {
		const cat = this.catalog();
		if (!cat) return 'Stock unchanged: - (no catalog)';
		return 'Stock unchanged: ' + (!this.snapshot || JSON.stringify(cat) === this.snapshot ? 'yes' : 'NO') + ' (' + this.checks + ' checks)';
	}
}
