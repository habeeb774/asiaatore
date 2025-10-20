import { formatCurrency, formatDateTime } from '../../../utils/formatters';

import { Text } from 'react-native';

type OrderListItemProps = {
	order: {
		grandTotal: number | string | null | undefined;
		createdAt: string | number | Date;
	};
};

const OrderListItem = ({ order }: OrderListItemProps) => {
	return (
		<>
			<Text
				allowFontScaling
				accessibilityLabel={`إجمالي الطلب: ${formatCurrency(order.grandTotal)}`}
			>
				{formatCurrency(order.grandTotal)}
			</Text>
			<Text
				allowFontScaling
				accessibilityLabel={`تاريخ الطلب: ${formatDateTime(order.createdAt)}`}
			>
				{formatDateTime(order.createdAt)}
			</Text>
		</>
	);
};

export default OrderListItem;