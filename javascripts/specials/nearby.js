( function ( M, $ ) {
	var Icon = M.require( 'Icon' ),
		Nearby = M.require( 'modules/nearby/Nearby' );

	$( function () {
		var
			nearby,
			options = { el: $( '#mw-mf-nearby' ) },
			$btn = $( '#secondary-button' ),
			icon, $icon;

		// Remove user button
		if ( $btn.length ) {
			$btn.remove();
		}

		// Create refresh button on the header
		icon = new Icon( { name: 'refresh',
			id: 'secondary-button',
			additionalClassNames: 'main-header-button',
			tagName: 'a',
			title: mw.msg( 'mobile-frontend-nearby-refresh' ),
			label: mw.msg( 'mobile-frontend-nearby-refresh' )
		} );
		$icon = $( icon.toHtmlString() ).on( 'click', refreshCurrentLocation ).appendTo( '.header' );

		function refresh( options ) {
			if ( nearby ) {
				nearby.initialize( options );
			} else {
				nearby = new Nearby( options );
			}
		}

		// Routing on the nearby view

		/*
		 * #/coords/lat,long
		 */
		M.router.route( /^\/coord\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, function ( lat, lon ) {
			$icon.hide();
			// Search with coordinates
			refresh( $.extend( {}, options, {
				latitude: lat,
				longitude: lon
			} ) );
		} );
		/*
		 * #/page/PageTitle
		 */
		M.router.route( /^\/page\/(.+)$/, function ( pageTitle ) {
			$icon.hide();
			refresh( $.extend( {}, options, { pageTitle: pageTitle } ) );
		} );
		function refreshCurrentLocation() {
			$icon.show();
			refresh( $.extend( {}, options, { useCurrentLocation: true } ) );
		}
		/*
		 * Anything else search with current location
		 * FIXME: The regex has to negate the rest of the routes because every time we
		 * define a route with router.route that route gets matched against the
		 * current hash.
		 */
		M.router.route( /^(?!.coord|.page).*$/, refreshCurrentLocation );

	} );

}( mw.mobileFrontend, jQuery ) );
