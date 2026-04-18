<?php
/**
 * Master loader for WP Content Types.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Core classes.
require_once WPCT_PATH . 'includes/class-wpct-content-type.php';
require_once WPCT_PATH . 'includes/class-wpct-field.php';
require_once WPCT_PATH . 'includes/class-wpct-registry.php';
require_once WPCT_PATH . 'includes/class-wpct-rest-controller.php';
require_once WPCT_PATH . 'includes/class-wpct-post-type-registrar.php';
require_once WPCT_PATH . 'includes/class-wpct-admin.php';
require_once WPCT_PATH . 'includes/class-wpct-editor.php';

// Abilities API (WP 6.9+).
require_once WPCT_PATH . 'includes/schemas/class-wpct-schemas.php';
require_once WPCT_PATH . 'includes/class-wpct-abilities.php';

// AI Chat (WP 7.0+).
require_once WPCT_PATH . 'includes/class-wpct-ai-chat.php';

// Field types.
require_once WPCT_PATH . 'includes/field-types/class-wpct-field-type.php';
require_once WPCT_PATH . 'includes/field-types/class-wpct-field-type-text.php';

// Initialize with priorities to ensure proper ordering.
add_action( 'init', array( 'WPCT_Content_Type', 'init' ), 5 );        // Internal post type first.
add_action( 'init', array( 'WPCT_Registry', 'init' ), 10 );           // Cache setup.
add_action( 'init', array( 'WPCT_Post_Type_Registrar', 'init' ), 15 ); // Register user types.
// Register abilities directly on the abilities API hooks (not via init).
add_action( 'wp_abilities_api_categories_init', array( 'WPCT_Abilities', 'register_category' ) );
add_action( 'wp_abilities_api_init', array( 'WPCT_Abilities', 'register_abilities' ) );
add_action( 'admin_menu', array( 'WPCT_Admin', 'init' ) );
add_action( 'init', array( 'WPCT_Editor', 'init' ) );

// Initialize AI Chat REST endpoint.
WPCT_AI_Chat::init();


// add_filter(
// 'block_editor_settings_all',
// function ( $settings, $context ) {
// Check if we're editing a specific post type
// if ( isset( $context->post ) && get_post_type( $context->post ) === 'event'
// ) {
// $settings['richEditingEnabled'] = false;
// Optionally also disable code editing to see what happens:
// $settings['codeEditingEnabled'] = false;
// }
// return $settings;
// },
// 10,
// 2
// );
