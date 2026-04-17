/**
 * Content Type Editor Screen
 *
 * Block editor for editing a single content type's configuration.
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import './styles.css';

const root = document.getElementById( 'wpct-content-type-editor-root' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
