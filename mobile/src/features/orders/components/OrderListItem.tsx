import { formatCurrency, formatDateTime } from '../../../utils/formatters';

import { Text } from 'react-native';

import { OrderListItemProps } from './OrderListItem.types';

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