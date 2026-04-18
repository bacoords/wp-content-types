/**
 * Block Editor Customizations
 *
 * Scripts loaded in the block editor context for all post types.
 * Used for registering custom field sidebars, plugins, and editor modifications.
 */

import { registerPlugin } from '@wordpress/plugins';
import CustomFieldsPanel from './components/CustomFieldsPanel';
import './styles.css';

const contentType = window.wpctEditorSettings?.contentType;
const fields = contentType?.config?.fields || [];

// Only register if there are custom fields
if ( fields.length > 0 ) {
	registerPlugin( 'wpct-custom-fields', {
		render: CustomFieldsPanel,
		icon: 'database',
	} );
}
