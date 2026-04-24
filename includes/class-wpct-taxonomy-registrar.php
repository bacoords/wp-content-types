<?php
/**
 * Registers user-created taxonomies with WordPress.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomy registrar class.
 *
 * Registers user-created taxonomies with WordPress.
 */
class WPCT_Taxonomy_Registrar {

	/**
	 * Reserved taxonomy slugs that cannot be used.
	 *
	 * @var array
	 */
	private static $reserved_slugs = array(
		'category',
		'post_tag',
		'nav_menu',
		'link_category',
		'post_format',
		'wp_theme',
		'wp_template_part_area',
		'wp_pattern_category',
		'type',
		'author',
	);

	/**
	 * Get reserved taxonomy slugs.
	 *
	 * @return array
	 */
	public static function get_reserved_slugs() {
		return self::$reserved_slugs;
	}

	/**
	 * Initialize the registrar.
	 */
	public static function init() {
		self::register_all();

		// Schedule rewrite flush when taxonomies change.
		add_action( 'save_post_' . WPCT_Taxonomy::POST_TYPE, array( __CLASS__, 'schedule_flush' ) );
		add_action( 'before_delete_post', array( __CLASS__, 'maybe_schedule_flush_on_delete' ) );
	}

	/**
	 * Register all user-created taxonomies.
	 */
	public static function register_all() {
		$taxonomies = WPCT_Taxonomy::get_all();

		foreach ( $taxonomies as $taxonomy ) {
			self::register_single( $taxonomy );
		}
	}

	/**
	 * Register a single taxonomy.
	 *
	 * @param array $taxonomy Taxonomy data.
	 * @return WP_Taxonomy|WP_Error|bool
	 */
	public static function register_single( $taxonomy ) {
		$slug = $taxonomy['slug'] ?? '';

		// Validate slug format.
		if ( ! self::is_valid_slug_format( $slug ) ) {
			return false;
		}

		// Check if taxonomy already exists.
		if ( taxonomy_exists( $slug ) ) {
			return false;
		}

		// Check for reserved slugs.
		if ( self::is_reserved_slug( $slug ) ) {
			return false;
		}

		$config     = $taxonomy['config'] ?? array();
		$post_types = $config['post_types'] ?? array();
		$args       = self::build_args( $taxonomy );

		return register_taxonomy( $slug, $post_types, $args );
	}

	/**
	 * Build register_taxonomy() arguments from taxonomy config.
	 *
	 * @param array $taxonomy Taxonomy data.
	 * @return array
	 */
	private static function build_args( $taxonomy ) {
		$config       = $taxonomy['config'] ?? array();
		$slug         = $taxonomy['slug'] ?? '';
		$name         = $taxonomy['name'] ?? '';
		$hierarchical = $config['hierarchical'] ?? true;

		// Build labels from name if not provided.
		$labels = $config['labels'] ?? self::generate_labels( $name, $hierarchical );

		// Default settings.
		$public       = $config['public'] ?? true;
		$show_in_rest = $config['show_in_rest'] ?? true;
		$rest_base    = ! empty( $config['rest_base'] ) ? $config['rest_base'] : $slug;

		// Rewrite settings.
		$rewrite_slug = ! empty( $config['rewrite_slug'] ) ? $config['rewrite_slug'] : $slug;
		$with_front   = $config['with_front'] ?? true;

		return array(
			'labels'            => $labels,
			'public'            => $public,
			'hierarchical'      => $hierarchical,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => $show_in_rest,
			'rest_base'         => $rest_base,
			'rewrite'           => array(
				'slug'       => $rewrite_slug,
				'with_front' => $with_front,
			),
		);
	}

