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
		// Position 79 places it just above Settings (80).
		add_menu_page(
			__( 'Content Types', 'wp-content-types' ),
			__( 'Content Types', 'wp-content-types' ),
			'manage_options',
			'wp-content-types',
			array( __CLASS__, 'render_content_types_page' ),
			'dashicons-database',
			79
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

		// Add "Manage" submenu to each registered user content type.
		self::add_manage_submenus();
	}

	/**
	 * Add "Manage" submenu items under each registered content type's menu.
	 */
	private static function add_manage_submenus() {
		global $submenu;

		$content_types = WPCT_Content_Type::get_all();

		foreach ( $content_types as $content_type ) {
			$slug = $content_type['slug'] ?? '';
			$id   = $content_type['id'] ?? 0;

			// Only add if the post type exists and is registered.
			if ( empty( $slug ) || ! post_type_exists( $slug ) ) {
				continue;
			}

			$parent_slug = 'edit.php?post_type=' . $slug;
			$manage_url  = admin_url( 'admin.php?page=wp-content-type-edit&id=' . $id );

			// Directly add to submenu array for external URL linking.
			$submenu[ $parent_slug ][] = array(
				__( 'Manage', 'wp-content-types' ),
				'manage_options',
				$manage_url,
			);
		}
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

		// Pass content type ID or data when editing.
		if ( 'content-type-editor' === $script_name && isset( $_GET['id'] ) ) {
			$id = sanitize_text_field( wp_unslash( $_GET['id'] ) );

			// Check if this is a numeric ID (database record) or slug (hardcoded type).
			if ( is_numeric( $id ) ) {
				$settings['contentTypeId'] = absint( $id );
			} else {
				// Slug-based access for hardcoded types.
				$content_type = WPCT_Registry::get( $id );
				if ( $content_type ) {
					$settings['contentTypeSlug'] = $id;
					$settings['contentTypeData'] = $content_type;
				}
			}
		}

		wp_localize_script( "wpct-{$script_name}", 'wpctSettings', $settings );
	}
}
