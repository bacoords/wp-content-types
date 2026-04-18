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
require_once WPCT_PATH . 'includes/class-rest-controller.php';
require_once WPCT_PATH . 'includes/class-post-type-registrar.php';
require_once WPCT_PATH . 'includes/class-admin.php';

// Abilities API (WP 6.9+).
require_once WPCT_PATH . 'includes/schemas/content-type.php';
require_once WPCT_PATH . 'includes/class-abilities.php';

// AI Chat (WP 7.0+).
require_once WPCT_PATH . 'includes/class-ai-chat.php';

// Field types.
require_once WPCT_PATH . 'includes/field-types/class-field-type.php';
require_once WPCT_PATH . 'includes/field-types/class-text.php';

// Initialize with priorities to ensure proper ordering.
add_action( 'init', array( 'WPCT_Content_Type', 'init' ), 5 );        // Internal post type first.
add_action( 'init', array( 'WPCT_Registry', 'init' ), 10 );           // Cache setup.
add_action( 'init', array( 'WPCT_Post_Type_Registrar', 'init' ), 15 ); // Register user types.
// Register abilities directly on the abilities API hooks (not via init).
add_action( 'wp_abilities_api_categories_init', array( 'WPCT_Abilities', 'register_category' ) );
add_action( 'wp_abilities_api_init', array( 'WPCT_Abilities', 'register_abilities' ) );
add_action( 'admin_menu', array( 'WPCT_Admin', 'init' ) );

// Initialize AI Chat REST endpoint.
WPCT_AI_Chat::init();
