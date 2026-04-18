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
const useBlockEditor = window.wpctEditorSettings?.useBlockEditor ?? true;

// Register if there are custom fields OR if block editor is disabled (show full canvas)
if ( fields.length > 0 || ! useBlockEditor ) {
	registerPlugin( 'wpct-custom-fields', {
		render: CustomFieldsPanel,
		icon: 'blockMeta',
	} );
}
