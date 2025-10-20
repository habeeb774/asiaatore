// Minimal types for OrderListItem component
export type Order = {
	// required fields used by the component
	grandTotal: number;
	createdAt: string | Date;
	// optional common fields (keeps the type flexible)
	id?: string;
	status?: string;
	// allow other properties without breaking callers
	[key: string]: any;
};

export type OrderListItemProps = {
	order: Order;
};
