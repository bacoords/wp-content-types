/**
 * Post Editor Screen
 *
 * Block editor for editing posts of custom content types.
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import './styles.css';

const root = document.getElementById( 'wpct-post-editor-root' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
