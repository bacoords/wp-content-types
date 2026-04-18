import { Icon } from '@wordpress/components';

export default function Badge( { children, intent = 'default', icon } ) {
	const isSuccess = intent === 'success';

	const style = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
		padding: '2px 8px',
		borderRadius: '2px',
		fontSize: '12px',
		fontWeight: 500,
		backgroundColor: isSuccess ? '#e7f5e7' : '#f0f0f0',
		color: isSuccess ? '#1e7b1e' : '#50575e',
	};

	return (
		<span style={ style }>
			{ icon && <Icon icon={ icon } size={ 12 } /> }
			{ children }
		</span>
	);
}
