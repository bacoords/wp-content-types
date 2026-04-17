/**
 * Content Types List Screen
 *
 * DataViews table showing all content type definitions.
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import './styles.css';

const root = document.getElementById( 'wpct-content-types-root' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
