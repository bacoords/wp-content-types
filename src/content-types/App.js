/**
 * Content Types List App
 */
import { useState } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';

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
	);
}
