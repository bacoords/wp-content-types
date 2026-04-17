<?php
/**
 * Master loader for WP Content Types.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Core classes.
require_once WPCT_PATH . 'includes/class-content-type.php';
require_once WPCT_PATH . 'includes/class-field.php';
require_once WPCT_PATH . 'includes/class-registry.php';
require_once WPCT_PATH . 'includes/class-admin.php';

// Field types.
require_once WPCT_PATH . 'includes/field-types/class-field-type.php';
require_once WPCT_PATH . 'includes/field-types/class-text.php';

// Initialize.
add_action( 'init', array( 'WPCT_Content_Type', 'init' ) );
add_action( 'init', array( 'WPCT_Registry', 'init' ) );
add_action( 'admin_menu', array( 'WPCT_Admin', 'init' ) );
