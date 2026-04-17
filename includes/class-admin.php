<?php
/**
 * Admin screens and asset loading.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPCT_Admin {

	/**
	 * Initialize admin.
	 */
	public static function init() {
		self::add_menu();
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Add admin menu pages.
	 */
	private static function add_menu() {
		// Main Content Types page (list view).
		add_menu_page(
			__( 'Content Types', 'wp-content-types' ),
			__( 'Content Types', 'wp-content-types' ),
			'manage_options',
			'wp-content-types',
			array( __CLASS__, 'render_content_types_page' ),
			'dashicons-database',
			30
		);

		// Edit Content Type subpage.
		add_submenu_page(
			'wp-content-types',
			__( 'Edit Content Type', 'wp-content-types' ),
			__( 'Add New', 'wp-content-types' ),
			'manage_options',
			'wp-content-type-edit',
			array( __CLASS__, 'render_content_type_editor_page' )
		);
	}

	/**
	 * Render the Content Types list page.
	 */
	public static function render_content_types_page() {
		echo '<div class="wrap">';
		echo '<div id="wpct-content-types-root"></div>';
		echo '</div>';
	}

	/**
	 * Render the Content Type Editor page.
	 */
	public static function render_content_type_editor_page() {
		echo '<div class="wrap">';
		echo '<div id="wpct-content-type-editor-root"></div>';
		echo '</div>';
	}

	/**
	 * Render the Post Editor page.
	 */
	public static function render_post_editor_page() {
		echo '<div class="wrap">';
		echo '<div id="wpct-post-editor-root"></div>';
		echo '</div>';
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @param string $hook_suffix Current admin page.
	 */
	public static function enqueue_assets( $hook_suffix ) {
		$screen_map = array(
			'toplevel_page_wp-content-types'         => 'content-types',
			'content-types_page_wp-content-type-edit' => 'content-type-editor',
		);

		if ( ! isset( $screen_map[ $hook_suffix ] ) ) {
			return;
		}

		$script_name = $screen_map[ $hook_suffix ];
		$asset_file  = WPCT_PATH . "build/{$script_name}.asset.php";

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			"wpct-{$script_name}",
			WPCT_URL . "build/{$script_name}.js",
			$asset['dependencies'],
			$asset['version'],
			true
		);

		$css_file = WPCT_PATH . "build/{$script_name}.css";
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				"wpct-{$script_name}",
				WPCT_URL . "build/{$script_name}.css",
				array( 'wp-components' ),
				$asset['version']
			);
		}

		$settings = array(
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'adminUrl' => admin_url(),
		);

		// Pass content type ID when editing.
		if ( 'content-type-editor' === $script_name && isset( $_GET['id'] ) ) {
			$settings['contentTypeId'] = absint( $_GET['id'] );
		}

		wp_localize_script( "wpct-{$script_name}", 'wpctSettings', $settings );
	}
}