	/**
	 * Generate labels from a taxonomy name.
	 *
	 * @param string $name         Singular name.
	 * @param bool   $hierarchical Whether taxonomy is hierarchical.
	 * @return array
	 */
	public static function generate_labels( $name, $hierarchical = true ) {
		$plural = self::pluralize( $name );

		$labels = array(
			'name'                  => $plural,
			'singular_name'         => $name,
			/* translators: %s: Taxonomy plural name */
			'search_items'          => sprintf( __( 'Search %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Taxonomy plural name */
			'all_items'             => sprintf( __( 'All %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Taxonomy singular name */
			'edit_item'             => sprintf( __( 'Edit %s', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy singular name */
			'view_item'             => sprintf( __( 'View %s', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy singular name */
			'update_item'           => sprintf( __( 'Update %s', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy singular name */
			'add_new_item'          => sprintf( __( 'Add New %s', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy singular name */
			'new_item_name'         => sprintf( __( 'New %s Name', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy plural name (lowercase) */
			'not_found'             => sprintf( __( 'No %s found.', 'wp-content-types' ), strtolower( $plural ) ),
			/* translators: %s: Taxonomy plural name (lowercase) */
			'no_terms'              => sprintf( __( 'No %s', 'wp-content-types' ), strtolower( $plural ) ),
			/* translators: %s: Taxonomy plural name (lowercase) */
			'filter_by_item'        => sprintf( __( 'Filter by %s', 'wp-content-types' ), strtolower( $name ) ),
			/* translators: %s: Taxonomy plural name */
			'items_list_navigation' => sprintf( __( '%s list navigation', 'wp-content-types' ), $plural ),
			/* translators: %s: Taxonomy plural name */
			'items_list'            => sprintf( __( '%s list', 'wp-content-types' ), $plural ),
			/* translators: %s: Taxonomy singular name */
			'back_to_items'         => sprintf( __( '&larr; Go to %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Taxonomy singular name */
			'item_link'             => sprintf( __( '%s Link', 'wp-content-types' ), $name ),
			/* translators: %s: Taxonomy singular name (lowercase) */
			'item_link_description' => sprintf( __( 'A link to a %s.', 'wp-content-types' ), strtolower( $name ) ),
		);

		// Hierarchical-specific labels (like categories).
		if ( $hierarchical ) {
			/* translators: %s: Taxonomy singular name */
			$labels['parent_item'] = sprintf( __( 'Parent %s', 'wp-content-types' ), $name );
			/* translators: %s: Taxonomy singular name */
			$labels['parent_item_colon'] = sprintf( __( 'Parent %s:', 'wp-content-types' ), $name );
		} else {
			// Tags don't have parent items.
			$labels['parent_item']       = null;
			$labels['parent_item_colon'] = null;
			/* translators: %s: Taxonomy plural name */
			$labels['popular_items'] = sprintf( __( 'Popular %s', 'wp-content-types' ), $plural );
			/* translators: %s: Taxonomy plural name (lowercase) */
			$labels['separate_items_with_commas'] = sprintf( __( 'Separate %s with commas', 'wp-content-types' ), strtolower( $plural ) );
			/* translators: %s: Taxonomy plural name (lowercase) */
			$labels['add_or_remove_items'] = sprintf( __( 'Add or remove %s', 'wp-content-types' ), strtolower( $plural ) );
			/* translators: %s: Taxonomy plural name (lowercase) */
			$labels['choose_from_most_used'] = sprintf( __( 'Choose from the most used %s', 'wp-content-types' ), strtolower( $plural ) );
		}

		return $labels;
	}

	/**
	 * Simple pluralization for labels.
	 *
	 * @param string $name Singular name.
	 * @return string
	 */
	private static function pluralize( $name ) {
		if ( empty( $name ) ) {
			return $name;
		}

		// Simple English pluralization rules.
		$last_char = strtolower( substr( $name, -1 ) );
		$last_two  = strtolower( substr( $name, -2 ) );

		if ( 'y' === $last_char && ! in_array( $last_two[0], array( 'a', 'e', 'i', 'o', 'u' ), true ) ) {
			return substr( $name, 0, -1 ) . 'ies';
		}

		if ( in_array( $last_char, array( 's', 'x', 'z' ), true ) || in_array( $last_two, array( 'sh', 'ch' ), true ) ) {
			return $name . 'es';
		}

		return $name . 's';
	}

	/**
	 * Validate slug format (length, characters).
	 *
	 * @param string $slug The slug to validate.
	 * @return bool
	 */
	private static function is_valid_slug_format( $slug ) {
		// Must be 1-32 characters (taxonomy limit is 32).
		if ( empty( $slug ) || strlen( $slug ) > 32 ) {
			return false;
		}

		// Must be lowercase alphanumeric with underscores only.
		if ( ! preg_match( '/^[a-z0-9_]+$/', $slug ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if a slug is reserved.
	 *
	 * @param string $slug The slug to check.
	 * @return bool
	 */
	private static function is_reserved_slug( $slug ) {
		return in_array( $slug, self::$reserved_slugs, true );
	}

	/**
	 * Schedule a rewrite rules flush.
	 */
	public static function schedule_flush() {
		if ( ! wp_next_scheduled( 'wpct_flush_rewrite_rules' ) ) {
			wp_schedule_single_event( time(), 'wpct_flush_rewrite_rules' );
		}
	}

	/**
	 * Maybe schedule flush when a taxonomy is deleted.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function maybe_schedule_flush_on_delete( $post_id ) {
		$post = get_post( $post_id );

		if ( $post && WPCT_Taxonomy::POST_TYPE === $post->post_type ) {
			self::schedule_flush();
		}
	}
}
