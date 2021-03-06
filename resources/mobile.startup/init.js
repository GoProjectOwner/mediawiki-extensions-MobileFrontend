// FIXME: make this an object with a constructor to facilitate testing
// (see https://bugzilla.wikimedia.org/show_bug.cgi?id=44264)
/**
 * mobileFrontend namespace
 * @class mw.mobileFrontend
 * @singleton
 */
( function ( M, $ ) {
	var currentPage, skin,
		$cachedIcons = $( '#page-actions' ).find( '.icon' ),
		PageApi = M.require( 'PageApi' ),
		pageApi = new PageApi(),
		Page = M.require( 'Page' ),
		MainMenu = M.require( 'MainMenu' ),
		Skin = M.require( 'Skin' );

	skin = new Skin( {
		el: 'body',
		tabletModules: mw.config.get( 'skin' ) === 'minerva' ? [ 'tablet.scripts' ] : [],
		page: getCurrentPage(),
		mainMenu: new MainMenu()
	} );
	M.define( 'skin', skin );

	$( window )
		.on( 'resize', $.debounce( 100, $.proxy( M, 'emit', 'resize' ) ) )
		.on( 'scroll', $.debounce( 100, $.proxy( M, 'emit', 'scroll' ) ) );

	/**
	 * Get current page view object
	 * FIXME: Move to M.define( 'page' )
	 * @method
	 * @return {Page}
	 */
	function getCurrentPage() {
		if ( currentPage ) {
			return currentPage;
		} else {
			return loadCurrentPage();
		}
	}

	/**
	 * Constructs an incomplete Page object representing the currently loaded page.
	 *
	 * @method
	 * @private
	 * @ignore
	 */
	function loadCurrentPage() {
		var permissions = mw.config.get( 'wgRestrictionEdit', [] );
		if ( permissions.length === 0 ) {
			permissions.push( '*' );
		}
		currentPage = new Page( {
			el: '#content',
			title: mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ),
			protection: {
				edit: permissions
			},
			isMainPage: mw.config.get( 'wgIsMainPage' ),
			isWatched: $( '#ca-watch' ).hasClass( 'watched' ),
			sections: pageApi.getSectionsFromHTML( $( '#content' ) ),
			id: mw.config.get( 'wgArticleId' ),
			namespaceNumber: mw.config.get( 'wgNamespaceNumber' )
		} );
		return currentPage;
	}

	$.extend( M, {
		getCurrentPage: getCurrentPage
	} );

	M.define( 'pageApi', pageApi );

	// Recruit volunteers through the console (note console.log may not be a function so check via apply)
	if ( window.console && window.console.log && window.console.log.apply &&
			mw.config.get( 'wgMFEnableJSConsoleRecruitment' ) ) {
		console.log( mw.msg( 'mobile-frontend-console-recruit' ) );
	}

	// FIXME: Remove when old icon classes are no longer in page html.
	if ( $cachedIcons.length ) {
		// load the missing modules...
		mw.loader.load( [ 'mediawiki.ui.icon', 'skins.minerva.icons.images' ] );
		$cachedIcons.addClass( 'mw-ui-icon mw-ui-icon-element' ).removeClass( 'icon' );
		$cachedIcons.filter( '.icon-text' ).addClass( 'mw-ui-icon-before' ).removeClass( 'icon-text mw-ui-icon-element' );
	}

	mw.loader.using( 'mobile.loggingSchemas' ).done( function () {
		M.require( 'Schema' ).flushBeacon();
	} );

}( mw.mobileFrontend, jQuery ) );
