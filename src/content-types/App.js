/**
 * Content Types List App
 */
import { useState } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const fields = [
	{
		id: 'title',
		label: 'Title',
		getValue: ( { item } ) => item.title?.rendered || item.title,
		enableGlobalSearch: true,
	},
];

const actions = [
	{
		id: 'edit',
		label: 'Edit',
		isPrimary: true,
		callback: ( items ) => {
			const item = items[ 0 ];
			window.location.href = `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ item.id }`;
		},
	},
];

/**
 * List Header component
 */
function ListHeader() {
	const addNewUrl = window.wpctSettings.adminUrl + 'admin.php?page=wp-content-type-edit';

	return (
		<div className="wpct-list__header">
			<h1 className="wpct-list__title">
				{ __( 'Content Types', 'wp-content-types' ) }
			</h1>
			<Button variant="primary" href={ addNewUrl }>
				{ __( 'Add New', 'wp-content-types' ) }
			</Button>
		</div>
	);
}

export default function App() {
	const { records, isResolving } = useEntityRecords(
		'postType',
		'wp_content_type',
		{ per_page: -1, status: 'publish' }
	);

	const data = records || [];

	const [ view, setView ] = useState( {
		type: 'table',
		fields: [ 'title' ],
	} );

	return (
		<div className="wpct-list">
			<ListHeader />
			<div className="wpct-list__content">
				<DataViews
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					paginationInfo={ { totalItems: data.length, totalPages: 1 } }
					getItemId={ ( item ) => String( item.id ) }
					isLoading={ isResolving }
					defaultLayouts={ { table: {} } }
					actions={ actions }
				/>
			</div>
		</div>
	);
}
