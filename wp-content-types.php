<?php
/**
 * Plugin Name: WP Content Types
 * Description: A content modeling system for WordPress.
 * Version: 0.1.4
 * Author: Brian Coords
 * Text Domain: wp-content-types
 * Domain Path: /languages
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WPCT_VERSION', '0.1.3' );
define( 'WPCT_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPCT_URL', plugin_dir_url( __FILE__ ) );

require_once WPCT_PATH . 'includes/load.php';
